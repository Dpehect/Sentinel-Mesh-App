import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  rename,
  writeFile
} from "node:fs/promises";
import path from "node:path";

import type {
  ApprovalRequest,
  RecoveryCheckpoint,
  RolloutControlEvent,
  RolloutControlRecord,
  RolloutStore,
  StoreSnapshot
} from "./types.js";

export type {
  ApprovalDecision,
  ApprovalRequest,
  RecoveryCheckpoint,
  RolloutControlEvent,
  RolloutControlRecord,
  RolloutControlState,
  RolloutStore,
  RolloutWaveSummary,
  StoreSnapshot
} from "./types.js";

const emptySnapshot = (): StoreSnapshot => ({
  records: [],
  events: [],
  checkpoints: []
});

function checksum(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class AtomicJsonRolloutStore implements RolloutStore {
  constructor(private readonly filePath: string) {}

  async read(): Promise<StoreSnapshot> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as StoreSnapshot;
      return {
        records: parsed.records ?? [],
        events: parsed.events ?? [],
        checkpoints: parsed.checkpoints ?? []
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptySnapshot();
      }
      throw error;
    }
  }

  async write(snapshot: StoreSnapshot): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    const payload = JSON.stringify(snapshot, null, 2) + "\n";

    await writeFile(tempPath, payload, {
      encoding: "utf8",
      mode: 0o600
    });

    const handle = await open(tempPath, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }

    await rename(tempPath, this.filePath);
  }
}

export class MemoryRolloutStore implements RolloutStore {
  private snapshot: StoreSnapshot = emptySnapshot();

  async read(): Promise<StoreSnapshot> {
    return clone(this.snapshot);
  }

  async write(snapshot: StoreSnapshot): Promise<void> {
    this.snapshot = clone(snapshot);
  }
}

function event(
  rolloutId: string,
  type: RolloutControlEvent["type"],
  actor: string,
  expectedVersion: number,
  details?: RolloutControlEvent["details"],
  now = new Date()
): RolloutControlEvent {
  return {
    eventId: randomUUID(),
    rolloutId,
    type,
    actor,
    occurredAt: now.toISOString(),
    expectedVersion,
    details
  };
}

function requireRecord(
  snapshot: StoreSnapshot,
  rolloutId: string
): RolloutControlRecord {
  const record = snapshot.records.find(item => item.rolloutId === rolloutId);
  if (!record) throw new Error(`Rollout ${rolloutId} was not found`);
  return record;
}

function requireVersion(
  record: RolloutControlRecord,
  expectedVersion: number
): void {
  if (record.version !== expectedVersion) {
    throw new Error(
      `Version conflict: expected ${expectedVersion}, current ${record.version}`
    );
  }
}

export class RolloutControlPlane {
  constructor(private readonly store: RolloutStore) {}

  async list(): Promise<RolloutControlRecord[]> {
    const snapshot = await this.store.read();
    return snapshot.records
      .map(clone)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(rolloutId: string): Promise<{
    record: RolloutControlRecord;
    events: RolloutControlEvent[];
    checkpoints: RecoveryCheckpoint[];
  }> {
    const snapshot = await this.store.read();
    return {
      record: clone(requireRecord(snapshot, rolloutId)),
      events: snapshot.events
        .filter(item => item.rolloutId === rolloutId)
        .map(clone),
      checkpoints: snapshot.checkpoints
        .filter(item => item.rolloutId === rolloutId)
        .map(clone)
    };
  }

  async create(
    input: Omit<
      RolloutControlRecord,
      "state" | "version" | "createdAt" | "updatedAt"
    >,
    now = new Date()
  ): Promise<RolloutControlRecord> {
    const snapshot = await this.store.read();
    if (snapshot.records.some(item => item.rolloutId === input.rolloutId)) {
      throw new Error(`Rollout ${input.rolloutId} already exists`);
    }

    const timestamp = now.toISOString();
    const record: RolloutControlRecord = {
      ...clone(input),
      state: input.approvalRequired ? "awaiting-approval" : "approved",
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    snapshot.records.push(record);
    snapshot.events.push(
      event(
        record.rolloutId,
        "created",
        record.createdBy,
        0,
        { approvalRequired: record.approvalRequired },
        now
      )
    );

    if (record.approvalRequired) {
      snapshot.events.push(
        event(
          record.rolloutId,
          "approval-requested",
          record.createdBy,
          1,
          undefined,
          now
        )
      );
    }

    await this.store.write(snapshot);
    return clone(record);
  }

  async decideApproval(
    request: ApprovalRequest,
    now = new Date()
  ): Promise<RolloutControlRecord> {
    const snapshot = await this.store.read();
    const record = requireRecord(snapshot, request.rolloutId);
    requireVersion(record, request.expectedVersion);

    if (record.state !== "awaiting-approval") {
      throw new Error("Rollout is not awaiting approval");
    }

    record.version += 1;
    record.updatedAt = now.toISOString();

    if (request.decision === "approve") {
      record.state = "approved";
      record.approvedBy = request.actor;
      record.approvedAt = now.toISOString();
      snapshot.events.push(
        event(
          record.rolloutId,
          "approved",
          request.actor,
          request.expectedVersion,
          undefined,
          now
        )
      );
    } else {
      record.state = "failed";
      record.rejectionReason =
        request.reason?.trim() || "Rejected without a reason";
      snapshot.events.push(
        event(
          record.rolloutId,
          "rejected",
          request.actor,
          request.expectedVersion,
          { reason: record.rejectionReason },
          now
        )
      );
    }

    await this.store.write(snapshot);
    return clone(record);
  }

  async transition(
    rolloutId: string,
    action: "start" | "pause" | "resume" | "complete" | "fail",
    actor: string,
    expectedVersion: number,
    now = new Date()
  ): Promise<RolloutControlRecord> {
    const snapshot = await this.store.read();
    const record = requireRecord(snapshot, rolloutId);
    requireVersion(record, expectedVersion);

    const allowed: Record<typeof action, RolloutControlRecord["state"][]> = {
      start: ["approved", "paused"],
      pause: ["running"],
      resume: ["paused"],
      complete: ["running"],
      fail: ["approved", "running", "paused", "rolling-back"]
    };

    if (!allowed[action].includes(record.state)) {
      throw new Error(
        `Transition ${action} is not allowed from ${record.state}`
      );
    }

    const stateMap: Record<typeof action, RolloutControlRecord["state"]> = {
      start: "running",
      pause: "paused",
      resume: "running",
      complete: "completed",
      fail: "failed"
    };

    const eventMap: Record<typeof action, RolloutControlEvent["type"]> = {
      start: "started",
      pause: "paused",
      resume: "resumed",
      complete: "completed",
      fail: "failed"
    };

    record.state = stateMap[action];
    record.version += 1;
    record.updatedAt = now.toISOString();
    snapshot.events.push(
      event(
        record.rolloutId,
        eventMap[action],
        actor,
        expectedVersion,
        undefined,
        now
      )
    );

    await this.store.write(snapshot);
    return clone(record);
  }

  async createCheckpoint(
    rolloutId: string,
    actor: string,
    expectedVersion: number,
    now = new Date()
  ): Promise<RecoveryCheckpoint> {
    const snapshot = await this.store.read();
    const record = requireRecord(snapshot, rolloutId);
    requireVersion(record, expectedVersion);

    const checkpoint: RecoveryCheckpoint = {
      checkpointId: randomUUID(),
      rolloutId,
      createdAt: now.toISOString(),
      createdBy: actor,
      rolloutVersion: record.version,
      snapshot: clone(record),
      checksum: checksum(record)
    };

    record.checkpointId = checkpoint.checkpointId;
    record.version += 1;
    record.updatedAt = now.toISOString();
    snapshot.checkpoints.push(checkpoint);
    snapshot.events.push(
      event(
        rolloutId,
        "checkpoint-created",
        actor,
        expectedVersion,
        { checkpointId: checkpoint.checkpointId },
        now
      )
    );

    await this.store.write(snapshot);
    return clone(checkpoint);
  }

  async recover(
    rolloutId: string,
    checkpointId: string,
    actor: string,
    expectedVersion: number,
    now = new Date()
  ): Promise<RolloutControlRecord> {
    const snapshot = await this.store.read();
    const current = requireRecord(snapshot, rolloutId);
    requireVersion(current, expectedVersion);

    const checkpoint = snapshot.checkpoints.find(
      item =>
        item.rolloutId === rolloutId &&
        item.checkpointId === checkpointId
    );

    if (!checkpoint) throw new Error("Recovery checkpoint was not found");
    if (checksum(checkpoint.snapshot) !== checkpoint.checksum) {
      throw new Error("Recovery checkpoint integrity verification failed");
    }

    const recovered: RolloutControlRecord = {
      ...clone(checkpoint.snapshot),
      state: "paused",
      version: current.version + 1,
      updatedAt: now.toISOString(),
      checkpointId
    };

    snapshot.records = snapshot.records.map(item =>
      item.rolloutId === rolloutId ? recovered : item
    );

    snapshot.events.push(
      event(
        rolloutId,
        "recovered",
        actor,
        expectedVersion,
        { checkpointId },
        now
      )
    );

    await this.store.write(snapshot);
    return clone(recovered);
  }

  async prune(
    retentionDays: number,
    now = new Date()
  ): Promise<{ eventsRemoved: number; checkpointsRemoved: number }> {
    if (!Number.isInteger(retentionDays) || retentionDays < 1) {
      throw new Error("retentionDays must be a positive integer");
    }

    const snapshot = await this.store.read();
    const cutoff = now.getTime() - retentionDays * 86400000;
    const eventsBefore = snapshot.events.length;
    const checkpointsBefore = snapshot.checkpoints.length;

    snapshot.events = snapshot.events.filter(
      item => new Date(item.occurredAt).getTime() >= cutoff
    );

    snapshot.checkpoints = snapshot.checkpoints.filter(
      item => new Date(item.createdAt).getTime() >= cutoff
    );

    await this.store.write(snapshot);
    return {
      eventsRemoved: eventsBefore - snapshot.events.length,
      checkpointsRemoved:
        checkpointsBefore - snapshot.checkpoints.length
    };
  }
}

import { randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  rename,
  writeFile
} from "node:fs/promises";
import path from "node:path";

import type {
  HealthSnapshot,
  IncidentSeverity,
  IncidentStatus,
  NotificationRule,
  OperationsRole,
  OperationsSnapshot,
  OperationsStore,
  SecurityIncident,
  TeamMember
} from "./types.js";

export type {
  HealthSnapshot,
  IncidentSeverity,
  IncidentStatus,
  NotificationRule,
  OperationsRole,
  OperationsSnapshot,
  OperationsStore,
  SecurityIncident,
  TeamMember
} from "./types.js";

const emptySnapshot = (): OperationsSnapshot => ({
  members: [],
  incidents: [],
  rules: [],
  health: []
});

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class AtomicJsonOperationsStore implements OperationsStore {
  constructor(private readonly filePath: string) {}

  async read(): Promise<OperationsSnapshot> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as OperationsSnapshot;
      return {
        members: parsed.members ?? [],
        incidents: parsed.incidents ?? [],
        rules: parsed.rules ?? [],
        health: parsed.health ?? []
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptySnapshot();
      }
      throw error;
    }
  }

  async write(snapshot: OperationsSnapshot): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temp, JSON.stringify(snapshot, null, 2) + "\n", {
      mode: 0o600
    });
    const handle = await open(temp, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temp, this.filePath);
  }
}

export class MemoryOperationsStore implements OperationsStore {
  private snapshot = emptySnapshot();

  async read(): Promise<OperationsSnapshot> {
    return clone(this.snapshot);
  }

  async write(snapshot: OperationsSnapshot): Promise<void> {
    this.snapshot = clone(snapshot);
  }
}

const permissionMatrix: Record<
  OperationsRole,
  Set<string>
> = {
  owner: new Set([
    "member:create",
    "member:update",
    "incident:create",
    "incident:update",
    "rule:create",
    "rule:update",
    "health:write"
  ]),
  "security-admin": new Set([
    "member:update",
    "incident:create",
    "incident:update",
    "rule:create",
    "rule:update",
    "health:write"
  ]),
  analyst: new Set([
    "incident:create",
    "incident:update"
  ]),
  operator: new Set([
    "incident:update",
    "health:write"
  ]),
  viewer: new Set()
};

export function roleCan(
  role: OperationsRole,
  permission: string
): boolean {
  return permissionMatrix[role].has(permission);
}

export class OperationsCenter {
  constructor(private readonly store: OperationsStore) {}

  async overview(): Promise<OperationsSnapshot> {
    return clone(await this.store.read());
  }

  async addMember(
    actorRole: OperationsRole,
    input: Omit<TeamMember, "memberId" | "createdAt" | "updatedAt">,
    now = new Date()
  ): Promise<TeamMember> {
    if (!roleCan(actorRole, "member:create")) {
      throw new Error("Actor role cannot create members");
    }

    const snapshot = await this.store.read();
    if (snapshot.members.some(item => item.email === input.email)) {
      throw new Error("A member with this email already exists");
    }

    const member: TeamMember = {
      ...input,
      memberId: randomUUID(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    snapshot.members.push(member);
    await this.store.write(snapshot);
    return clone(member);
  }

  async updateMemberRole(
    actorRole: OperationsRole,
    memberId: string,
    role: OperationsRole,
    now = new Date()
  ): Promise<TeamMember> {
    if (!roleCan(actorRole, "member:update")) {
      throw new Error("Actor role cannot update members");
    }

    const snapshot = await this.store.read();
    const member = snapshot.members.find(item => item.memberId === memberId);
    if (!member) throw new Error("Member was not found");

    member.role = role;
    member.updatedAt = now.toISOString();
    await this.store.write(snapshot);
    return clone(member);
  }

  async createIncident(
    actorRole: OperationsRole,
    input: Omit<
      SecurityIncident,
      "incidentId" | "createdAt" | "updatedAt" | "version"
    >,
    now = new Date()
  ): Promise<SecurityIncident> {
    if (!roleCan(actorRole, "incident:create")) {
      throw new Error("Actor role cannot create incidents");
    }

    const snapshot = await this.store.read();
    const incident: SecurityIncident = {
      ...input,
      incidentId: randomUUID(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: 1
    };

    snapshot.incidents.push(incident);
    await this.store.write(snapshot);
    return clone(incident);
  }

  async transitionIncident(
    actorRole: OperationsRole,
    incidentId: string,
    status: IncidentStatus,
    expectedVersion: number,
    now = new Date()
  ): Promise<SecurityIncident> {
    if (!roleCan(actorRole, "incident:update")) {
      throw new Error("Actor role cannot update incidents");
    }

    const snapshot = await this.store.read();
    const incident = snapshot.incidents.find(
      item => item.incidentId === incidentId
    );

    if (!incident) throw new Error("Incident was not found");
    if (incident.version !== expectedVersion) {
      throw new Error(
        `Version conflict: expected ${expectedVersion}, current ${incident.version}`
      );
    }

    const allowed: Record<IncidentStatus, IncidentStatus[]> = {
      open: ["investigating", "resolved"],
      investigating: ["contained", "resolved"],
      contained: ["resolved", "investigating"],
      resolved: ["investigating"]
    };

    if (!allowed[incident.status].includes(status)) {
      throw new Error(
        `Transition ${incident.status} -> ${status} is not allowed`
      );
    }

    incident.status = status;
    incident.version += 1;
    incident.updatedAt = now.toISOString();
    await this.store.write(snapshot);
    return clone(incident);
  }

  async createRule(
    actorRole: OperationsRole,
    input: Omit<NotificationRule, "ruleId" | "createdAt" | "updatedAt">,
    now = new Date()
  ): Promise<NotificationRule> {
    if (!roleCan(actorRole, "rule:create")) {
      throw new Error("Actor role cannot create notification rules");
    }

    if (input.cooldownMinutes < 1) {
      throw new Error("cooldownMinutes must be at least 1");
    }

    const snapshot = await this.store.read();
    const rule: NotificationRule = {
      ...input,
      ruleId: randomUUID(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    snapshot.rules.push(rule);
    await this.store.write(snapshot);
    return clone(rule);
  }

  async recordHealth(
    actorRole: OperationsRole,
    input: HealthSnapshot
  ): Promise<HealthSnapshot> {
    if (!roleCan(actorRole, "health:write")) {
      throw new Error("Actor role cannot write health snapshots");
    }

    const snapshot = await this.store.read();
    snapshot.health = [
      input,
      ...snapshot.health.filter(
        item => item.component !== input.component
      )
    ];
    await this.store.write(snapshot);
    return clone(input);
  }

  async deriveNotifications(): Promise<Array<{
    ruleId: string;
    incidentId: string;
    channels: NotificationRule["channels"];
    reason: string;
  }>> {
    const snapshot = await this.store.read();
    const notifications: Array<{
      ruleId: string;
      incidentId: string;
      channels: NotificationRule["channels"];
      reason: string;
    }> = [];

    for (const rule of snapshot.rules.filter(item => item.enabled)) {
      for (const incident of snapshot.incidents) {
        if (
          incident.status !== "resolved" &&
          rule.severities.includes(incident.severity)
        ) {
          notifications.push({
            ruleId: rule.ruleId,
            incidentId: incident.incidentId,
            channels: rule.channels,
            reason: `${incident.severity} incident matched ${rule.name}`
          });
        }
      }
    }

    return notifications;
  }

  async healthSummary(): Promise<{
    overall: "healthy" | "degraded" | "critical";
    components: number;
    critical: number;
    degraded: number;
  }> {
    const snapshot = await this.store.read();
    const critical = snapshot.health.filter(
      item => item.status === "critical"
    ).length;
    const degraded = snapshot.health.filter(
      item => item.status === "degraded"
    ).length;

    return {
      overall: critical > 0
        ? "critical"
        : degraded > 0
          ? "degraded"
          : "healthy",
      components: snapshot.health.length,
      critical,
      degraded
    };
  }
}

import {createHash} from "node:crypto";
import type {
  RuntimeEvent,
  RuntimeFinding,
  RuntimeSecurityReport,
  RuntimeSeverity
} from "./types.js";

export type {
  RuntimeEvent,
  RuntimeEventType,
  RuntimeFinding,
  RuntimeSecurityReport,
  RuntimeSeverity
} from "./types.js";

const weights: Record<RuntimeSeverity, number> = {
  critical:35, high:20, medium:8, low:3
};

function makeFinding(
  event: RuntimeEvent,
  ruleId: string,
  severity: RuntimeSeverity,
  title: string,
  evidence: string,
  action: RuntimeFinding["action"]
): RuntimeFinding {
  const fingerprint = createHash("sha256")
    .update(`${event.containerId}|${event.timestamp}|${ruleId}|${evidence}`)
    .digest("hex");

  return {
    id:`runtime_${fingerprint.slice(0, 16)}`,
    ruleId,
    containerId:event.containerId,
    severity,
    title,
    evidence,
    action
  };
}

export function analyzeRuntimeEvents(
  events: RuntimeEvent[]
): RuntimeSecurityReport {
  const findings: RuntimeFinding[] = [];

  for (const event of events) {
    const process = (event.process ?? "").toLowerCase();
    const args = (event.arguments ?? []).join(" ").toLowerCase();
    const path = (event.path ?? "").toLowerCase();

    if (
      event.type === "process-start" &&
      ["bash","sh","zsh","nc","netcat","socat"].some(item =>
        process.endsWith(item) || process.endsWith(`/${item}`)
      )
    ) {
      findings.push(makeFinding(
        event, "RUNTIME-PROC-001", "high",
        "Interactive or network-capable shell started",
        `${event.process ?? "unknown"} ${args}`.trim(),
        "alert"
      ));
    }

    if (
      event.type === "process-start" &&
      /(curl|wget).*(\||bash|sh)|base64\s+-d|chmod\s+\+x/.test(`${process} ${args}`)
    ) {
      findings.push(makeFinding(
        event, "RUNTIME-EXEC-001", "critical",
        "Suspicious download-and-execute behavior",
        `${event.process ?? "unknown"} ${args}`.trim(),
        "isolate"
      ));
    }

    if (
      event.type === "file-write" &&
      ["/etc/passwd","/etc/shadow","/root/.ssh/authorized_keys"].includes(path)
    ) {
      findings.push(makeFinding(
        event, "RUNTIME-FILE-001", "critical",
        "Sensitive host-style identity file modified",
        event.path ?? "unknown",
        "isolate"
      ));
    }

    if (
      event.type === "file-write" &&
      (path.startsWith("/proc/") || path.startsWith("/sys/"))
    ) {
      findings.push(makeFinding(
        event, "RUNTIME-KERNEL-001", "high",
        "Kernel or process filesystem modified",
        event.path ?? "unknown",
        "alert"
      ));
    }

    if (
      event.type === "network-connect" &&
      event.destinationPort !== undefined &&
      [22,23,4444,5555,6667].includes(event.destinationPort)
    ) {
      findings.push(makeFinding(
        event, "RUNTIME-NET-001", "high",
        "Connection to high-risk destination port",
        `${event.destination ?? "unknown"}:${event.destinationPort}`,
        "alert"
      ));
    }

    if (
      event.type === "privilege-change" &&
      (event.userId === 0 || (event.capabilities ?? []).includes("SYS_ADMIN"))
    ) {
      findings.push(makeFinding(
        event, "RUNTIME-PRIV-001", "critical",
        "Container gained root or SYS_ADMIN privilege",
        `uid=${event.userId ?? "unknown"} capabilities=${(event.capabilities ?? []).join(",")}`,
        "isolate"
      ));
    }

    if (event.type === "namespace-change") {
      findings.push(makeFinding(
        event, "RUNTIME-NS-001", "critical",
        "Container attempted namespace manipulation",
        `${event.process ?? "unknown"} ${args}`.trim(),
        "isolate"
      ));
    }
  }

  const penalty = findings.reduce((sum, item) => sum + weights[item.severity], 0);
  const containersToIsolate = [...new Set(
    findings.filter(item => item.action === "isolate").map(item => item.containerId)
  )];

  return {
    score:Math.max(0, Math.min(100, 100 - penalty)),
    eventsChecked:events.length,
    findings,
    containersToIsolate
  };
}

export function shouldIsolateContainer(
  report: RuntimeSecurityReport,
  containerId: string
): boolean {
  return report.containersToIsolate.includes(containerId);
}

export function createRuntimeSummary(report: RuntimeSecurityReport): string {
  return [
    `Runtime security score: ${report.score}/100`,
    `Events checked: ${report.eventsChecked}`,
    `Findings: ${report.findings.length}`,
    `Containers to isolate: ${report.containersToIsolate.length}`
  ].join("\n");
}

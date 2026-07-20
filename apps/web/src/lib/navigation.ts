export interface ConsoleNavigationItem {
  href: string;
  label: string;
  description: string;
  group:
    | "overview"
    | "security"
    | "agents"
    | "operations"
    | "platform";
}

export const consoleNavigation: ConsoleNavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Security posture and current risk",
    group: "overview"
  },
  {
    href: "/command-center",
    label: "Command Center",
    description: "Unified final product overview",
    group: "overview"
  },
  {
    href: "/findings",
    label: "Findings",
    description: "Evidence-backed security findings",
    group: "security"
  },
  {
    href: "/attack-paths",
    label: "Attack Paths",
    description: "Exposure and lateral movement analysis",
    group: "security"
  },
  {
    href: "/intelligence",
    label: "Intelligence",
    description: "Explainable security intelligence",
    group: "security"
  },
  {
    href: "/scans",
    label: "Scans",
    description: "Local and queued scan execution",
    group: "security"
  },
  {
    href: "/rollouts",
    label: "Agent Rollouts",
    description: "Canary deployment and recovery",
    group: "agents"
  },
  {
    href: "/operations",
    label: "Operations",
    description: "Incidents, alerts and health",
    group: "operations"
  },
  {
    href: "/team",
    label: "Team",
    description: "Role and access governance",
    group: "operations"
  },
  {
    href: "/enterprise",
    label: "Enterprise",
    description: "Tenants, policy and compliance",
    group: "operations"
  },
  {
    href: "/system",
    label: "System",
    description: "Release readiness and diagnostics",
    group: "platform"
  },
  {
    href: "/backups",
    label: "Backups",
    description: "Local disaster recovery",
    group: "platform"
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Platform configuration",
    group: "platform"
  }
];

export const consoleNavigationGroups = [
  { id: "overview", label: "Overview" },
  { id: "security", label: "Security" },
  { id: "agents", label: "Agents" },
  { id: "operations", label: "Operations" },
  { id: "platform", label: "Platform" }
] as const;

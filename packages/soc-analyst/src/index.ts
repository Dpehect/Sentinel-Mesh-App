import type {
  AnalystCase,
  AnalystRecommendation,
  AnalystSeverity,
  AnalystSignal
} from "./types.js";

export type {
  AnalystCase,
  AnalystRecommendation,
  AnalystSeverity,
  AnalystSignal
} from "./types.js";

const severityRank: Record<AnalystSeverity, number> = {
  low:1, medium:2, high:3, critical:4
};

export function analyzeSocSignals(
  signals: AnalystSignal[]
): AnalystCase {
  const sorted = [...signals].sort((a,b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const highest = sorted.reduce<AnalystSeverity>(
    (current,item) =>
      severityRank[item.severity] > severityRank[current]
        ? item.severity
        : current,
    "low"
  );

  const averageConfidence = sorted.length
    ? Math.round(sorted.reduce(
        (sum,item)=>sum + Math.max(0,Math.min(100,item.confidence ?? 70)),
        0
      ) / sorted.length)
    : 0;

  const sources = [...new Set(sorted.map(item=>item.source))];
  const techniques = [...new Set(
    sorted.flatMap(item=>item.mitreTechniques ?? [])
  )];
  const evidenceIds = [...new Set(
    sorted.flatMap(item=>item.evidenceIds ?? [])
  )];

  const recommendations: AnalystRecommendation[] = [];

  if (sorted.some(item =>
    item.severity === "critical" &&
    ["endpoint","network","identity","runtime"].includes(item.source)
  )) {
    recommendations.push({
      action:"isolate-affected-entity",
      priority:100,
      requiresApproval:true,
      reason:"Critical active compromise signal"
    });
  }

  if (sources.includes("identity")) {
    recommendations.push({
      action:"revoke-active-sessions",
      priority:90,
      requiresApproval:true,
      reason:"Identity compromise context present"
    });
  }

  if (sources.includes("endpoint")) {
    recommendations.push({
      action:"collect-endpoint-triage",
      priority:80,
      requiresApproval:false,
      reason:"Endpoint evidence requires preservation"
    });
  }

  if (sources.includes("network")) {
    recommendations.push({
      action:"block-malicious-destination",
      priority:85,
      requiresApproval:true,
      reason:"Network compromise indicators present"
    });
  }

  if (techniques.length > 0) {
    recommendations.push({
      action:"open-incident-case",
      priority:75,
      requiresApproval:false,
      reason:"MITRE ATT&CK techniques were mapped"
    });
  }

  const uniqueRecommendations = [...new Map(
    recommendations.map(item=>[item.action,item])
  ).values()].sort((a,b)=>b.priority-a.priority);

  const decision =
    highest === "critical" && averageConfidence >= 75
      ? "contain"
      : highest === "high" || averageConfidence >= 60
        ? "investigate"
        : "close";

  const summary = sorted.length
    ? `${sorted.length} correlated security signals from ${sources.length} sources. Highest severity: ${highest}. Confidence: ${averageConfidence}/100.`
    : "No security signals were provided.";

  return {
    title:sorted.length
      ? `SOC investigation: ${sorted[0].title}`
      : "SOC investigation",
    severity:highest,
    confidence:averageConfidence,
    summary,
    timeline:sorted.map(item =>
      `${item.timestamp} | ${item.source} | ${item.title}`
    ),
    evidenceIds,
    mitreTechniques:techniques,
    recommendations:uniqueRecommendations,
    decision
  };
}

export function createAnalystBrief(analystCase: AnalystCase): string {
  return [
    analystCase.title,
    analystCase.summary,
    `Decision: ${analystCase.decision}`,
    `Evidence items: ${analystCase.evidenceIds.length}`,
    `MITRE techniques: ${analystCase.mitreTechniques.join(", ") || "None"}`,
    `Recommended actions: ${analystCase.recommendations.map(item=>item.action).join(", ") || "None"}`
  ].join("\n");
}

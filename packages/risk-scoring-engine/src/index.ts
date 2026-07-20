export interface RiskSignal {
  category: string;
  score: number;
  weight?: number;
  businessImpact?: number;
}

export interface RiskResult {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  categoryScores: Record<string, number>;
}

export function calculateEnterpriseRisk(signals: RiskSignal[]): RiskResult {
  if (!signals.length) return {score:0, level:"LOW", categoryScores:{}};

  const categoryTotals = new Map<string, {weighted:number; weight:number}>();
  let weightedTotal = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    const weight = Math.max(0.1, signal.weight ?? 1);
    const impactMultiplier = 1 + Math.max(0, Math.min(100, signal.businessImpact ?? 0)) / 200;
    const normalizedScore = Math.max(0, Math.min(100, signal.score));
    const adjusted = normalizedScore * impactMultiplier;

    weightedTotal += adjusted * weight;
    totalWeight += weight;

    const current = categoryTotals.get(signal.category) ?? {weighted:0, weight:0};
    current.weighted += adjusted * weight;
    current.weight += weight;
    categoryTotals.set(signal.category, current);
  }

  const score = Math.max(0, Math.min(100, Math.round(weightedTotal / totalWeight)));
  const level = score >= 90 ? "CRITICAL" : score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  const categoryScores = Object.fromEntries(
    [...categoryTotals.entries()].map(([category, value]) => [
      category,
      Math.max(0, Math.min(100, Math.round(value.weighted / value.weight)))
    ])
  );

  return {score, level, categoryScores};
}

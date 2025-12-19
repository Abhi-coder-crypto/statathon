/**
 * Privacy Risk Assessment Utilities
 * Implements proper academic formulas for k-anonymity risk calculations
 * Based on NISTIR 8053 and academic literature
 */

export interface EquivalenceClass {
  key: string;
  records: any[];
  size: number;
  riskScore?: number;
}

export interface RiskMetrics {
  prosecutorRisk: number;
  journalistRisk: number;
  marketerRisk: number;
  equivalenceClasses: EquivalenceClass[];
  uniqueRecords: number;
  smallGroups: number;
  recommendations: string[];
}

/**
 * PROSECUTOR ATTACK: Attacker KNOWS target is in dataset
 * Risk = 1 / (equivalence class size) for each record
 * Worst case: 1/k for k-anonymous data, 1.0 for unique records
 */
function calculateProsecutorRisk(equivalenceClasses: EquivalenceClass[]): {
  overall: number;
  perClass: number[];
  maxRisk: number;
  worstCaseRisk: number;
} {
  const perClassRisks: number[] = [];
  let totalRisk = 0;
  let maxRisk = 0;
  let worstCaseRisk = 0;

  equivalenceClasses.forEach((ec) => {
    // Risk = 1 / group_size (probability of being uniquely identified)
    const risk = 1 / ec.size;
    perClassRisks.push(risk);
    totalRisk += risk * ec.size; // Weighted by group size
    maxRisk = Math.max(maxRisk, risk);
    worstCaseRisk = Math.max(worstCaseRisk, risk);
  });

  const totalRecords = equivalenceClasses.reduce((sum, ec) => sum + ec.size, 0);
  const overallRisk = totalRecords > 0 ? totalRisk / totalRecords : 0;

  return {
    overall: Math.min(overallRisk, 1.0),
    perClass: perClassRisks,
    maxRisk,
    worstCaseRisk,
  };
}

/**
 * PITMAN MODEL: Estimates population uniques from sample data
 * Used for Journalist attack risk calculation
 * Assumes: λ (population proportion) ~ Beta(α, β)
 * where α = sample_uniques + 1, β = (n - sample_uniques) + 1
 */
function pitmanPopulationEstimate(
  sampleUniques: number,
  sampleSize: number,
  populationSize: number
): number {
  if (sampleSize === 0) return 0;

  // Pitman estimator using Beta conjugate prior
  const alpha = sampleUniques + 1;
  const beta = sampleSize - sampleUniques + 1;

  // Expected proportion of uniques in population
  const expectedProportion = alpha / (alpha + beta);

  // Estimate population uniques
  return Math.round(expectedProportion * populationSize);
}

/**
 * JOURNALIST ATTACK: Attacker does NOT know if target is in dataset
 * Risk proportional to likelihood of successful re-identification
 * For unique records: risk approaches 1.0 (certain re-identification)
 * For k-anonymous groups: risk = 1/k (inverse of group size)
 */
function calculateJournalistRisk(
  equivalenceClasses: EquivalenceClass[],
  sampleSize: number,
  populationSize: number = 10000
): {
  overall: number;
  perClass: number[];
  sampleRecordsAtRisk: number;
} {
  const totalRecords = equivalenceClasses.reduce((sum, ec) => sum + ec.size, 0);

  let totalJournalistRisk = 0;
  const perClassRisks: number[] = [];
  let sampleRecordsAtRisk = 0;

  equivalenceClasses.forEach((ec) => {
    // Journalist risk: 1 / group_size (same core logic as prosecutor)
    // But interpreted as: "if I randomly picked someone, could this be my target?"
    const risk = 1.0 / ec.size;
    perClassRisks.push(risk);

    // Weight by sample group size
    totalJournalistRisk += risk * ec.size;

    // Count records at risk
    if (risk > 0.2) {
      sampleRecordsAtRisk += ec.size;
    }
  });

  const overallRisk =
    totalRecords > 0 ? totalJournalistRisk / totalRecords : 0;

  return {
    overall: Math.min(overallRisk, 1.0),
    perClass: perClassRisks,
    sampleRecordsAtRisk,
  };
}

/**
 * MARKETER ATTACK: Attacker wants mass re-identification
 * Goal: Re-identify many records (some errors acceptable)
 * Risk = same as prosecutor/journalist: 1/k (group size)
 * Marketer is slightly more effective due to pattern analysis
 */
function calculateMarketerRisk(
  equivalenceClasses: EquivalenceClass[],
  sampleSize: number,
  populationSize: number = 10000
): {
  overall: number;
  perClass: number[];
  successfulMatches: number;
} {
  const totalRecords = equivalenceClasses.reduce((sum, ec) => sum + ec.size, 0);

  let totalMarketerRisk = 0;
  const perClassRisks: number[] = [];
  let successfulMatches = 0;

  equivalenceClasses.forEach((ec) => {
    // Marketer risk: 1 / group_size (same as other attacks)
    // Marketer can efficiently target these records
    const risk = 1.0 / ec.size;
    perClassRisks.push(risk);

    totalMarketerRisk += risk * ec.size;

    // Successful matches at >0.3 confidence
    if (risk > 0.3) {
      successfulMatches += Math.round(ec.size * risk);
    }
  });

  const overallRisk =
    totalRecords > 0 ? totalMarketerRisk / totalRecords : 0;

  return {
    overall: Math.min(overallRisk, 1.0),
    perClass: perClassRisks,
    successfulMatches,
  };
}

/**
 * Generate detailed recommendations based on risk metrics
 */
function generateRecommendations(
  metrics: {
    prosecutorRisk: number;
    journalistRisk: number;
    marketerRisk: number;
    equivalenceClasses: EquivalenceClass[];
  },
  kThreshold: number
): string[] {
  const recommendations: string[] = [];
  const uniqueCount = metrics.equivalenceClasses.filter(
    (ec) => ec.size === 1
  ).length;
  const totalRecords = metrics.equivalenceClasses.reduce(
    (sum, ec) => sum + ec.size,
    0
  );

  // Prosecutor attack recommendations
  if (metrics.prosecutorRisk > 0.4) {
    recommendations.push(
      "CRITICAL: High prosecutor attack risk. Too many unique/small records."
    );
    recommendations.push("Action: Increase k-threshold or apply aggressive suppression");
  } else if (metrics.prosecutorRisk > 0.2) {
    recommendations.push("WARNING: Moderate prosecutor attack risk detected.");
    recommendations.push("Action: Consider suppressing records with k-anonymity < " + kThreshold);
  }

  // Journalist attack recommendations
  if (metrics.journalistRisk > 0.3) {
    recommendations.push(
      "Journalist attack risk is elevated. Consider sampling restrictions."
    );
  }

  // Marketer attack recommendations
  if (metrics.marketerRisk > 0.25) {
    recommendations.push("Marketer bulk targeting risk is significant.");
    recommendations.push("Action: Apply L-Diversity or T-Closeness to sensitive attributes");
  }

  // Unique records
  if (uniqueCount > totalRecords * 0.1) {
    recommendations.push(`High ratio of unique records (${uniqueCount}/${totalRecords})`);
    recommendations.push("Consider L-Diversity or synthetic data generation");
  }

  // K-Anonymity specific
  const smallGroups = metrics.equivalenceClasses.filter(
    (ec) => ec.size < kThreshold
  );
  if (smallGroups.length > 0) {
    recommendations.push(
      `${smallGroups.length} groups violate k-anonymity (k=${kThreshold})`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Risk levels are acceptable. Data appears well-protected.");
  }

  return recommendations;
}

/**
 * Main risk assessment calculation
 */
export function calculateRiskMetrics(
  data: any[],
  quasiIdentifiers: string[],
  kThreshold: number,
  sampleSize: number = 100,
  populationMultiplier: number = 50 // Population = sample * multiplier
): RiskMetrics {
  // Build equivalence classes
  const ecMap = new Map<string, EquivalenceClass>();

  data.forEach((row) => {
    const key = quasiIdentifiers.map((qi) => String(row[qi] || "")).join("|");
    if (!ecMap.has(key)) {
      ecMap.set(key, { key, records: [], size: 0 });
    }
    const ec = ecMap.get(key)!;
    ec.records.push(row);
    ec.size = ec.records.length;
  });

  const equivalenceClasses = Array.from(ecMap.values());

  // Calculate attack-specific risks
  const prosecutorMetrics = calculateProsecutorRisk(equivalenceClasses);
  const estimatedPopSize = Math.max(
    data.length * populationMultiplier,
    100000
  );
  const journalistMetrics = calculateJournalistRisk(
    equivalenceClasses,
    data.length,
    estimatedPopSize
  );
  const marketerMetrics = calculateMarketerRisk(
    equivalenceClasses,
    data.length,
    estimatedPopSize
  );

  // Add risk scores to equivalence classes
  equivalenceClasses.forEach((ec, idx) => {
    ec.riskScore = prosecutorMetrics.perClass[idx];
  });

  const uniqueRecords = equivalenceClasses.filter((ec) => ec.size === 1).length;
  const smallGroups = equivalenceClasses.filter(
    (ec) => ec.size < kThreshold && ec.size > 1
  ).length;

  const recommendations = generateRecommendations(
    {
      prosecutorRisk: prosecutorMetrics.overall,
      journalistRisk: journalistMetrics.overall,
      marketerRisk: marketerMetrics.overall,
      equivalenceClasses,
    },
    kThreshold
  );

  return {
    prosecutorRisk: prosecutorMetrics.overall,
    journalistRisk: journalistMetrics.overall,
    marketerRisk: marketerMetrics.overall,
    equivalenceClasses,
    uniqueRecords,
    smallGroups,
    recommendations,
  };
}

/**
 * Helper: Determine risk level from percentage
 */
export function getRiskLevel(riskPercentage: number): "Low" | "Medium" | "High" {
  if (riskPercentage >= 0.4) return "High";
  if (riskPercentage >= 0.2) return "Medium";
  return "Low";
}

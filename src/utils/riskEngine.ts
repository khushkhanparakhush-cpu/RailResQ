import { 
  MetroAsset, 
  AssetFaultLog, 
  AssetRiskAssessment, 
  RiskBand,
  Incident
} from '../types/metro';

/**
 * Heuristic Risk Engine Configuration
 * All weights, thresholds, and limits are centrally declared and configurable here.
 */
export const RISK_ENGINE_CONFIG = {
  // Signal Weights (Max sum = 100)
  weights: {
    faultFrequency30d: 35,       // Max 35 points for recent fault frequency in last 30 days
    repeatedFailurePatterns: 25, // Max 25 points for repeated occurrences of same fault code/category
    frequencyAcceleration: 20,   // Max 20 points for rate increase (last 14d vs prior 14d)
    overdueMaintenance: 20,      // Max 20 points for overdue preventive maintenance cycle
  },
  thresholds: {
    highRiskMinScore: 60,
    mediumRiskMinScore: 30,
    // Days windows
    windowRecentDays: 30,
    windowAccelerationRecentDays: 14,
    windowAccelerationPriorDays: 14,
    // Data sufficiency minimum requirement
    minDaysTrackingRequired: 30,
  },
  copy: {
    disclaimer: 'Rule-based estimate of relative asset failure risk for the next 7 days.',
    insufficientDataReason: 'Insufficient fault history or commissioning period under 30 days — baseline failure trend cannot be established reliably.',
  }
};

export interface RiskEngineOptions {
  analysisDate?: string; // ISO string, defaults to current time or demo reference date
  linkedIncidents?: Incident[]; // Active incidents linked to assets
}

/**
 * Calculates deterministic, explainable next-7-day failure risk for an individual asset.
 * Pure function: Given the same asset and historical logs, always produces the exact same score.
 */
export function calculateAssetRisk(
  asset: MetroAsset,
  faultLogs: AssetFaultLog[],
  options: RiskEngineOptions = {}
): AssetRiskAssessment {
  const analysisTime = options.analysisDate ? new Date(options.analysisDate).getTime() : Date.now();
  const analysisDateIso = new Date(analysisTime).toISOString();

  // Next 7 days outlook
  const outlookStart = analysisDateIso;
  const outlookEnd = new Date(analysisTime + 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Filter relevant historical logs for this asset up to analysis date (Strictly ignore future records)
  const assetLogs = faultLogs.filter(log => {
    if (log.assetId !== asset.id) return false;
    const logTime = new Date(log.timestamp).getTime();
    return logTime <= analysisTime && !isNaN(logTime);
  });

  // Check for unresolved faults (faults with no resolution timestamp up to analysisTime)
  const unresolvedFaults = assetLogs.filter(log => {
    if (!log.resolvedAt) return true;
    const resolvedTime = new Date(log.resolvedAt).getTime();
    return resolvedTime > analysisTime;
  });

  // Also integrate active incidents referencing this asset (without double-counting existing fault logs)
  const relevantIncidents = (options.linkedIncidents || []).filter(inc => {
    if (inc.assetId !== asset.id) return false;
    const incTime = new Date(inc.createdAt).getTime();
    if (incTime > analysisTime) return false;
    return inc.status !== 'Resolved' && inc.status !== 'Closed';
  });

  const reasons: string[] = [];

  // Data Sufficiency Check:
  // If an asset has 0 historical faults and has no last PM date or was installed recently with zero logs,
  // we do not deceptively classify it as "Low Risk" (zero risk). We explicitly flag "Insufficient Data".
  const hasZeroLogs = assetLogs.length === 0;
  const installedYear = asset.installedYear || 2024;
  const currentYear = new Date(analysisTime).getFullYear();
  const isRecentlyCommissioned = currentYear - installedYear <= 0 && hasZeroLogs;

  const hasSufficientData = !(hasZeroLogs && !asset.lastPmDate) && !isRecentlyCommissioned;

  if (!hasSufficientData) {
    return {
      assetId: asset.id,
      asset,
      riskScore: 0,
      riskBand: 'Insufficient Data',
      hasSufficientData: false,
      dataSufficiencyReason: RISK_ENGINE_CONFIG.copy.insufficientDataReason,
      recentFaultsCount: 0,
      totalHistoricalFaults: 0,
      unresolvedFaultsCount: unresolvedFaults.length,
      repeatedFaultPatterns: [],
      frequencyAcceleration: {
        last14dCount: 0,
        prior14dCount: 0,
        difference: 0,
        description: 'Insufficient observation window to measure failure velocity.',
      },
      maintenanceStatus: {
        isOverdue: false,
        daysSinceLastPm: null,
        intervalDays: asset.maintenanceIntervalDays || 30,
        daysOverdueOrRemaining: null,
        label: 'Preventive maintenance schedule not recorded',
      },
      factors: {
        frequencyScore: 0,
        repeatScore: 0,
        accelerationScore: 0,
        maintenanceScore: 0,
      },
      reasons: ['Newly commissioned or unlogged asset — observation period insufficient for statistical failure projection.'],
      analysisDate: analysisDateIso,
      outlookPeriod: { startDate: outlookStart, endDate: outlookEnd },
      unresolvedFaults,
    };
  }

  // --- Signal 1: Fault frequency in last 30 days ---
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const recent30dLogs = assetLogs.filter(log => {
    const t = new Date(log.timestamp).getTime();
    return analysisTime - t <= thirtyDaysMs;
  });

  const recentFaultsCount = recent30dLogs.length;
  let frequencyScore = 0;
  if (recentFaultsCount >= 4) {
    frequencyScore = 35;
    reasons.push(`High failure frequency: ${recentFaultsCount} faults logged in the past 30 days (+35 pts).`);
  } else if (recentFaultsCount === 3) {
    frequencyScore = 28;
    reasons.push(`Frequent fault events: 3 faults logged in past 30 days (+28 pts).`);
  } else if (recentFaultsCount === 2) {
    frequencyScore = 18;
    reasons.push(`Moderate fault activity: 2 faults in past 30 days (+18 pts).`);
  } else if (recentFaultsCount === 1) {
    frequencyScore = 10;
    reasons.push(`Single recent fault in past 30 days (+10 pts).`);
  }

  // Add extra weight if critical severity fault occurred in last 30 days
  const hasCriticalRecent = recent30dLogs.some(l => l.severity === 'Critical');
  if (hasCriticalRecent && frequencyScore > 0) {
    frequencyScore = Math.min(RISK_ENGINE_CONFIG.weights.faultFrequency30d, frequencyScore + 5);
    reasons.push('Contains critical severity fault event within 30-day window.');
  }

  // --- Signal 2: Repeated occurrences of same fault code or category ---
  // Look at faults over the past 60 days
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  const recent60dLogs = assetLogs.filter(log => {
    const t = new Date(log.timestamp).getTime();
    return analysisTime - t <= sixtyDaysMs;
  });

  const codeCounts: Record<string, number> = {};
  recent60dLogs.forEach(l => {
    codeCounts[l.faultCode] = (codeCounts[l.faultCode] || 0) + 1;
  });

  const repeatedPatterns = Object.entries(codeCounts)
    .filter(([_, count]) => count >= 2)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);

  let repeatScore = 0;
  if (repeatedPatterns.length > 0) {
    const maxRepeat = repeatedPatterns[0].count;
    if (maxRepeat >= 3) {
      repeatScore = 25;
      reasons.push(`Chronic recurring failure mode: ${repeatedPatterns[0].code} occurred ${maxRepeat} times in 60d (+25 pts).`);
    } else {
      repeatScore = 16;
      reasons.push(`Repeated failure symptom: ${repeatedPatterns[0].code} occurred ${maxRepeat} times in 60d (+16 pts).`);
    }
  }

  // --- Signal 3: Increase in recent fault frequency (Acceleration) ---
  // Compare [analysisTime - 14d to analysisTime] vs [analysisTime - 28d to analysisTime - 14d]
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const last14dCount = assetLogs.filter(log => {
    const t = new Date(log.timestamp).getTime();
    return analysisTime - t <= fourteenDaysMs;
  }).length;

  const prior14dCount = assetLogs.filter(log => {
    const t = new Date(log.timestamp).getTime();
    const diff = analysisTime - t;
    return diff > fourteenDaysMs && diff <= (28 * 24 * 60 * 60 * 1000);
  }).length;

  const diffCount = last14dCount - prior14dCount;
  let accelerationScore = 0;
  let accelerationDesc = 'Stable rate';

  if (last14dCount >= 2 && prior14dCount === 0) {
    accelerationScore = 20;
    accelerationDesc = `Sharp acceleration: ${last14dCount} faults in last 14d vs 0 in prior 14d`;
    reasons.push(`Fault velocity spike: ${last14dCount} faults recently compared to zero prior (+20 pts).`);
  } else if (diffCount >= 2) {
    accelerationScore = 18;
    accelerationDesc = `Accelerating: +${diffCount} faults compared to prior 14d window`;
    reasons.push(`Fault rate accelerating (+${diffCount} in last 14d vs prior 14d) (+18 pts).`);
  } else if (diffCount === 1 && last14dCount >= 2) {
    accelerationScore = 10;
    accelerationDesc = `Slight upward drift: +1 fault vs prior window`;
    reasons.push(`Slight upward drift in fault occurrence rate (+10 pts).`);
  } else if (last14dCount === 0 && prior14dCount > 0) {
    accelerationDesc = 'Decelerating (no faults in last 14d)';
  } else if (last14dCount === 0 && prior14dCount === 0) {
    accelerationDesc = 'No recent activity in 28 days';
  }

  // --- Signal 4: Overdue Preventive Maintenance ---
  // Validate dates: Missing lastPmDate is NOT treated as confirmed overdue!
  let maintenanceScore = 0;
  let isOverdue = false;
  let daysSinceLastPm: number | null = null;
  let daysOverdueOrRemaining: number | null = null;
  let maintenanceLabel = 'Preventive maintenance schedule not recorded';

  if (asset.lastPmDate) {
    const lastPmTime = new Date(asset.lastPmDate).getTime();
    if (!isNaN(lastPmTime)) {
      daysSinceLastPm = Math.max(0, Math.floor((analysisTime - lastPmTime) / (24 * 60 * 60 * 1000)));
      const interval = asset.maintenanceIntervalDays || 30;
      daysOverdueOrRemaining = daysSinceLastPm - interval;

      if (daysOverdueOrRemaining > 0) {
        isOverdue = true;
        if (daysOverdueOrRemaining >= 14) {
          maintenanceScore = 20;
          maintenanceLabel = `Severely overdue by ${daysOverdueOrRemaining} days (Last PM: ${daysSinceLastPm}d ago, cycle: ${interval}d)`;
          reasons.push(`PM severely overdue by ${daysOverdueOrRemaining} days (+20 pts).`);
        } else {
          maintenanceScore = 12;
          maintenanceLabel = `Overdue by ${daysOverdueOrRemaining} days (Last PM: ${daysSinceLastPm}d ago, cycle: ${interval}d)`;
          reasons.push(`PM overdue by ${daysOverdueOrRemaining} days (+12 pts).`);
        }
      } else {
        const remaining = Math.abs(daysOverdueOrRemaining);
        maintenanceLabel = `Nominal (PM due in ${remaining} days; last completed ${daysSinceLastPm}d ago)`;
      }
    }
  } else {
    maintenanceLabel = 'No PM completion date logged (excluded from overdue penalty)';
  }

  // Calculate composite score (capped strictly between 0 and 100)
  const rawScore = frequencyScore + repeatScore + accelerationScore + maintenanceScore;
  const riskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Determine Risk Band
  let riskBand: RiskBand = 'Low';
  if (riskScore >= RISK_ENGINE_CONFIG.thresholds.highRiskMinScore) {
    riskBand = 'High';
  } else if (riskScore >= RISK_ENGINE_CONFIG.thresholds.mediumRiskMinScore) {
    riskBand = 'Medium';
  } else {
    riskBand = 'Low';
  }

  // Note existing unresolved faults distinctly:
  if (unresolvedFaults.length > 0) {
    reasons.push(`Has ${unresolvedFaults.length} unresolved defect(s) requiring immediate corrective repair.`);
  }

  if (relevantIncidents.length > 0) {
    reasons.push(`Active operational incident ticket (${relevantIncidents[0].id}) logged against this asset.`);
  }

  if (reasons.length === 0) {
    reasons.push('Asset displays nominal performance with no recent fault clustering or overdue servicing.');
  }

  return {
    assetId: asset.id,
    asset,
    riskScore,
    riskBand,
    hasSufficientData: true,
    recentFaultsCount,
    totalHistoricalFaults: assetLogs.length,
    unresolvedFaultsCount: unresolvedFaults.length + relevantIncidents.length,
    repeatedFaultPatterns: repeatedPatterns,
    frequencyAcceleration: {
      last14dCount,
      prior14dCount,
      difference: diffCount,
      description: accelerationDesc,
    },
    maintenanceStatus: {
      isOverdue,
      daysSinceLastPm,
      intervalDays: asset.maintenanceIntervalDays || 30,
      daysOverdueOrRemaining,
      label: maintenanceLabel,
    },
    factors: {
      frequencyScore,
      repeatScore,
      accelerationScore,
      maintenanceScore,
    },
    reasons,
    analysisDate: analysisDateIso,
    outlookPeriod: {
      startDate: outlookStart,
      endDate: outlookEnd,
    },
    unresolvedFaults,
  };
}

/**
 * Assesses an array of assets and sorts them in descending order of failure risk.
 */
export function rankAssetsByRisk(
  assets: MetroAsset[],
  faultLogs: AssetFaultLog[],
  options: RiskEngineOptions = {}
): AssetRiskAssessment[] {
  const assessments = assets.map(asset => calculateAssetRisk(asset, faultLogs, options));

  return assessments.sort((a, b) => {
    // Assets with unresolved faults needing repair or highest risk score come first
    const aUrgent = a.unresolvedFaultsCount > 0 ? 1 : 0;
    const bUrgent = b.unresolvedFaultsCount > 0 ? 1 : 0;
    if (aUrgent !== bUrgent) return bUrgent - aUrgent;

    // Then by risk score
    return b.riskScore - a.riskScore;
  });
}

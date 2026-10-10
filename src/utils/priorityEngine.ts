import { IncidentCategory, IncidentSeverity, PassengerImpact } from '../types/metro';

export interface PriorityAssessment {
  score: number;
  tier: 'High' | 'Medium' | 'Low';
  reason: string;
}

/**
 * Transparent, explainable rule-based incident priority calculator.
 * Designed for demo decision support. Does not substitute real-world human review.
 */
export function calculateIncidentPriority(data: {
  severity: IncidentSeverity;
  safetyConcern: boolean;
  serviceDisruption: boolean;
  passengerImpact: PassengerImpact;
}): PriorityAssessment {
  let score = 0;
  const factors: string[] = [];

  // 1. Explicit Safety Concern: major weighting
  if (data.safetyConcern) {
    score += 40;
    factors.push('Safety concern (+40)');
  }

  // 2. Reported Severity
  if (data.severity === 'Critical') {
    score += 30;
    factors.push('Critical severity (+30)');
  } else if (data.severity === 'Warning') {
    score += 15;
    factors.push('Warning severity (+15)');
  } else {
    score += 5;
    factors.push('Low severity (+5)');
  }

  // 3. Service Disruption
  if (data.serviceDisruption) {
    score += 20;
    factors.push('Service disruption (+20)');
  }

  // 4. Passenger Impact
  if (data.passengerImpact === 'Service Halt' || data.passengerImpact === 'Severe Delay (>15m)') {
    score += 20;
    factors.push('Severe passenger delay (+20)');
  } else if (data.passengerImpact === 'Moderate Delay (5-15m)') {
    score += 10;
    factors.push('Moderate passenger delay (+10)');
  } else if (data.passengerImpact === 'Minor Delay (<5m)') {
    score += 5;
    factors.push('Minor delay (+5)');
  }

  let tier: 'High' | 'Medium' | 'Low' = 'Low';
  if (score >= 60) {
    tier = 'High';
  } else if (score >= 30) {
    tier = 'Medium';
  }

  return {
    score,
    tier,
    reason: factors.length > 0 ? factors.join(' · ') : 'Standard review priority (+5)'
  };
}

/**
 * Generates sensible, actionable inspection checklist verification steps tailored to incident category.
 */
export function getSuggestedChecklist(category: IncidentCategory): string[] {
  switch (category) {
    case 'Traction & Power':
      return [
        'Isolate & earth 25kV traction line section with safety grounds',
        'Inspect catenary wire tension, insulators & dropper clips',
        'Perform insulation resistance and continuity dielectric test',
        'Energize section and confirm nominal 25kV voltage telemetry'
      ];
    case 'Signalling & Telecom':
      return [
        'Lock out affected signal interlocking route & crossover',
        'Inspect point machine detector contacts and axle counter sensor',
        'Verify track circuit data telemetry on CBTC OCC workstation',
        'Perform test train simulation and restore nominal green aspect'
      ];
    case 'Rolling Stock':
      return [
        'Isolate rake pantograph & traction power auxiliary converter',
        'Conduct physical inspection of bogie, brake caliper & door seals',
        'Execute onboard diagnostic self-test and reset trip codes',
        'Issue track clearance certificate for revenue train transit'
      ];
    case 'Station Infrastructure':
      return [
        'Cordon off passenger platform danger area with safety tape',
        'Inspect platform screen door header & optical safety sensor',
        'Verify emergency release latch and passenger interlocks',
        'Clear barrier and certify safe station operational access'
      ];
    case 'Track & Civil':
      return [
        'Obtain track access block & traction power cut certificate',
        'Inspect rail gauge, fastening clips, joint welds & ballast bed',
        'Clear foreign debris and torque rail anchor bolts to standard',
        'Conduct low-speed trial run and revoke track caution order'
      ];
    case 'Fare Collection':
      return [
        'Access AFC gate internal reader and optical flap motor array',
        'Check ethernet link and synchronisation with station controller',
        'Execute 10-cycle contactless smartcard tap diagnostic test',
        'Return gate lane to passenger revenue service'
      ];
    default:
      return [
        'Perform site hazard assessment and cordon area',
        'Execute technical diagnostics and repair component',
        'Verify operational safety clearance before reopening'
      ];
  }
}

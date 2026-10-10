import { 
  MetroAsset, 
  AssetRiskAssessment, 
  RosterPlanConfig, 
  NightShiftRosterResult, 
  RosterEntry, 
  UnscheduledTask, 
  Incident, 
  AssetFaultLog, 
  AssetType,
  WorkOrderPriority
} from '../types/metro';

export const DEFAULT_MAINTENANCE_WINDOW_NOTE = 
  'Demo maintenance window — confirm actual access permissions and operating schedule.';

export const DEFAULT_TEAMS_CONFIG: RosterPlanConfig['teams'] = [
  {
    name: 'Team Alpha (AFC & TVM Specialist)',
    compatibleAssetTypes: ['Ticket Gate', 'Ticket Vending Machine'],
    maxTasksPerShift: 3,
  },
  {
    name: 'Team Beta (Lifts & Escalators)',
    compatibleAssetTypes: ['Lift', 'Escalator'],
    maxTasksPerShift: 3,
  },
  {
    name: 'Team Gamma (Heavy Infrastructure & Signalling)',
    compatibleAssetTypes: ['Platform Screen Door', 'Point Machine', 'Traction Substation', 'Rolling Stock', 'Ticket Gate'],
    maxTasksPerShift: 3,
  }
];

export const DEFAULT_TASK_DURATIONS: Record<AssetType, number> = {
  'Ticket Gate': 45,
  'Ticket Vending Machine': 40,
  'Lift': 60,
  'Escalator': 60,
  'Platform Screen Door': 45,
  'Point Machine': 50,
  'Traction Substation': 60,
  'Signal Head': 40,
  'Rolling Stock': 60,
};

/**
 * Converts a time string "HH:mm" to total minutes from 00:00.
 */
function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts total minutes into a formatted "HH:mm" string (modulo 24h).
 */
function minutesToTimeString(minutes: number): string {
  const norm = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface CandidateTask {
  candidateId: string;
  asset: MetroAsset;
  taskTitle: string;
  taskType: 'predictive_pm' | 'corrective_repair' | 'routine_inspection';
  priority: WorkOrderPriority;
  priorityReason: string;
  riskScore?: number;
  riskBand?: string;
  estimatedDuration: number;
  isCorrective: boolean;
  linkedIncidentId?: string;
  linkedFaultLogId?: string;
}

/**
 * Builds candidate tasks from ranked assets and active incidents.
 * Ensures strict separation between active corrective faults and predictive risk.
 */
export function buildCandidateTasks(
  rankedAssets: AssetRiskAssessment[],
  activeIncidents: Incident[],
  activeFaultLogs: AssetFaultLog[],
  durationOverrides: Partial<Record<AssetType, number>> = {}
): CandidateTask[] {
  const candidates: CandidateTask[] = [];
  const processedAssetIds = new Set<string>();

  // 1. First Priority: Assets with active corrective defects or incidents
  for (const assessed of rankedAssets) {
    const asset = assessed.asset;
    const unresolved = assessed.unresolvedFaults;
    const linkedIncident = activeIncidents.find(
      inc => inc.assetId === asset.id && inc.status !== 'Resolved' && inc.status !== 'Closed'
    );

    if (unresolved.length > 0 || linkedIncident) {
      processedAssetIds.add(asset.id);
      const faultDesc = unresolved[0] ? unresolved[0].description : linkedIncident?.title;
      const faultCode = unresolved[0]?.faultCode || 'CORRECTIVE';

      candidates.push({
        candidateId: `CAND-CORR-${asset.id}`,
        asset,
        taskTitle: `Corrective Repair: ${asset.name} (${faultCode})`,
        taskType: 'corrective_repair',
        priority: 'High',
        priorityReason: linkedIncident 
          ? `Corrective urgency: Active incident ${linkedIncident.id} (${linkedIncident.severity})`
          : `Corrective urgency: Unresolved fault logged (${faultCode} - ${faultDesc})`,
        riskScore: assessed.riskScore,
        riskBand: assessed.riskBand,
        estimatedDuration: durationOverrides[asset.type] || DEFAULT_TASK_DURATIONS[asset.type] || 50,
        isCorrective: true,
        linkedIncidentId: linkedIncident?.id,
        linkedFaultLogId: unresolved[0]?.id
      });
    }
  }

  // 2. Second Priority: Assets with High or Medium failure risk (Predictive PM)
  for (const assessed of rankedAssets) {
    if (processedAssetIds.has(assessed.asset.id)) continue;
    const asset = assessed.asset;

    if (assessed.riskBand === 'High') {
      processedAssetIds.add(asset.id);
      candidates.push({
        candidateId: `CAND-PRED-${asset.id}`,
        asset,
        taskTitle: `Predictive PM: ${asset.name} Risk Mitigation`,
        taskType: 'predictive_pm',
        priority: 'High',
        priorityReason: `Predictive risk: 7-day failure score ${assessed.riskScore}/100 (High Risk). ${assessed.reasons[0] || ''}`,
        riskScore: assessed.riskScore,
        riskBand: assessed.riskBand,
        estimatedDuration: durationOverrides[asset.type] || DEFAULT_TASK_DURATIONS[asset.type] || 45,
        isCorrective: false
      });
    } else if (assessed.riskBand === 'Medium') {
      processedAssetIds.add(asset.id);
      candidates.push({
        candidateId: `CAND-PRED-${asset.id}`,
        asset,
        taskTitle: `Preventive Inspection: ${asset.name}`,
        taskType: 'predictive_pm',
        priority: 'Medium',
        priorityReason: `Predictive risk: 7-day failure score ${assessed.riskScore}/100 (Medium Risk). ${assessed.reasons[0] || ''}`,
        riskScore: assessed.riskScore,
        riskBand: assessed.riskBand,
        estimatedDuration: durationOverrides[asset.type] || DEFAULT_TASK_DURATIONS[asset.type] || 45,
        isCorrective: false
      });
    } else if (assessed.maintenanceStatus.isOverdue) {
      processedAssetIds.add(asset.id);
      candidates.push({
        candidateId: `CAND-ROUT-${asset.id}`,
        asset,
        taskTitle: `Routine PM Servicing: ${asset.name}`,
        taskType: 'routine_inspection',
        priority: 'Medium',
        priorityReason: `Scheduled maintenance: Overdue by ${assessed.maintenanceStatus.daysOverdueOrRemaining} days.`,
        riskScore: assessed.riskScore,
        riskBand: assessed.riskBand,
        estimatedDuration: durationOverrides[asset.type] || DEFAULT_TASK_DURATIONS[asset.type] || 45,
        isCorrective: false
      });
    }
  }

  // Sort candidate tasks: Corrective repairs first, then descending by risk score
  return candidates.sort((a, b) => {
    if (a.isCorrective !== b.isCorrective) return a.isCorrective ? -1 : 1;
    return (b.riskScore || 0) - (a.riskScore || 0);
  });
}

/**
 * Pure TypeScript Night-Shift Roster Scheduler.
 * Reproducibly allocates maintenance tasks to compatible teams without overlapping,
 * honoring travel/setup buffers and the designated shift window.
 */
export function generateNightShiftRoster(
  config: RosterPlanConfig,
  candidateTasks: CandidateTask[]
): NightShiftRosterResult {
  const { shiftDate, shiftStartTime, shiftEndTime, travelBufferMinutes, teams } = config;

  let startMinutes = parseTimeToMinutes(shiftStartTime);
  let endMinutes = parseTimeToMinutes(shiftEndTime);

  // If shift crosses midnight (e.g. 23:30 to 03:30), add 24 hours to endMinutes
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const shiftDurationMinutes = endMinutes - startMinutes;

  // Track state for each team
  interface TeamScheduleState {
    name: string;
    compatibleAssetTypes: AssetType[];
    currentAvailableMinute: number;
    tasksAssigned: number;
    maxTasks: number;
  }

  const teamStates: TeamScheduleState[] = teams.map(team => ({
    name: team.name,
    compatibleAssetTypes: team.compatibleAssetTypes,
    currentAvailableMinute: startMinutes,
    tasksAssigned: 0,
    maxTasks: team.maxTasksPerShift || 3,
  }));

  const scheduledEntries: RosterEntry[] = [];
  const unscheduledTasks: UnscheduledTask[] = [];

  let workOrderCounter = 1;

  for (const candidate of candidateTasks) {
    const { asset, taskTitle, taskType, priority, priorityReason, riskScore, riskBand, estimatedDuration } = candidate;

    // Find compatible teams that can service this asset type
    const compatibleTeams = teamStates.filter(t => t.compatibleAssetTypes.includes(asset.type));

    if (compatibleTeams.length === 0) {
      unscheduledTasks.push({
        id: `UNSCHED-${candidate.candidateId}`,
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        station: asset.station,
        taskTitle,
        taskType,
        priority,
        reasonUnscheduled: `No available team has certified skillset for ${asset.type}`,
        riskScore,
      });
      continue;
    }

    // Select the compatible team that is available earliest and has remaining task capacity
    const availableTeams = compatibleTeams
      .filter(t => t.tasksAssigned < t.maxTasks)
      .sort((a, b) => a.currentAvailableMinute - b.currentAvailableMinute);

    if (availableTeams.length === 0) {
      unscheduledTasks.push({
        id: `UNSCHED-${candidate.candidateId}`,
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        station: asset.station,
        taskTitle,
        taskType,
        priority,
        reasonUnscheduled: `Certified teams reached maximum task capacity (${compatibleTeams[0].maxTasks} tasks/shift)`,
        riskScore,
      });
      continue;
    }

    const assignedTeam = availableTeams[0];
    const taskStartMin = assignedTeam.currentAvailableMinute;
    const taskEndMin = taskStartMin + estimatedDuration;

    // Check if the task fits within the shift end window
    if (taskEndMin > endMinutes) {
      unscheduledTasks.push({
        id: `UNSCHED-${candidate.candidateId}`,
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        station: asset.station,
        taskTitle,
        taskType,
        priority,
        reasonUnscheduled: `Shift window limit reached (${shiftEndTime}) — task requires ${estimatedDuration}m, available window ${Math.max(0, endMinutes - taskStartMin)}m`,
        riskScore,
      });
      continue;
    }

    // Successfully scheduled!
    const entryId = `ROST-${shiftDate.replace(/-/g, '')}-${String(workOrderCounter).padStart(3, '0')}`;
    const workOrderId = `WO-NIGHT-${shiftDate.replace(/-/g, '')}-${String(workOrderCounter).padStart(3, '0')}`;
    workOrderCounter++;

    scheduledEntries.push({
      id: entryId,
      workOrderId,
      assetId: asset.id,
      assetName: asset.name,
      assetType: asset.type,
      station: asset.station,
      corridor: asset.line,
      taskTitle,
      taskType,
      priority,
      priorityReason,
      riskScore,
      riskBand: riskBand as any,
      assignedTeam: assignedTeam.name,
      plannedStart: minutesToTimeString(taskStartMin),
      plannedEnd: minutesToTimeString(taskEndMin),
      durationMinutes: estimatedDuration,
      status: 'queued',
    });

    // Advance team state: task time + transit/setup buffer
    assignedTeam.currentAvailableMinute = taskEndMin + travelBufferMinutes;
    assignedTeam.tasksAssigned += 1;
  }

  // Calculate teams utilized
  const teamsUtilized = teamStates.filter(t => t.tasksAssigned > 0).length;

  return {
    shiftDate,
    shiftWindow: `${shiftStartTime} - ${shiftEndTime}`,
    scheduledEntries,
    unscheduledTasks,
    generatedAt: new Date().toISOString(),
    summary: {
      totalEvaluated: candidateTasks.length,
      scheduledCount: scheduledEntries.length,
      unscheduledCount: unscheduledTasks.length,
      teamsUtilized,
    }
  };
}

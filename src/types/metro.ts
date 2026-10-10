export type Corridor = 'East-West' | 'North-South';

export type IncidentSeverity = 'Critical' | 'Warning' | 'Low';

export type IncidentStatus = 'Open' | 'Acknowledged' | 'In Progress' | 'Resolved' | 'Closed';

export type IncidentCategory = 
  | 'Traction & Power'
  | 'Signalling & Telecom'
  | 'Rolling Stock'
  | 'Station Infrastructure'
  | 'Track & Civil'
  | 'Fare Collection';

export type PassengerImpact = 
  | 'None'
  | 'Minor Delay (<5m)'
  | 'Moderate Delay (5-15m)'
  | 'Severe Delay (>15m)'
  | 'Service Halt';

export interface Incident {
  id: string;
  title: string;
  category: IncidentCategory;
  description: string;
  station: string;
  location: string;
  corridor: Corridor;
  assetId?: string;
  severity: IncidentSeverity;
  passengerImpact: PassengerImpact;
  safetyConcern: boolean;
  serviceDisruption: boolean;
  assignedTeam: string;
  status: IncidentStatus;
  reportedBy: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  resolvedAt?: string; // ISO String
  isSample: boolean; // Distinguishes sample records from user-entered records
  priorityScore: number;
  priorityTier: 'High' | 'Medium' | 'Low';
  priorityReason: string;
}

export type WorkOrderPriority = 'High' | 'Medium' | 'Low';
export type WorkOrderColumn = 'queued' | 'dispatched' | 'progress' | 'completed';

export interface WorkOrderChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  location: string;
  station: string;
  corridor: Corridor;
  category: IncidentCategory;
  assetId?: string;
  assignedTeam: string;
  priority: WorkOrderPriority;
  column: WorkOrderColumn;
  linkedIncidentId?: string;
  checklist: WorkOrderChecklistItem[];
  progress: number; // 0 - 100 derived strictly from checklist: (completed / total) * 100
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  isSample: boolean;
  // Night-shift roster & technician scheduling fields
  scheduledShiftDate?: string; // YYYY-MM-DD
  plannedStartTime?: string; // HH:mm
  plannedEndTime?: string; // HH:mm
  estimatedDurationMinutes?: number;
  taskType?: 'predictive_pm' | 'corrective_repair' | 'routine_inspection';
  schedulingReason?: string;
  findings?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'create' | 'update_status' | 'assign' | 'resolve' | 'delete' | 'maintenance' | 'system' | 'roster_generated' | 'fault_logged';
  title: string;
  description: string;
  timestamp: string; // ISO String
  incidentId?: string;
  workOrderId?: string;
  assetId?: string;
  author: string;
  isSample?: boolean;
}

export interface StationData {
  id: string;
  name: string;
  line: 'NS' | 'EW';
  code: string;
  chainageKm: string;
  elevatedOrUnderground: 'Elevated' | 'Underground' | 'At-Grade';
  platforms: number;
  interchange: boolean;
}

export type AssetType = 
  | 'Ticket Gate'
  | 'Ticket Vending Machine'
  | 'Lift'
  | 'Escalator'
  | 'Platform Screen Door'
  | 'Point Machine'
  | 'Traction Substation'
  | 'Signal Head'
  | 'Rolling Stock';

export interface MetroAsset {
  id: string;
  name: string;
  type: AssetType;
  station: string;
  stationOrSection: string; // for backward compatibility
  line: Corridor;
  status: 'Operational' | 'Maintenance Required' | 'Under Review';
  maintenanceIntervalDays: number;
  lastPmDate?: string; // ISO string of last preventive maintenance
  installedYear?: number;
  manufacturer?: string;
  isSample?: boolean;
}

export type FaultSeverity = 'Critical' | 'Major' | 'Minor';

export interface AssetFaultLog {
  id: string;
  assetId: string;
  timestamp: string; // ISO String
  faultCode: string;
  faultCategory: string;
  description: string;
  severity: FaultSeverity;
  resolvedAt?: string; // ISO String if resolved
  resolutionNotes?: string;
  isSample: boolean;
}

export type RiskBand = 'High' | 'Medium' | 'Low' | 'Insufficient Data';

export interface AssetRiskAssessment {
  assetId: string;
  asset: MetroAsset;
  riskScore: number; // 0 to 100
  riskBand: RiskBand;
  hasSufficientData: boolean;
  dataSufficiencyReason?: string;
  recentFaultsCount: number; // Faults in last 30 days
  totalHistoricalFaults: number;
  unresolvedFaultsCount: number;
  repeatedFaultPatterns: { code: string; count: number }[];
  frequencyAcceleration: {
    last14dCount: number;
    prior14dCount: number;
    difference: number;
    description: string;
  };
  maintenanceStatus: {
    isOverdue: boolean;
    daysSinceLastPm: number | null;
    intervalDays: number;
    daysOverdueOrRemaining: number | null;
    label: string;
  };
  factors: {
    frequencyScore: number;
    repeatScore: number;
    accelerationScore: number;
    maintenanceScore: number;
  };
  reasons: string[];
  analysisDate: string;
  outlookPeriod: {
    startDate: string;
    endDate: string;
  };
  unresolvedFaults: AssetFaultLog[];
}

export interface TeamSkillDefinition {
  name: string;
  compatibleAssetTypes: AssetType[];
  maxTasksPerShift?: number;
}

export interface RosterPlanConfig {
  shiftDate: string; // YYYY-MM-DD
  shiftStartTime: string; // HH:mm e.g. "00:30"
  shiftEndTime: string;   // HH:mm e.g. "04:30"
  travelBufferMinutes: number; // e.g. 15
  teams: TeamSkillDefinition[];
}

export interface RosterEntry {
  id: string;
  workOrderId: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  station: string;
  corridor: Corridor;
  taskTitle: string;
  taskType: 'predictive_pm' | 'corrective_repair' | 'routine_inspection';
  priority: WorkOrderPriority;
  priorityReason: string;
  riskScore?: number;
  riskBand?: RiskBand;
  assignedTeam: string;
  plannedStart: string; // HH:mm
  plannedEnd: string;   // HH:mm
  durationMinutes: number;
  status: WorkOrderColumn;
}

export interface UnscheduledTask {
  id: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  station: string;
  taskTitle: string;
  taskType: 'predictive_pm' | 'corrective_repair' | 'routine_inspection';
  priority: WorkOrderPriority;
  reasonUnscheduled: string;
  riskScore?: number;
}

export interface NightShiftRosterResult {
  shiftDate: string;
  shiftWindow: string; // e.g. "00:30 - 04:30"
  scheduledEntries: RosterEntry[];
  unscheduledTasks: UnscheduledTask[];
  generatedAt: string;
  summary: {
    totalEvaluated: number;
    scheduledCount: number;
    unscheduledCount: number;
    teamsUtilized: number;
  };
}

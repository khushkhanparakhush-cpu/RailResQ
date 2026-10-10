import { 
  Incident, 
  WorkOrder, 
  ActivityEvent, 
  MetroAsset, 
  AssetFaultLog,
  NightShiftRosterResult,
  IncidentCategory, 
  Corridor, 
  IncidentSeverity, 
  PassengerImpact, 
  IncidentStatus, 
  WorkOrderPriority, 
  WorkOrderColumn,
  FaultSeverity,
  AssetType
} from '../types/metro';
import { 
  INITIAL_INCIDENTS, 
  INITIAL_WORK_ORDERS, 
  INITIAL_ACTIVITY_LOGS, 
  SAMPLE_ASSETS 
} from '../data/initialData';
import { 
  buildSyntheticAssets, 
  buildSyntheticFaultLogs, 
  getDemoReferenceDate 
} from '../data/syntheticAssetData';
import { calculateIncidentPriority } from '../utils/priorityEngine';

const STORAGE_KEY_INCIDENTS = 'railresq_incidents_v3';
const STORAGE_KEY_WORK_ORDERS = 'railresq_work_orders_v3';
const STORAGE_KEY_ACTIVITY = 'railresq_activity_v3';
const STORAGE_KEY_ASSETS = 'railresq_assets_v3';
const STORAGE_KEY_FAULT_LOGS = 'railresq_fault_logs_v3';
const STORAGE_KEY_ROSTER = 'railresq_night_roster_v3';

type Listener = () => void;

export function getChecklistForAssetType(type: AssetType): string[] {
  switch (type) {
    case 'Ticket Gate':
      return [
        'Inspect contactless NFC reader antenna and optical QR barcode scanner',
        'Check retractable flap actuator motor torque, limit microswitches, and return spring',
        'Verify passenger detection infrared optical curtain beams and sensitivity',
        'Run 10-cycle automated ingress and egress passenger gate diagnostic sequence',
        'Verify Ethernet synchronisation and telemetry with Station AFC controller'
      ];
    case 'Ticket Vending Machine':
      return [
        'Clean banknote validator optical prism sensor and tension feed roller belts',
        'Inspect coin escrow hopper mechanism, coin reject gate, and coin audit counter',
        'Clean thermal receipt printer mechanism and inspect low-paper sensor threshold',
        'Execute test contactless smartcard card recharge and print verification ticket',
        'Verify station telemetry link and cash-box security interlock switches'
      ];
    case 'Lift':
      return [
        'Inspect car door safety edge detector and infrared optical curtain alignment',
        'Verify floor leveling vane alignment and leveling accuracy tolerance (+/- 5mm)',
        'Test emergency in-car alarm bell, intercom speaker, and emergency battery backup',
        'Inspect traction hoisting wire ropes, guide shoes, and overspeed governor switch',
        'Verify pit stop safety switch and car top maintenance control station operation'
      ];
    case 'Escalator':
      return [
        'Inspect upper and lower comb plate safety switches and comb teeth gap clearance',
        'Check handrail drive belt speed synchronization and measure surface tension',
        'Inspect step roller drive chains, guide tracks, and automatic oiler lubricant levels',
        'Test emergency stop push-buttons, skirt panel deflection switches, and restart interlock',
        'Run 15-minute continuous vibration and acoustic telemetry verification run'
      ];
    case 'Platform Screen Door':
      return [
        'Inspect door leaf guide rail track and optical safety obstruction curtain',
        'Calibrate door drive belt tension and motor deceleration curve profile',
        'Test emergency manual egress break-out handle and latch switch telemetry',
        'Execute 5-cycle train-docking synchronous open and close interlock verification'
      ];
    case 'Point Machine':
      return [
        'Measure switch rail throw stroke and detector contact clearance tolerance',
        'Inspect internal planetary gearbox lubrication and drive clutch slippage',
        'Check lock rod notch alignment and point position indication circuit'
      ];
    default:
      return [
        'Perform site hazard isolation and inspect mechanical/electrical components',
        'Execute multi-point sensor calibration and diagnostics against baseline specs',
        'Verify operational safety clearance and issue sign-off before revenue return'
      ];
  }
}

class RailResQDataLayer {
  private listeners: Set<Listener> = new Set();
  private incidents: Incident[] = [];
  private workOrders: WorkOrder[] = [];
  private activityLogs: ActivityEvent[] = [];
  private assets: MetroAsset[] = [];
  private faultLogs: AssetFaultLog[] = [];
  private nightShiftRoster: NightShiftRosterResult | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (
          e.key === STORAGE_KEY_INCIDENTS ||
          e.key === STORAGE_KEY_WORK_ORDERS ||
          e.key === STORAGE_KEY_ACTIVITY ||
          e.key === STORAGE_KEY_ASSETS ||
          e.key === STORAGE_KEY_FAULT_LOGS ||
          e.key === STORAGE_KEY_ROSTER
        ) {
          this.loadFromStorage();
          this.notify();
        }
      });
    }
  }

  private initialize() {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
  }

  private loadFromStorage() {
    const refDate = getDemoReferenceDate();
    const syntheticAssets = buildSyntheticAssets(refDate);
    const syntheticFaults = buildSyntheticFaultLogs(refDate);

    try {
      const incRaw = localStorage.getItem(STORAGE_KEY_INCIDENTS);
      if (incRaw) {
        this.incidents = JSON.parse(incRaw);
      } else {
        this.incidents = [...INITIAL_INCIDENTS];
        this.persistIncidents();
      }

      const woRaw = localStorage.getItem(STORAGE_KEY_WORK_ORDERS);
      if (woRaw) {
        this.workOrders = JSON.parse(woRaw);
      } else {
        this.workOrders = [...INITIAL_WORK_ORDERS];
        this.persistWorkOrders();
      }

      const actRaw = localStorage.getItem(STORAGE_KEY_ACTIVITY);
      if (actRaw) {
        this.activityLogs = JSON.parse(actRaw);
      } else {
        this.activityLogs = [...INITIAL_ACTIVITY_LOGS];
        this.persistActivity();
      }

      const astRaw = localStorage.getItem(STORAGE_KEY_ASSETS);
      if (astRaw) {
        const parsed = JSON.parse(astRaw);
        // Ensure extended assets (ticket gates, TVMs, lifts, escalators) exist
        if (Array.isArray(parsed) && parsed.some(a => a.type === 'Ticket Gate')) {
          this.assets = parsed;
        } else {
          this.assets = syntheticAssets;
          this.persistAssets();
        }
      } else {
        this.assets = syntheticAssets;
        this.persistAssets();
      }

      const fltRaw = localStorage.getItem(STORAGE_KEY_FAULT_LOGS);
      if (fltRaw) {
        this.faultLogs = JSON.parse(fltRaw);
      } else {
        this.faultLogs = syntheticFaults;
        this.persistFaultLogs();
      }

      const rostRaw = localStorage.getItem(STORAGE_KEY_ROSTER);
      if (rostRaw) {
        this.nightShiftRoster = JSON.parse(rostRaw);
      }
    } catch {
      this.incidents = [...INITIAL_INCIDENTS];
      this.workOrders = [...INITIAL_WORK_ORDERS];
      this.activityLogs = [...INITIAL_ACTIVITY_LOGS];
      this.assets = syntheticAssets;
      this.faultLogs = syntheticFaults;
    }
  }

  private persistIncidents() {
    try {
      localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(this.incidents));
    } catch {
      // ignore
    }
  }

  private persistWorkOrders() {
    try {
      localStorage.setItem(STORAGE_KEY_WORK_ORDERS, JSON.stringify(this.workOrders));
    } catch {
      // ignore
    }
  }

  private persistActivity() {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(this.activityLogs));
    } catch {
      // ignore
    }
  }

  private persistAssets() {
    try {
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(this.assets));
    } catch {
      // ignore
    }
  }

  private persistFaultLogs() {
    try {
      localStorage.setItem(STORAGE_KEY_FAULT_LOGS, JSON.stringify(this.faultLogs));
    } catch {
      // ignore
    }
  }

  private persistRoster() {
    try {
      if (this.nightShiftRoster) {
        localStorage.setItem(STORAGE_KEY_ROSTER, JSON.stringify(this.nightShiftRoster));
      } else {
        localStorage.removeItem(STORAGE_KEY_ROSTER);
      }
    } catch {
      // ignore
    }
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Error in dataLayer listener:', err);
      }
    });
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // --- Read Methods ---

  public getAllIncidents(): Incident[] {
    return [...this.incidents];
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.find(i => i.id === id);
  }

  public getAllWorkOrders(): WorkOrder[] {
    return [...this.workOrders];
  }

  public getWorkOrderById(id: string): WorkOrder | undefined {
    return this.workOrders.find(w => w.id === id);
  }

  public getActivityEvents(): ActivityEvent[] {
    return [...this.activityLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getAllAssets(): MetroAsset[] {
    return [...this.assets];
  }

  public getAssetById(id: string): MetroAsset | undefined {
    return this.assets.find(a => a.id === id);
  }

  public getAllFaultLogs(): AssetFaultLog[] {
    return [...this.faultLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getFaultLogsByAsset(assetId: string): AssetFaultLog[] {
    return this.faultLogs
      .filter(l => l.assetId === assetId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getNightShiftRoster(): NightShiftRosterResult | null {
    return this.nightShiftRoster;
  }

  // --- Asset Management & Fault Logs ---

  public async createFaultLog(data: {
    assetId: string;
    faultCode: string;
    faultCategory: string;
    description: string;
    severity: FaultSeverity;
    timestamp?: string;
  }): Promise<AssetFaultLog> {
    const asset = this.assets.find(a => a.id === data.assetId);
    if (!asset) throw new Error(`Asset ${data.assetId} not found.`);

    const count = this.faultLogs.length + 1;
    const newLog: AssetFaultLog = {
      id: `FLT-MAN-${String(count).padStart(4, '0')}`,
      assetId: data.assetId,
      timestamp: data.timestamp || new Date().toISOString(),
      faultCode: data.faultCode.trim().toUpperCase(),
      faultCategory: data.faultCategory.trim(),
      description: data.description.trim(),
      severity: data.severity,
      isSample: false
    };

    // If critical/major fault logged, update asset status to Maintenance Required
    if (data.severity === 'Critical' || data.severity === 'Major') {
      asset.status = 'Maintenance Required';
      this.persistAssets();
    }

    this.faultLogs = [newLog, ...this.faultLogs];
    this.persistFaultLogs();

    await this.addActivityEvent({
      type: 'fault_logged',
      title: `Fault Logged for ${asset.name}`,
      description: `[${newLog.faultCode}] ${newLog.description} (Severity: ${newLog.severity})`,
      assetId: asset.id,
      author: 'Station Inspector'
    });

    this.notify();
    return newLog;
  }

  public async resolveFaultLog(logId: string, notes?: string): Promise<AssetFaultLog> {
    const log = this.faultLogs.find(l => l.id === logId);
    if (!log) throw new Error(`Fault log ${logId} not found.`);

    log.resolvedAt = new Date().toISOString();
    log.resolutionNotes = notes || 'Defect resolved and operational clearance verified.';
    this.persistFaultLogs();

    // Check if asset has any other unresolved faults
    const asset = this.assets.find(a => a.id === log.assetId);
    if (asset) {
      const remainingUnresolved = this.faultLogs.filter(
        l => l.assetId === asset.id && !l.resolvedAt
      );
      if (remainingUnresolved.length === 0 && asset.status === 'Maintenance Required') {
        asset.status = 'Operational';
        this.persistAssets();
      }
    }

    await this.addActivityEvent({
      type: 'resolve',
      title: `Fault ${log.faultCode} Resolved`,
      description: `Asset ${asset?.name || log.assetId}: ${notes || 'Cleared after maintenance verification.'}`,
      assetId: log.assetId,
      author: 'Technician Lead'
    });

    this.notify();
    return log;
  }

  public async updateAssetLastPmDate(assetId: string, dateIso: string): Promise<MetroAsset> {
    const asset = this.assets.find(a => a.id === assetId);
    if (!asset) throw new Error(`Asset ${assetId} not found.`);

    asset.lastPmDate = dateIso;
    // Check if any active unresolved faults exist
    const unresolved = this.faultLogs.filter(l => l.assetId === assetId && !l.resolvedAt);
    if (unresolved.length === 0) {
      asset.status = 'Operational';
    }
    this.persistAssets();

    await this.addActivityEvent({
      type: 'maintenance',
      title: `Preventive Maintenance Recorded for ${asset.name}`,
      description: `PM cycle refreshed to ${new Date(dateIso).toLocaleDateString()}. Cycle interval: ${asset.maintenanceIntervalDays} days.`,
      assetId: asset.id,
      author: 'Depot Maintenance Supervisor'
    });

    this.notify();
    return asset;
  }

  // --- Night-Shift Roster & Technician Workflow ---

  public async saveNightShiftRoster(roster: NightShiftRosterResult): Promise<void> {
    this.nightShiftRoster = roster;
    this.persistRoster();

    // Automatically create or update corresponding WorkOrders for scheduled entries
    // so technicians can interactively execute and track them
    const newWorkOrders: WorkOrder[] = [];

    for (const entry of roster.scheduledEntries) {
      const existing = this.workOrders.find(w => w.id === entry.workOrderId);
      if (!existing) {
        const checklistTexts = getChecklistForAssetType(entry.assetType);
        const wo: WorkOrder = {
          id: entry.workOrderId,
          title: entry.taskTitle,
          description: `${entry.taskTitle} at ${entry.station}. Scheduled for ${roster.shiftDate} (${entry.plannedStart} - ${entry.plannedEnd}).`,
          station: entry.station,
          location: `${entry.station} Platform/Concourse`,
          corridor: entry.corridor,
          category: entry.assetType === 'Ticket Gate' || entry.assetType === 'Ticket Vending Machine' 
            ? 'Fare Collection' 
            : 'Station Infrastructure',
          assetId: entry.assetId,
          assignedTeam: entry.assignedTeam,
          priority: entry.priority,
          column: 'queued',
          checklist: checklistTexts.map((text, idx) => ({
            id: `chk-rost-${idx + 1}`,
            text,
            completed: false
          })),
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isSample: true,
          scheduledShiftDate: roster.shiftDate,
          plannedStartTime: entry.plannedStart,
          plannedEndTime: entry.plannedEnd,
          estimatedDurationMinutes: entry.durationMinutes,
          taskType: entry.taskType,
          schedulingReason: entry.priorityReason
        };
        newWorkOrders.push(wo);
      }
    }

    if (newWorkOrders.length > 0) {
      this.workOrders = [...newWorkOrders, ...this.workOrders];
      this.persistWorkOrders();
    }

    await this.addActivityEvent({
      type: 'roster_generated',
      title: `Night-Shift Roster Generated (${roster.shiftWindow})`,
      description: `${roster.scheduledEntries.length} tasks scheduled across ${roster.summary.teamsUtilized} teams for shift date ${roster.shiftDate}. ${roster.unscheduledTasks.length} unscheduled.`,
      author: 'Shift Operations Lead'
    });

    this.notify();
  }

  /**
   * Interactive Technician Task Completion:
   * Marks task completed, signs off checklist, records technician notes,
   * updates asset's last preventive maintenance timestamp, and resolves associated faults.
   * This immediately recalculates and lowers the asset's failure risk!
   */
  public async completeTechnicianWorkOrder(
    workOrderId: string, 
    findings?: string, 
    notes?: string
  ): Promise<WorkOrder> {
    const wo = this.workOrders.find(w => w.id === workOrderId);
    if (!wo) throw new Error(`Work order ${workOrderId} not found.`);

    const nowIso = new Date().toISOString();

    // Mark all checklist items as completed
    const completedChecklist = wo.checklist.map(item => ({
      ...item,
      completed: true,
      completedAt: item.completedAt || nowIso
    }));

    wo.column = 'completed';
    wo.progress = 100;
    wo.completedAt = nowIso;
    wo.updatedAt = nowIso;
    wo.findings = findings || 'All diagnostic and safety checkpoints passed nominal tolerances.';
    if (notes) wo.notes = notes;
    wo.checklist = completedChecklist;

    this.persistWorkOrders();

    // Update roster entry status if present
    if (this.nightShiftRoster) {
      const entry = this.nightShiftRoster.scheduledEntries.find(e => e.workOrderId === workOrderId);
      if (entry) {
        entry.status = 'completed';
        this.persistRoster();
      }
    }

    // Feedback into Asset: update last PM date
    if (wo.assetId) {
      const asset = this.assets.find(a => a.id === wo.assetId);
      if (asset) {
        asset.lastPmDate = nowIso;
        
        // Resolve any active unresolved faults for this asset
        const assetFaults = this.faultLogs.filter(l => l.assetId === asset.id && !l.resolvedAt);
        for (const flt of assetFaults) {
          flt.resolvedAt = nowIso;
          flt.resolutionNotes = `Resolved during night-shift task ${wo.id} by ${wo.assignedTeam}.`;
        }
        this.persistFaultLogs();

        asset.status = 'Operational';
        this.persistAssets();
      }
    }

    // Resolve linked incident if any
    if (wo.linkedIncidentId) {
      const inc = this.incidents.find(i => i.id === wo.linkedIncidentId);
      if (inc && inc.status !== 'Resolved' && inc.status !== 'Closed') {
        inc.status = 'Resolved';
        inc.resolvedAt = nowIso;
        inc.updatedAt = nowIso;
        this.persistIncidents();
      }
    }

    await this.addActivityEvent({
      type: 'maintenance',
      title: `Technician Completed Task ${wo.id}`,
      description: `${wo.assignedTeam} completed "${wo.title}" at ${wo.station}. Findings: ${wo.findings}`,
      workOrderId: wo.id,
      assetId: wo.assetId,
      incidentId: wo.linkedIncidentId,
      author: wo.assignedTeam
    });

    this.notify();
    return wo;
  }

  // --- Incident CRUD ---

  public async createIncident(data: {
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
    reportedBy?: string;
  }): Promise<Incident> {
    const year = new Date().getFullYear();
    const count = this.incidents.length + 1;
    const padded = String(count).padStart(4, '0');
    let uniqueId = `INC-${year}-${padded}`;
    let counter = count;
    while (this.incidents.some(i => i.id === uniqueId)) {
      counter++;
      uniqueId = `INC-${year}-${String(counter).padStart(4, '0')}`;
    }

    const priority = calculateIncidentPriority({
      severity: data.severity,
      safetyConcern: data.safetyConcern,
      serviceDisruption: data.serviceDisruption,
      passengerImpact: data.passengerImpact
    });

    const now = new Date().toISOString();
    const newIncident: Incident = {
      id: uniqueId,
      title: data.title.trim(),
      category: data.category,
      description: data.description.trim(),
      station: data.station,
      location: data.location.trim(),
      corridor: data.corridor,
      assetId: data.assetId || undefined,
      severity: data.severity,
      passengerImpact: data.passengerImpact,
      safetyConcern: data.safetyConcern,
      serviceDisruption: data.serviceDisruption,
      assignedTeam: data.assignedTeam,
      status: 'Open',
      reportedBy: data.reportedBy || 'Local Station Operator',
      createdAt: now,
      updatedAt: now,
      isSample: false,
      priorityScore: priority.score,
      priorityTier: priority.tier,
      priorityReason: priority.reason
    };

    // If an asset is linked, update its status and add a fault log entry
    if (data.assetId) {
      const asset = this.assets.find(a => a.id === data.assetId);
      if (asset) {
        asset.status = 'Maintenance Required';
        this.persistAssets();

        // Add corresponding fault log
        const newFault: AssetFaultLog = {
          id: `FLT-INC-${String(this.faultLogs.length + 1).padStart(4, '0')}`,
          assetId: data.assetId,
          timestamp: now,
          faultCode: `INC-${data.severity.toUpperCase().slice(0, 4)}`,
          faultCategory: data.category,
          description: data.title,
          severity: data.severity === 'Critical' ? 'Critical' : data.severity === 'Warning' ? 'Major' : 'Minor',
          isSample: false
        };
        this.faultLogs = [newFault, ...this.faultLogs];
        this.persistFaultLogs();
      }
    }

    this.incidents = [newIncident, ...this.incidents];
    this.persistIncidents();

    await this.addActivityEvent({
      type: 'create',
      title: `Incident ${uniqueId} Logged`,
      description: `${newIncident.title} at ${newIncident.station}. Priority: ${newIncident.priorityTier} (${newIncident.priorityScore} pts).`,
      incidentId: uniqueId,
      assetId: newIncident.assetId,
      author: newIncident.reportedBy
    });

    this.notify();
    return newIncident;
  }

  public async updateIncidentStatus(id: string, newStatus: IncidentStatus): Promise<Incident> {
    const inc = this.incidents.find(i => i.id === id);
    if (!inc) throw new Error(`Incident ${id} not found.`);

    const oldStatus = inc.status;
    inc.status = newStatus;
    inc.updatedAt = new Date().toISOString();

    if (newStatus === 'Resolved' && !inc.resolvedAt) {
      inc.resolvedAt = new Date().toISOString();
    }

    this.persistIncidents();

    await this.addActivityEvent({
      type: 'update_status',
      title: `Incident ${id} Status Changed`,
      description: `Transitioned from ${oldStatus} to ${newStatus}.`,
      incidentId: id,
      assetId: inc.assetId,
      author: 'Operations Controller'
    });

    this.notify();
    return inc;
  }

  public async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident> {
    const inc = this.incidents.find(i => i.id === id);
    if (!inc) throw new Error(`Incident ${id} not found.`);

    Object.assign(inc, updates, { updatedAt: new Date().toISOString() });

    if (
      updates.severity !== undefined ||
      updates.safetyConcern !== undefined ||
      updates.serviceDisruption !== undefined ||
      updates.passengerImpact !== undefined
    ) {
      const p = calculateIncidentPriority({
        severity: inc.severity,
        safetyConcern: inc.safetyConcern,
        serviceDisruption: inc.serviceDisruption,
        passengerImpact: inc.passengerImpact
      });
      inc.priorityScore = p.score;
      inc.priorityTier = p.tier;
      inc.priorityReason = p.reason;
    }

    this.persistIncidents();
    this.notify();
    return inc;
  }

  public async resolveIncidentWithNotes(id: string, resolutionNotes: string, resolvedBy = 'Lead Technician'): Promise<Incident> {
    const inc = this.incidents.find(i => i.id === id);
    if (!inc) throw new Error(`Incident ${id} not found.`);

    const now = new Date().toISOString();
    inc.status = 'Resolved';
    inc.resolvedAt = now;
    inc.updatedAt = now;

    // Resolve any linked fault logs
    if (inc.assetId) {
      const relatedLogs = this.faultLogs.filter(l => l.assetId === inc.assetId && !l.resolvedAt);
      for (const log of relatedLogs) {
        log.resolvedAt = now;
        log.resolutionNotes = resolutionNotes;
      }
      this.persistFaultLogs();
    }

    this.persistIncidents();

    await this.addActivityEvent({
      type: 'resolve',
      title: `Incident ${id} Resolved`,
      description: `${resolutionNotes} (Verified by ${resolvedBy})`,
      incidentId: id,
      assetId: inc.assetId,
      author: resolvedBy
    });

    this.notify();
    return inc;
  }

  public async deleteIncident(id: string, options?: { unlinkWorkOrders?: boolean }): Promise<boolean> {
    const target = this.incidents.find(i => i.id === id);
    if (!target) return false;

    this.incidents = this.incidents.filter(i => i.id !== id);
    this.persistIncidents();

    if (options?.unlinkWorkOrders) {
      let modified = false;
      this.workOrders.forEach(w => {
        if (w.linkedIncidentId === id) {
          w.linkedIncidentId = undefined;
          modified = true;
        }
      });
      if (modified) this.persistWorkOrders();
    }

    await this.addActivityEvent({
      type: 'delete',
      title: `Incident ${id} Removed`,
      description: `Incident "${target.title}" was permanently deleted.`,
      author: 'Operations Controller'
    });

    this.notify();
    return true;
  }

  // --- Work Order CRUD ---

  public async createWorkOrder(data: {
    title: string;
    description?: string;
    station: string;
    location: string;
    corridor: Corridor;
    category: IncidentCategory;
    assetId?: string;
    assignedTeam: string;
    priority: WorkOrderPriority;
    column: WorkOrderColumn;
    linkedIncidentId?: string;
    checklist?: { id?: string; text: string; completed?: boolean }[];
    notes?: string;
  }): Promise<WorkOrder> {
    const year = new Date().getFullYear();
    const count = this.workOrders.length + 1;
    const padded = String(count).padStart(4, '0');
    let uniqueId = `WO-${year}-${padded}`;
    let counter = count;
    while (this.workOrders.some(w => w.id === uniqueId)) {
      counter++;
      uniqueId = `WO-${year}-${String(counter).padStart(4, '0')}`;
    }

    const items = (data.checklist || []).map((c, idx) => ({
      id: c.id || `chk-${idx + 1}`,
      text: c.text,
      completed: !!c.completed,
      completedAt: c.completed ? new Date().toISOString() : undefined
    }));

    const progress = items.length > 0
      ? Math.round((items.filter(c => c.completed).length / items.length) * 100)
      : 0;

    const now = new Date().toISOString();
    const newOrder: WorkOrder = {
      id: uniqueId,
      title: data.title.trim(),
      description: data.description?.trim(),
      station: data.station,
      location: data.location.trim(),
      corridor: data.corridor,
      category: data.category,
      assetId: data.assetId || undefined,
      assignedTeam: data.assignedTeam,
      priority: data.priority,
      column: data.column,
      linkedIncidentId: data.linkedIncidentId || undefined,
      checklist: items,
      progress,
      notes: data.notes?.trim(),
      createdAt: now,
      updatedAt: now,
      isSample: false
    };

    this.workOrders = [newOrder, ...this.workOrders];
    this.persistWorkOrders();

    await this.addActivityEvent({
      type: 'maintenance',
      title: `Work Order ${uniqueId} Created`,
      description: `Task "${newOrder.title}" assigned to ${newOrder.assignedTeam} at ${newOrder.station}.`,
      workOrderId: uniqueId,
      incidentId: newOrder.linkedIncidentId,
      assetId: newOrder.assetId,
      author: 'Maintenance Coordinator'
    });

    this.notify();
    return newOrder;
  }

  public async updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder> {
    const wo = this.workOrders.find(w => w.id === id);
    if (!wo) throw new Error(`Work order ${id} not found.`);

    Object.assign(wo, updates, { updatedAt: new Date().toISOString() });
    this.persistWorkOrders();
    this.notify();
    return wo;
  }

  public async advanceWorkOrderStage(id: string): Promise<WorkOrder> {
    const wo = this.workOrders.find(w => w.id === id);
    if (!wo) throw new Error(`Work order ${id} not found.`);

    const stages: WorkOrderColumn[] = ['queued', 'dispatched', 'progress', 'completed'];
    const currentIndex = stages.indexOf(wo.column);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      wo.column = nextStage;
      wo.updatedAt = new Date().toISOString();
      if (nextStage === 'completed') {
        wo.completedAt = new Date().toISOString();
        wo.progress = 100;
        wo.checklist = wo.checklist.map(c => ({
          ...c,
          completed: true,
          completedAt: c.completedAt || new Date().toISOString()
        }));
      }
      this.persistWorkOrders();

      await this.addActivityEvent({
        type: 'maintenance',
        title: `Work Order ${id} Advanced to ${nextStage}`,
        description: `Task "${wo.title}" is now ${nextStage}.`,
        workOrderId: id,
        incidentId: wo.linkedIncidentId,
        assetId: wo.assetId,
        author: wo.assignedTeam
      });

      this.notify();
    }
    return wo;
  }

  public async toggleChecklistItem(workOrderId: string, itemId: string, completed: boolean): Promise<WorkOrder> {
    const wo = this.workOrders.find(w => w.id === workOrderId);
    if (!wo) throw new Error(`Work order ${workOrderId} not found.`);

    const target = wo.checklist.find(item => item.id === itemId);
    if (target) {
      target.completed = completed;
      target.completedAt = completed ? new Date().toISOString() : undefined;
    }

    const total = wo.checklist.length;
    const completedCount = wo.checklist.filter(c => c.completed).length;
    wo.progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    wo.updatedAt = new Date().toISOString();

    if (completedCount === total && total > 0 && wo.column !== 'completed') {
      wo.column = 'completed';
      wo.completedAt = new Date().toISOString();
    }

    this.persistWorkOrders();
    this.notify();
    return wo;
  }

  public async addChecklistItem(workOrderId: string, text: string): Promise<WorkOrder> {
    const wo = this.workOrders.find(w => w.id === workOrderId);
    if (!wo) throw new Error(`Work order ${workOrderId} not found.`);

    const newItemId = `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    wo.checklist.push({
      id: newItemId,
      text: text.trim(),
      completed: false
    });

    const total = wo.checklist.length;
    const completedCount = wo.checklist.filter(c => c.completed).length;
    wo.progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    wo.updatedAt = new Date().toISOString();

    this.persistWorkOrders();
    this.notify();
    return wo;
  }

  public async deleteChecklistItem(workOrderId: string, itemId: string): Promise<WorkOrder> {
    const wo = this.workOrders.find(w => w.id === workOrderId);
    if (!wo) throw new Error(`Work order ${workOrderId} not found.`);

    wo.checklist = wo.checklist.filter(item => item.id !== itemId);
    const total = wo.checklist.length;
    const completedCount = wo.checklist.filter(c => c.completed).length;
    wo.progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    wo.updatedAt = new Date().toISOString();

    this.persistWorkOrders();
    this.notify();
    return wo;
  }

  public async deleteWorkOrder(id: string): Promise<boolean> {
    const target = this.workOrders.find(w => w.id === id);
    if (!target) return false;

    this.workOrders = this.workOrders.filter(w => w.id !== id);
    this.persistWorkOrders();

    await this.addActivityEvent({
      type: 'delete',
      title: `Work Order ${id} Deleted`,
      description: `Task "${target.title}" was removed.`,
      workOrderId: id,
      incidentId: target.linkedIncidentId,
      assetId: target.assetId,
      author: 'Maintenance Coordinator'
    });

    this.notify();
    return true;
  }

  // --- Activity Event ---

  public async addActivityEvent(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
    const count = this.activityLogs.length + 1;
    const newEvent: ActivityEvent = {
      id: `ACT-${String(count).padStart(3, '0')}`,
      type: event.type,
      title: event.title,
      description: event.description,
      timestamp: new Date().toISOString(),
      incidentId: event.incidentId,
      workOrderId: event.workOrderId,
      assetId: event.assetId,
      author: event.author || 'System',
      isSample: false
    };

    this.activityLogs = [newEvent, ...this.activityLogs].slice(0, 150);
    this.persistActivity();
    return newEvent;
  }

  // --- Demo & Data Management ---

  public async loadDemoData(upsertOnly = true): Promise<void> {
    const refDate = getDemoReferenceDate();
    const syntheticAssets = buildSyntheticAssets(refDate);
    const syntheticFaults = buildSyntheticFaultLogs(refDate);

    if (upsertOnly) {
      const existingIncIds = new Set(this.incidents.map(i => i.id));
      const missingIncs = INITIAL_INCIDENTS.filter(i => !existingIncIds.has(i.id));
      this.incidents = [...this.incidents, ...missingIncs];

      const existingWoIds = new Set(this.workOrders.map(w => w.id));
      const missingWos = INITIAL_WORK_ORDERS.filter(w => !existingWoIds.has(w.id));
      this.workOrders = [...this.workOrders, ...missingWos];

      const existingActIds = new Set(this.activityLogs.map(a => a.id));
      const missingActs = INITIAL_ACTIVITY_LOGS.filter(a => !existingActIds.has(a.id));
      this.activityLogs = [...this.activityLogs, ...missingActs];

      const existingAstIds = new Set(this.assets.map(a => a.id));
      const missingAssets = syntheticAssets.filter(a => !existingAstIds.has(a.id));
      this.assets = [...this.assets, ...missingAssets];

      const existingFltIds = new Set(this.faultLogs.map(f => f.id));
      const missingFaults = syntheticFaults.filter(f => !existingFltIds.has(f.id));
      this.faultLogs = [...this.faultLogs, ...missingFaults];
    } else {
      this.incidents = [...INITIAL_INCIDENTS];
      this.workOrders = [...INITIAL_WORK_ORDERS];
      this.activityLogs = [...INITIAL_ACTIVITY_LOGS];
      this.assets = syntheticAssets;
      this.faultLogs = syntheticFaults;
      this.nightShiftRoster = null;
    }

    this.persistIncidents();
    this.persistWorkOrders();
    this.persistActivity();
    this.persistAssets();
    this.persistFaultLogs();
    this.persistRoster();
    this.notify();
  }

  public async clearAllData(): Promise<void> {
    const refDate = getDemoReferenceDate();
    this.incidents = [];
    this.workOrders = [];
    this.activityLogs = [];
    this.assets = buildSyntheticAssets(refDate);
    this.faultLogs = [];
    this.nightShiftRoster = null;

    this.persistIncidents();
    this.persistWorkOrders();
    this.persistActivity();
    this.persistAssets();
    this.persistFaultLogs();
    this.persistRoster();
    this.notify();
  }

  public exportData(): {
    version: string;
    exportedAt: string;
    incidents: Incident[];
    workOrders: WorkOrder[];
    activityLogs: ActivityEvent[];
    assets: MetroAsset[];
    faultLogs: AssetFaultLog[];
    nightShiftRoster: NightShiftRosterResult | null;
  } {
    return {
      version: '3.1.0',
      exportedAt: new Date().toISOString(),
      incidents: this.incidents,
      workOrders: this.workOrders,
      activityLogs: this.activityLogs,
      assets: this.assets,
      faultLogs: this.faultLogs,
      nightShiftRoster: this.nightShiftRoster
    };
  }

  public async importData(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.incidents)) {
        return { success: false, message: 'Invalid backup file structure: missing incidents array.' };
      }

      this.incidents = parsed.incidents;
      if (Array.isArray(parsed.workOrders)) this.workOrders = parsed.workOrders;
      if (Array.isArray(parsed.activityLogs)) this.activityLogs = parsed.activityLogs;
      if (Array.isArray(parsed.assets)) this.assets = parsed.assets;
      if (Array.isArray(parsed.faultLogs)) this.faultLogs = parsed.faultLogs;
      if (parsed.nightShiftRoster) this.nightShiftRoster = parsed.nightShiftRoster;

      this.persistIncidents();
      this.persistWorkOrders();
      this.persistActivity();
      this.persistAssets();
      this.persistFaultLogs();
      this.persistRoster();
      this.notify();

      return {
        success: true,
        message: `Imported ${this.incidents.length} incidents, ${this.workOrders.length} work orders, and ${this.faultLogs.length} fault records successfully.`
      };
    } catch (e: any) {
      return { success: false, message: `Import failed: ${e.message || 'JSON Parse error'}` };
    }
  }

  public getStorageStats(): {
    incidentCount: number;
    userIncidentCount: number;
    sampleIncidentCount: number;
    workOrderCount: number;
    activityCount: number;
    assetCount: number;
    faultLogCount: number;
    approximateKb: string;
  } {
    let bytes = 0;
    try {
      bytes += (localStorage.getItem(STORAGE_KEY_INCIDENTS) || '').length * 2;
      bytes += (localStorage.getItem(STORAGE_KEY_WORK_ORDERS) || '').length * 2;
      bytes += (localStorage.getItem(STORAGE_KEY_ACTIVITY) || '').length * 2;
      bytes += (localStorage.getItem(STORAGE_KEY_ASSETS) || '').length * 2;
      bytes += (localStorage.getItem(STORAGE_KEY_FAULT_LOGS) || '').length * 2;
      bytes += (localStorage.getItem(STORAGE_KEY_ROSTER) || '').length * 2;
    } catch {
      // ignore
    }

    const userCount = this.incidents.filter(i => !i.isSample).length;
    const sampleCount = this.incidents.filter(i => i.isSample).length;
    const kb = (bytes / 1024).toFixed(1);

    return {
      incidentCount: this.incidents.length,
      userIncidentCount: userCount,
      sampleIncidentCount: sampleCount,
      workOrderCount: this.workOrders.length,
      activityCount: this.activityLogs.length,
      assetCount: this.assets.length,
      faultLogCount: this.faultLogs.length,
      approximateKb: `${kb} KB`
    };
  }
}

export const dataLayer = new RailResQDataLayer();
export default dataLayer;

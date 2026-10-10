import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Incident, 
  WorkOrder, 
  StationData, 
  MetroAsset, 
  AssetFaultLog,
  NightShiftRosterResult,
  RosterPlanConfig,
  AssetRiskAssessment,
  ActivityEvent,
  IncidentStatus,
  IncidentSeverity,
  PassengerImpact,
  IncidentCategory,
  Corridor,
  WorkOrderPriority,
  WorkOrderColumn,
  FaultSeverity
} from '../types/metro';
import { AHMEDABAD_STATIONS } from '../data/initialData';
import { dataLayer } from '../services/dataLayer';
import { getSuggestedChecklist } from '../utils/priorityEngine';
import { rankAssetsByRisk } from '../utils/riskEngine';
import { buildCandidateTasks, generateNightShiftRoster } from '../utils/rosterEngine';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  icon?: string;
}

interface MetroContextType {
  // Network / Persistence
  isOnline: boolean;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Incidents
  incidents: Incident[];
  activeDrawerIncident: Incident | null;
  isDrawerOpen: boolean;
  openDrawer: (incidentId: string) => void;
  closeDrawer: () => void;
  addIncident: (data: {
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
  }) => Promise<string>;
  updateIncidentStatus: (id: string, newStatus: IncidentStatus) => Promise<void>;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  resolveIncidentWithNotes: (id: string, resolutionNotes: string, resolvedBy?: string) => Promise<void>;
  deleteIncident: (id: string, options?: { unlinkWorkOrders?: boolean }) => Promise<void>;

  // Incident Delete Modal
  incidentToDelete: Incident | null;
  openDeleteIncidentModal: (inc: Incident) => void;
  closeDeleteIncidentModal: () => void;
  confirmDeleteIncident: (unlinkWorkOrders: boolean) => Promise<void>;

  // Work Orders & Technician Pipeline
  workOrders: WorkOrder[];
  activeWorkOrder: WorkOrder | null;
  isWorkOrderDrawerOpen: boolean;
  openWorkOrderDrawer: (id: string) => void;
  closeWorkOrderDrawer: () => void;
  addWorkOrder: (data: {
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
  }) => Promise<string>;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<void>;
  advanceWorkOrderStage: (id: string) => Promise<void>;
  toggleChecklistItem: (workOrderId: string, itemId: string, completed: boolean) => Promise<void>;
  addChecklistItem: (workOrderId: string, text: string) => Promise<void>;
  deleteChecklistItem: (workOrderId: string, itemId: string) => Promise<void>;
  deleteWorkOrder: (id: string) => Promise<void>;
  completeTechnicianWorkOrder: (workOrderId: string, findings?: string, notes?: string) => Promise<WorkOrder>;

  // Work Order Delete Modal
  workOrderToDelete: WorkOrder | null;
  openDeleteWorkOrderModal: (wo: WorkOrder) => void;
  closeDeleteWorkOrderModal: () => void;
  confirmDeleteWorkOrder: () => Promise<void>;

  // Pre-fill creation from incident
  initiateWorkOrderFromIncident: (incident: Incident) => void;

  // Assets & Historical Faults
  stations: StationData[];
  assets: MetroAsset[];
  faultLogs: AssetFaultLog[];
  rankedAssetRisks: AssetRiskAssessment[];
  selectedRiskAssetId: string | null;
  setSelectedRiskAssetId: (id: string | null) => void;
  addFaultLog: (data: {
    assetId: string;
    faultCode: string;
    faultCategory: string;
    description: string;
    severity: FaultSeverity;
    timestamp?: string;
  }) => Promise<AssetFaultLog>;
  resolveFaultLog: (logId: string, notes?: string) => Promise<AssetFaultLog>;
  updateAssetPmDate: (assetId: string, dateIso: string) => Promise<MetroAsset>;

  // Night-Shift Maintenance Roster
  nightShiftRoster: NightShiftRosterResult | null;
  isGenerateRosterModalOpen: boolean;
  setIsGenerateRosterModalOpen: (open: boolean) => void;
  generateAndSaveRoster: (config: RosterPlanConfig) => Promise<NightShiftRosterResult>;

  // Activity Log
  activityLogs: ActivityEvent[];
  addActivityEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => Promise<void>;

  // Demo & Storage Management
  loadDemoData: () => Promise<void>;
  resetToDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  importDataJSON: (jsonString: string) => Promise<boolean>;
  exportDataJSON: () => void;
  getStorageStats: () => {
    incidentCount: number;
    userIncidentCount: number;
    sampleIncidentCount: number;
    workOrderCount: number;
    activityCount: number;
    assetCount: number;
    faultLogCount: number;
    approximateKb: string;
  };

  // Modals & Overlays
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isCreateWorkOrderModalOpen: boolean;
  setIsCreateWorkOrderModalOpen: (open: boolean) => void;
  prefilledWorkOrder: Partial<WorkOrder> | null;
  setPrefilledWorkOrder: (wo: Partial<WorkOrder> | null) => void;

  // Global UI & Toasts
  toasts: ToastItem[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', icon?: string) => void;
  removeToast: (id: string) => void;
}

const MetroContext = createContext<MetroContextType | undefined>(undefined);

export const MetroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Honest Network Status Monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network online. Changes saved locally and ready to sync.', 'info', 'cloud_done');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Operating in local-first offline mode. All records safely stored.', 'warning', 'wifi_off');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Modals & Drawers
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isCreateWorkOrderModalOpen, setIsCreateWorkOrderModalOpen] = useState<boolean>(false);
  const [isGenerateRosterModalOpen, setIsGenerateRosterModalOpen] = useState<boolean>(false);
  const [selectedRiskAssetId, setSelectedRiskAssetId] = useState<string | null>(null);
  const [prefilledWorkOrder, setPrefilledWorkOrder] = useState<Partial<WorkOrder> | null>(null);

  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
  const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(null);

  // Authoritative State from Data Layer
  const [incidents, setIncidents] = useState<Incident[]>(() => dataLayer.getAllIncidents());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => dataLayer.getAllWorkOrders());
  const [activityLogs, setActivityLogs] = useState<ActivityEvent[]>(() => dataLayer.getActivityEvents());
  const [assets, setAssets] = useState<MetroAsset[]>(() => dataLayer.getAllAssets());
  const [faultLogs, setFaultLogs] = useState<AssetFaultLog[]>(() => dataLayer.getAllFaultLogs());
  const [nightShiftRoster, setNightShiftRoster] = useState<NightShiftRosterResult | null>(() => dataLayer.getNightShiftRoster());
  const [stations] = useState<StationData[]>(AHMEDABAD_STATIONS);

  // Active Incident Detail Drawer
  const [activeDrawerIncident, setActiveDrawerIncident] = useState<Incident | null>(() => {
    const list = dataLayer.getAllIncidents();
    return list.length > 0 ? list[0] : null;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Active Work Order Detail Drawer
  const [activeWorkOrder, setActiveWorkOrder] = useState<WorkOrder | null>(null);
  const [isWorkOrderDrawerOpen, setIsWorkOrderDrawerOpen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    icon?: string
  ) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Synchronize state from authoritative dataLayer
  const reloadFromDataLayer = useCallback(() => {
    const freshIncidents = dataLayer.getAllIncidents();
    const freshWorkOrders = dataLayer.getAllWorkOrders();
    const freshActivity = dataLayer.getActivityEvents();
    const freshAssets = dataLayer.getAllAssets();
    const freshFaults = dataLayer.getAllFaultLogs();
    const freshRoster = dataLayer.getNightShiftRoster();

    setIncidents(freshIncidents);
    setWorkOrders(freshWorkOrders);
    setActivityLogs(freshActivity);
    setAssets(freshAssets);
    setFaultLogs(freshFaults);
    setNightShiftRoster(freshRoster);

    // Keep active drawers in sync
    setActiveDrawerIncident(prev => {
      if (!prev) return null;
      return freshIncidents.find(i => i.id === prev.id) || null;
    });

    setActiveWorkOrder(prev => {
      if (!prev) return null;
      return freshWorkOrders.find(w => w.id === prev.id) || null;
    });
  }, []);

  // Reactive Cross-Tab & Local Storage Subscription
  useEffect(() => {
    const unsubscribe = dataLayer.subscribe(() => {
      reloadFromDataLayer();
    });
    return unsubscribe;
  }, [reloadFromDataLayer]);

  // Dynamic Heuristic Risk Assessment (recomputes whenever assets, faults, or incidents change)
  const rankedAssetRisks = useMemo(() => {
    return rankAssetsByRisk(assets, faultLogs, {
      linkedIncidents: incidents
    });
  }, [assets, faultLogs, incidents]);

  // Drawer Handlers
  const openDrawer = (incidentId: string) => {
    const found = incidents.find(i => i.id === incidentId);
    if (found) {
      setActiveDrawerIncident(found);
      setIsDrawerOpen(true);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const openWorkOrderDrawer = (id: string) => {
    const found = workOrders.find(w => w.id === id);
    if (found) {
      setActiveWorkOrder(found);
      setIsWorkOrderDrawerOpen(true);
    }
  };

  const closeWorkOrderDrawer = () => {
    setIsWorkOrderDrawerOpen(false);
  };

  // Incident Operations
  const addIncident = async (data: any): Promise<string> => {
    const created = await dataLayer.createIncident(data);
    reloadFromDataLayer();
    showToast(`Incident ${created.id} logged successfully.`, 'success', 'check_circle');
    return created.id;
  };

  const updateIncidentStatus = async (id: string, newStatus: IncidentStatus) => {
    await dataLayer.updateIncidentStatus(id, newStatus);
    reloadFromDataLayer();
    showToast(`Incident status updated to ${newStatus}.`, 'info', 'sync');
  };

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    await dataLayer.updateIncident(id, updates);
    reloadFromDataLayer();
    showToast('Incident updated.', 'success', 'check');
  };

  const resolveIncidentWithNotes = async (id: string, notes: string, resolvedBy = 'Lead Technician') => {
    await dataLayer.resolveIncidentWithNotes(id, notes, resolvedBy);
    reloadFromDataLayer();
    showToast(`Incident ${id} resolved with clearance notes.`, 'success', 'task_alt');
  };

  const deleteIncident = async (id: string, options?: { unlinkWorkOrders?: boolean }) => {
    await dataLayer.deleteIncident(id, options);
    if (activeDrawerIncident?.id === id) {
      setIsDrawerOpen(false);
      setActiveDrawerIncident(null);
    }
    reloadFromDataLayer();
    showToast(`Incident ${id} deleted.`, 'info', 'delete');
  };

  const openDeleteIncidentModal = (inc: Incident) => {
    setIncidentToDelete(inc);
  };

  const closeDeleteIncidentModal = () => {
    setIncidentToDelete(null);
  };

  const confirmDeleteIncident = async (unlinkWorkOrders: boolean) => {
    if (!incidentToDelete) return;
    await deleteIncident(incidentToDelete.id, { unlinkWorkOrders });
    closeDeleteIncidentModal();
  };

  // Work Order Operations
  const addWorkOrder = async (data: any): Promise<string> => {
    const created = await dataLayer.createWorkOrder(data);
    reloadFromDataLayer();
    showToast(`Work Order ${created.id} created.`, 'success', 'assignment');
    return created.id;
  };

  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    await dataLayer.updateWorkOrder(id, updates);
    reloadFromDataLayer();
    showToast('Work order updated.', 'info', 'edit');
  };

  const advanceWorkOrderStage = async (id: string) => {
    const updated = await dataLayer.advanceWorkOrderStage(id);
    reloadFromDataLayer();
    showToast(`Task advanced to ${updated.column}.`, 'success', 'arrow_forward');
  };

  const toggleChecklistItem = async (workOrderId: string, itemId: string, completed: boolean) => {
    await dataLayer.toggleChecklistItem(workOrderId, itemId, completed);
    reloadFromDataLayer();
  };

  const addChecklistItem = async (workOrderId: string, text: string) => {
    await dataLayer.addChecklistItem(workOrderId, text);
    reloadFromDataLayer();
    showToast('Checklist item added.', 'success', 'add_task');
  };

  const deleteChecklistItem = async (workOrderId: string, itemId: string) => {
    await dataLayer.deleteChecklistItem(workOrderId, itemId);
    reloadFromDataLayer();
  };

  const deleteWorkOrder = async (id: string) => {
    await dataLayer.deleteWorkOrder(id);
    if (activeWorkOrder?.id === id) {
      setIsWorkOrderDrawerOpen(false);
      setActiveWorkOrder(null);
    }
    reloadFromDataLayer();
    showToast(`Work Order ${id} removed.`, 'info', 'delete');
  };

  const completeTechnicianWorkOrder = async (workOrderId: string, findings?: string, notes?: string) => {
    const completed = await dataLayer.completeTechnicianWorkOrder(workOrderId, findings, notes);
    reloadFromDataLayer();
    showToast(`Task ${workOrderId} completed! Asset maintenance date refreshed.`, 'success', 'verified');
    return completed;
  };

  const openDeleteWorkOrderModal = (wo: WorkOrder) => {
    setWorkOrderToDelete(wo);
  };

  const closeDeleteWorkOrderModal = () => {
    setWorkOrderToDelete(null);
  };

  const confirmDeleteWorkOrder = async () => {
    if (!workOrderToDelete) return;
    await deleteWorkOrder(workOrderToDelete.id);
    closeDeleteWorkOrderModal();
  };

  // Asset Fault Logs & PM Servicing
  const addFaultLog = async (data: {
    assetId: string;
    faultCode: string;
    faultCategory: string;
    description: string;
    severity: FaultSeverity;
    timestamp?: string;
  }) => {
    const created = await dataLayer.createFaultLog(data);
    reloadFromDataLayer();
    showToast(`Fault ${created.faultCode} logged for asset ${data.assetId}. Risk recalculated.`, 'warning', 'report');
    return created;
  };

  const resolveFaultLog = async (logId: string, notes?: string) => {
    const resolved = await dataLayer.resolveFaultLog(logId, notes);
    reloadFromDataLayer();
    showToast(`Fault ${resolved.faultCode} resolved.`, 'success', 'check_circle');
    return resolved;
  };

  const updateAssetPmDate = async (assetId: string, dateIso: string) => {
    const updated = await dataLayer.updateAssetLastPmDate(assetId, dateIso);
    reloadFromDataLayer();
    showToast(`Preventive maintenance logged for ${updated.name}.`, 'success', 'published_with_changes');
    return updated;
  };

  // Night-Shift Roster Generation
  const generateAndSaveRoster = async (config: RosterPlanConfig): Promise<NightShiftRosterResult> => {
    const candidateTasks = buildCandidateTasks(rankedAssetRisks, incidents, faultLogs);
    const roster = generateNightShiftRoster(config, candidateTasks);
    await dataLayer.saveNightShiftRoster(roster);
    reloadFromDataLayer();
    showToast(`Generated night-shift roster: ${roster.scheduledEntries.length} tasks scheduled.`, 'success', 'auto_schedule');
    return roster;
  };

  const initiateWorkOrderFromIncident = (incident: Incident) => {
    const suggested = getSuggestedChecklist(incident.category);
    setPrefilledWorkOrder({
      title: `Inspect & Clear: ${incident.title}`,
      description: incident.description,
      station: incident.station,
      location: incident.location,
      corridor: incident.corridor,
      category: incident.category,
      assetId: incident.assetId,
      assignedTeam: incident.assignedTeam,
      priority: incident.severity === 'Critical' ? 'High' : incident.severity === 'Warning' ? 'Medium' : 'Low',
      linkedIncidentId: incident.id,
      column: 'queued',
      checklist: suggested.map((text, idx) => ({
        id: `chk-${Date.now()}-${idx}`,
        text,
        completed: false
      }))
    });
    setIsCreateWorkOrderModalOpen(true);
  };

  const addActivityEvent = async (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    await dataLayer.addActivityEvent(event);
    reloadFromDataLayer();
  };

  // ---------------- DEMO & DATA MANAGEMENT ---------------- //
  const loadDemoData = async () => {
    try {
      await dataLayer.loadDemoData(true);
      reloadFromDataLayer();
      showToast('Loaded demo dataset (idempotent upsert).', 'info', 'restart_alt');
    } catch {
      showToast('Failed to load demo data.', 'error', 'error');
    }
  };

  const clearDemoData = async () => {
    try {
      await dataLayer.clearAllData();
      reloadFromDataLayer();
      showToast('Cleared sample demo records.', 'info', 'filter_alt');
    } catch {
      showToast('Failed to clear demo records.', 'error', 'error');
    }
  };

  const clearAllData = async () => {
    try {
      await dataLayer.clearAllData();
      setIsDrawerOpen(false);
      setActiveDrawerIncident(null);
      setIsWorkOrderDrawerOpen(false);
      setActiveWorkOrder(null);
      reloadFromDataLayer();
      showToast('Cleared all local records.', 'warning', 'delete_sweep');
    } catch {
      showToast('Failed to clear data.', 'error', 'error');
    }
  };

  const exportDataJSON = () => {
    const data = dataLayer.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RailResQ_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloaded complete JSON backup file.', 'success', 'download');
  };

  const importDataJSON = async (jsonString: string): Promise<boolean> => {
    const res = await dataLayer.importData(jsonString);
    if (res.success) {
      reloadFromDataLayer();
      showToast(res.message, 'success', 'upload_file');
      return true;
    } else {
      showToast(res.message, 'error', 'error');
      return false;
    }
  };

  const getStorageStats = () => dataLayer.getStorageStats();

  return (
    <MetroContext.Provider
      value={{
        isOnline,
        activeTab,
        setActiveTab,
        mobileNavOpen,
        setMobileNavOpen,
        globalSearch,
        setGlobalSearch,
        incidents,
        activeDrawerIncident,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        addIncident,
        updateIncidentStatus,
        updateIncident,
        resolveIncidentWithNotes,
        deleteIncident,
        incidentToDelete,
        openDeleteIncidentModal,
        closeDeleteIncidentModal,
        confirmDeleteIncident,
        workOrders,
        activeWorkOrder,
        isWorkOrderDrawerOpen,
        openWorkOrderDrawer,
        closeWorkOrderDrawer,
        addWorkOrder,
        updateWorkOrder,
        advanceWorkOrderStage,
        toggleChecklistItem,
        addChecklistItem,
        deleteChecklistItem,
        deleteWorkOrder,
        completeTechnicianWorkOrder,
        workOrderToDelete,
        openDeleteWorkOrderModal,
        closeDeleteWorkOrderModal,
        confirmDeleteWorkOrder,
        initiateWorkOrderFromIncident,
        stations,
        assets,
        faultLogs,
        rankedAssetRisks,
        selectedRiskAssetId,
        setSelectedRiskAssetId,
        addFaultLog,
        resolveFaultLog,
        updateAssetPmDate,
        nightShiftRoster,
        isGenerateRosterModalOpen,
        setIsGenerateRosterModalOpen,
        generateAndSaveRoster,
        activityLogs,
        addActivityEvent,
        loadDemoData,
        resetToDemoData: loadDemoData,
        clearDemoData,
        clearAllData,
        importDataJSON,
        exportDataJSON,
        getStorageStats,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isCreateWorkOrderModalOpen,
        setIsCreateWorkOrderModalOpen,
        prefilledWorkOrder,
        setPrefilledWorkOrder,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </MetroContext.Provider>
  );
};

export const useMetro = () => {
  const context = useContext(MetroContext);
  if (!context) {
    throw new Error('useMetro must be used within a MetroProvider');
  }
  return context;
};

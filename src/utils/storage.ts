import { dataLayer } from '../services/dataLayer';
import { Incident, WorkOrder, ActivityEvent } from '../types/metro';

export const storage = {
  loadIncidents(): Incident[] {
    return dataLayer.getAllIncidents();
  },

  saveIncidents(incidents: Incident[]): void {
    // Handled by dataLayer methods directly
    try {
      localStorage.setItem('railresq_incidents_v3', JSON.stringify(incidents));
    } catch {
      // ignore
    }
  },

  loadWorkOrders(): WorkOrder[] {
    return dataLayer.getAllWorkOrders();
  },

  saveWorkOrders(orders: WorkOrder[]): void {
    try {
      localStorage.setItem('railresq_work_orders_v3', JSON.stringify(orders));
    } catch {
      // ignore
    }
  },

  loadActivityEvents(): ActivityEvent[] {
    return dataLayer.getActivityEvents();
  },

  saveActivityEvents(events: ActivityEvent[]): void {
    try {
      localStorage.setItem('railresq_activity_v3', JSON.stringify(events));
    } catch {
      // ignore
    }
  },

  resetToDemoData() {
    return dataLayer.loadDemoData(false);
  },

  clearAllData() {
    dataLayer.clearAllData();
    return { incidents: [], workOrders: [], activityLogs: [] };
  },

  getStorageStats() {
    return dataLayer.getStorageStats();
  }
};

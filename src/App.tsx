/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MetroProvider, useMetro } from './context/MetroContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './components/views/OverviewView';
import { AssetRiskView } from './components/views/AssetRiskView';
import { IncidentsView } from './components/views/IncidentsView';
import { ReportIncidentView } from './components/views/ReportIncidentView';
import { MaintenanceView } from './components/views/MaintenanceView';
import { StationsAndAssetsView } from './components/views/StationsAndAssetsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { ActivityLogView } from './components/views/ActivityLogView';
import { SettingsView } from './components/views/SettingsView';
import { CommandPalette } from './components/modals/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';
import { CreateWorkOrderModal } from './components/modals/CreateWorkOrderModal';
import { GenerateRosterModal } from './components/modals/GenerateRosterModal';
import { WorkOrderDrawer } from './components/modals/WorkOrderDrawer';
import { IncidentDeleteModal } from './components/modals/IncidentDeleteModal';
import { WorkOrderDeleteModal } from './components/modals/WorkOrderDeleteModal';

const AppContent: React.FC = () => {
  const { activeTab } = useMetro();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header />

        {/* Viewport Canvas */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {activeTab === 'overview' && <OverviewView />}
          {activeTab === 'asset-risk' && <AssetRiskView />}
          {activeTab === 'incidents' && <IncidentsView />}
          {activeTab === 'report-incident' && <ReportIncidentView />}
          {activeTab === 'maintenance' && <MaintenanceView />}
          {activeTab === 'stations-and-assets' && <StationsAndAssetsView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'activity-log' && <ActivityLogView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Command Palette, Modals & Real-Time Alerts */}
      <CommandPalette />
      <CreateWorkOrderModal />
      <GenerateRosterModal />
      <WorkOrderDrawer />
      <IncidentDeleteModal />
      <WorkOrderDeleteModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <MetroProvider>
      <AppContent />
    </MetroProvider>
  );
}

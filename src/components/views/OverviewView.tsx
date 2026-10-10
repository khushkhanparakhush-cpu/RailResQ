import React, { useMemo, useState } from 'react';
import { useMetro } from '../../context/MetroContext';
import { DEFAULT_MAINTENANCE_WINDOW_NOTE } from '../../utils/rosterEngine';
import { RISK_ENGINE_CONFIG } from '../../utils/riskEngine';

export const OverviewView: React.FC = () => {
  const { 
    rankedAssetRisks, 
    nightShiftRoster, 
    workOrders, 
    faultLogs, 
    incidents, 
    activityLogs, 
    setActiveTab, 
    setSelectedRiskAssetId, 
    setIsGenerateRosterModalOpen,
    openWorkOrderDrawer,
    openDrawer: openIncidentDrawer
  } = useMetro();

  const [tableFilter, setTableFilter] = useState<'all' | 'high' | 'medium' | 'insufficient'>('all');

  // 1. KPI: High-Risk Assets
  const highRiskAssets = useMemo(() => {
    return rankedAssetRisks.filter(a => a.riskBand === 'High');
  }, [rankedAssetRisks]);

  // 2. KPI: Assets Due for Maintenance (known dates only)
  const dueMaintenanceAssets = useMemo(() => {
    return rankedAssetRisks.filter(a => a.maintenanceStatus.isOverdue);
  }, [rankedAssetRisks]);

  // 3. KPI: Tasks Scheduled for Selected Shift
  const scheduledRosterTasks = useMemo(() => {
    return nightShiftRoster?.scheduledEntries || [];
  }, [nightShiftRoster]);

  // 4. KPI: Shift Task Completion Rate
  const completedRosterCount = useMemo(() => {
    if (scheduledRosterTasks.length === 0) return 0;
    return scheduledRosterTasks.filter(entry => {
      const linked = workOrders.find(w => w.id === entry.workOrderId);
      return linked?.column === 'completed';
    }).length;
  }, [scheduledRosterTasks, workOrders]);

  // Filtered Assets for "Assets Requiring Attention"
  const displayedAssets = useMemo(() => {
    let list = rankedAssetRisks;
    if (tableFilter === 'high') {
      list = rankedAssetRisks.filter(a => a.riskBand === 'High');
    } else if (tableFilter === 'medium') {
      list = rankedAssetRisks.filter(a => a.riskBand === 'Medium');
    } else if (tableFilter === 'insufficient') {
      list = rankedAssetRisks.filter(a => !a.hasSufficientData);
    }
    return list.slice(0, 7);
  }, [rankedAssetRisks, tableFilter]);

  // Separate assets with insufficient data
  const insufficientDataAssets = useMemo(() => {
    return rankedAssetRisks.filter(a => !a.hasSufficientData);
  }, [rankedAssetRisks]);

  // 7-day outlook dates
  const todayStr = useMemo(() => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), []);
  const nextWeekStr = useMemo(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const formatTimeAgo = (isoStr: string) => {
    try {
      const diffMs = Date.now() - new Date(isoStr).getTime();
      const mins = Math.floor(diffMs / (60 * 1000));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return new Date(isoStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Compact Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Maintenance Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Review asset risks and plan upcoming maintenance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('asset-risk')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors shadow-xs min-h-[42px]"
          >
            <span className="material-symbols-outlined text-base">troubleshoot</span>
            <span>View Asset Risk</span>
          </button>

          <button
            onClick={() => setIsGenerateRosterModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs min-h-[42px]"
          >
            <span className="material-symbols-outlined text-base text-slate-600">auto_schedule</span>
            <span>Plan Night Shift</span>
          </button>
        </div>
      </div>

      {/* 2. Four Real Application State KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: High-Risk Assets */}
        <div 
          onClick={() => setActiveTab('asset-risk')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 hover:shadow-sm transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              High-Risk Assets
            </span>
            <span className="w-2 h-2 rounded-full bg-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-700 tabular-nums">
            {highRiskAssets.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
            <span>7-day outlook: {todayStr} – {nextWeekStr}</span>
            <span className="text-teal-700 font-semibold">View Assets →</span>
          </div>
        </div>

        {/* Card 2: Maintenance Due */}
        <div 
          onClick={() => setActiveTab('asset-risk')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Maintenance Due
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 tabular-nums">
            {dueMaintenanceAssets.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
            <span>Maintenance interval exceeded</span>
            <span className="text-teal-700 font-semibold">View Assets →</span>
          </div>
        </div>

        {/* Card 3: Scheduled Tasks */}
        <div 
          onClick={() => setActiveTab('maintenance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Scheduled Tasks
            </span>
            <span className="w-2 h-2 rounded-full bg-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {scheduledRosterTasks.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
            <span className="truncate max-w-[160px]">
              Shift: {nightShiftRoster?.shiftDate || 'No plan generated'}
            </span>
            <span className="text-teal-700 font-semibold">View Tasks →</span>
          </div>
        </div>

        {/* Card 4: Shift Task Completion */}
        <div 
          onClick={() => setActiveTab('maintenance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Shift Task Completion
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          {scheduledRosterTasks.length === 0 ? (
            <div>
              <div className="text-sm font-bold text-slate-500 pt-1">
                No tasks scheduled
              </div>
              <div className="text-[11px] text-slate-400 pt-0.5">
                Generate shift plan to track
              </div>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                {Math.round((completedRosterCount / scheduledRosterTasks.length) * 100)}%
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                <span>{completedRosterCount} of {scheduledRosterTasks.length} tasks completed</span>
                <span className="text-teal-700 font-semibold">View Roster →</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Main Section: Assets Requiring Attention Table + Night-Shift Plan Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Assets Requiring Attention Table (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header */}
          <div className="p-4 border-b border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Assets Requiring Attention</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    Next 7 Days
                  </span>
                </h2>
                <span className="text-[11px] text-slate-500">
                  Ranked by 30-day frequency, recurring failure patterns, velocity acceleration, and maintenance status
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs self-start sm:self-auto">
                <button
                  onClick={() => setTableFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    tableFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({rankedAssetRisks.length})
                </button>
                <button
                  onClick={() => setTableFilter('high')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    tableFilter === 'high' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  High ({highRiskAssets.length})
                </button>
                <button
                  onClick={() => setTableFilter('insufficient')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    tableFilter === 'insufficient' ? 'bg-white text-slate-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Insuff. ({insufficientDataAssets.length})
                </button>
              </div>
            </div>

            {/* Mandatory Note */}
            <div className="text-[11px] text-amber-900 bg-amber-50/70 border border-amber-200/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-amber-700">info</span>
              <span>Rule-based relative risk estimate for the next 7 days; not a validated failure probability.</span>
            </div>
          </div>

          {/* Mobile Card List View (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {displayedAssets.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No assets found in selected view.
              </div>
            ) : (
              displayedAssets.map(assessment => {
                const { asset, riskScore, riskBand, hasSufficientData, maintenanceStatus, reasons, unresolvedFaultsCount } = assessment;

                return (
                  <div key={asset.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                    {/* Header: Asset Name, ID, Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {asset.name}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500">
                            {asset.id}
                          </span>
                          <span className="text-[10px] text-slate-400">·</span>
                          <span className="text-[10px] text-slate-600 font-medium">
                            {asset.station}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-100 text-slate-700 font-medium">
                            {asset.type}
                          </span>
                        </div>
                      </div>

                      {/* Risk Badge */}
                      <div className="shrink-0 text-right">
                        {!hasSufficientData ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Insuff. data
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            riskBand === 'High' ? 'bg-red-100 text-red-800 border border-red-200' :
                            riskBand === 'Medium' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {riskScore} · {riskBand}
                          </span>
                        )}
                      </div>
                    </div>

                    {unresolvedFaultsCount > 0 && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span>Active Defect Ticket ({unresolvedFaultsCount})</span>
                      </div>
                    )}

                    {/* Contributing Factor */}
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                      <span className="font-semibold text-slate-700 block text-[10px] uppercase">Main Driver:</span>
                      <span>{reasons[0] || 'Nominal performance.'}</span>
                    </div>

                    {/* Footer: PM Status & Action */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="text-[11px]">
                        <span className="text-slate-400 text-[10px] uppercase font-medium block">PM Cycle:</span>
                        <span className={maintenanceStatus.isOverdue ? 'text-red-700 font-semibold' : 'text-slate-600'}>
                          {maintenanceStatus.isOverdue 
                            ? `Overdue (${maintenanceStatus.daysOverdueOrRemaining}d)` 
                            : maintenanceStatus.daysSinceLastPm !== null 
                            ? `Nominal (${maintenanceStatus.daysSinceLastPm}d)` 
                            : 'Not recorded'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedRiskAssetId(asset.id);
                          setActiveTab('asset-risk');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs border border-teal-200 transition-colors min-h-[38px] flex items-center gap-1"
                      >
                        <span>History & Breakdown</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5">Asset</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Risk Index</th>
                  <th className="py-2.5 px-3">Main Contributing Factor</th>
                  <th className="py-2.5 px-3">PM Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No assets found in selected view.
                    </td>
                  </tr>
                ) : (
                  displayedAssets.map(assessment => {
                    const { asset, riskScore, riskBand, hasSufficientData, maintenanceStatus, reasons, unresolvedFaultsCount } = assessment;

                    return (
                      <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                        {/* Asset Name & ID */}
                        <td className="py-3 px-3.5 max-w-[170px]">
                          <div className="font-semibold text-slate-900 truncate">
                            {asset.name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {asset.id}
                          </div>
                          {unresolvedFaultsCount > 0 && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-red-100 text-red-800 border border-red-200">
                              Active Defect ({unresolvedFaultsCount})
                            </span>
                          )}
                        </td>

                        {/* Station */}
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                          {asset.station}
                        </td>

                        {/* Asset Type */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                            {asset.type}
                          </span>
                        </td>

                        {/* Risk Index & Band */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {!hasSufficientData ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Insufficient data
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                riskBand === 'High' ? 'bg-red-100 text-red-800 border border-red-200' :
                                riskBand === 'Medium' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                                'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {riskScore} · {riskBand}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Main Contributing Factor */}
                        <td className="py-3 px-3 max-w-[190px] text-[11px] text-slate-600 leading-snug">
                          <span className="line-clamp-2">
                            {reasons[0] || 'Nominal performance.'}
                          </span>
                        </td>

                        {/* Maintenance Status */}
                        <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                          <span className={maintenanceStatus.isOverdue ? 'text-red-700 font-semibold' : 'text-slate-600'}>
                            {maintenanceStatus.isOverdue 
                              ? `Overdue (${maintenanceStatus.daysOverdueOrRemaining}d)` 
                              : maintenanceStatus.daysSinceLastPm !== null 
                              ? `Nominal (${maintenanceStatus.daysSinceLastPm}d)` 
                              : 'Not recorded'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => {
                              setSelectedRiskAssetId(asset.id);
                              setActiveTab('asset-risk');
                            }}
                            className="px-2 py-1 rounded text-teal-700 hover:bg-teal-50 font-semibold text-[11px] transition-colors"
                            title="Inspect complete fault logs and heuristic formula"
                          >
                            History & Breakdown →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Showing {displayedAssets.length} of {rankedAssetRisks.length} assets evaluated
            </span>
            <button
              onClick={() => setActiveTab('asset-risk')}
              className="text-teal-700 hover:text-teal-900 font-semibold text-xs flex items-center gap-1"
            >
              <span>Full Asset Risk Console</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Right Column: Night-Shift Plan Preview (5 cols) */}
        <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-teal-700">nightlight</span>
                <span>Night-Shift Plan</span>
              </h2>
              <span className="text-[11px] text-slate-500">
                Prioritized track access window assignments
              </span>
            </div>

            <button
              onClick={() => setIsGenerateRosterModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold border border-teal-200 transition-colors"
            >
              Open Shift Planner
            </button>
          </div>

          {/* Assumed Demo Maintenance Window Note */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-slate-400">info</span>
            <span>{DEFAULT_MAINTENANCE_WINDOW_NOTE}</span>
          </div>

          {nightShiftRoster ? (
            <div className="p-4 space-y-4 text-xs">
              {/* Shift Overview Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px]">
                <div className="truncate">
                  <span className="font-semibold text-slate-900">Date:</span> {nightShiftRoster.shiftDate}
                </div>
                <div className="truncate">
                  <span className="font-semibold text-slate-900">Window:</span> {nightShiftRoster.shiftWindow}
                </div>
                <div className="shrink-0">
                  <span className="font-semibold text-teal-800">{nightShiftRoster.summary.scheduledCount} tasks</span>
                </div>
              </div>

              {/* Task Items List */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Scheduled Shift Assignments ({scheduledRosterTasks.length})
                </span>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {scheduledRosterTasks.map(entry => {
                    const linkedWo = workOrders.find(w => w.id === entry.workOrderId);
                    const isCompleted = linkedWo?.column === 'completed';

                    return (
                      <div
                        key={entry.id}
                        onClick={() => openWorkOrderDrawer(entry.workOrderId)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isCompleted 
                            ? 'bg-emerald-50/30 border-emerald-200' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">
                                {entry.plannedStart} – {entry.plannedEnd}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                entry.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {entry.priority}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                                {entry.assetType}
                              </span>
                            </div>
                            <div className="font-medium text-slate-800 mt-1 line-clamp-1">
                              {entry.taskTitle}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {entry.station} · Crew: {entry.assignedTeam}
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                            isCompleted ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isCompleted ? 'Completed' : 'Queued'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unscheduled Tasks Preview */}
              {nightShiftRoster.unscheduledTasks.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-amber-900 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-amber-700">warning</span>
                      Unscheduled Overflow ({nightShiftRoster.unscheduledTasks.length})
                    </span>
                    <span className="text-slate-400">Next cycle</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600">
                    {nightShiftRoster.unscheduledTasks.slice(0, 2).map(u => (
                      <div key={u.id} className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                        <span className="truncate pr-2 font-medium">{u.assetName}</span>
                        <span className="text-[10px] text-red-600 shrink-0">{u.reasonUnscheduled}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setActiveTab('maintenance')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <span>View Full Technician Roster</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3 text-xs">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">calendar_month</span>
              </div>
              <p className="text-slate-600 max-w-xs mx-auto leading-relaxed">
                No maintenance plan yet. Review asset risks and generate a shift roster.
              </p>
              <button
                onClick={() => setIsGenerateRosterModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">auto_schedule</span>
                <span>Open Shift Planner</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

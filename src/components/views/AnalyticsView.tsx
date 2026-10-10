import React, { useMemo } from 'react';
import { useMetro } from '../../context/MetroContext';

export const AnalyticsView: React.FC = () => {
  const { incidents, workOrders, rankedAssetRisks, nightShiftRoster, setActiveTab } = useMetro();

  const totalIncidents = incidents.length;
  const totalWorkOrders = workOrders.length;

  const stats = useMemo(() => {
    // Incident metrics
    const critical = incidents.filter(i => i.severity === 'Critical').length;
    const warning = incidents.filter(i => i.severity === 'Warning').length;
    const low = incidents.filter(i => i.severity === 'Low').length;

    const resolvedIncidents = incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
    const activeIncidents = totalIncidents - resolvedIncidents;

    const ns = incidents.filter(i => i.corridor === 'North-South').length;
    const ew = incidents.filter(i => i.corridor === 'East-West').length;

    const safetyConcern = incidents.filter(i => i.safetyConcern).length;
    const serviceDisruption = incidents.filter(i => i.serviceDisruption).length;

    const catMap: { [cat: string]: number } = {};
    const statusMap: { [status: string]: number } = {
      'Open': 0,
      'Acknowledged': 0,
      'In Progress': 0,
      'Resolved': 0,
      'Closed': 0,
    };

    incidents.forEach(i => {
      catMap[i.category] = (catMap[i.category] || 0) + 1;
      statusMap[i.status] = (statusMap[i.status] || 0) + 1;
    });

    // Work Order metrics
    const woQueued = workOrders.filter(w => w.column === 'queued').length;
    const woDispatched = workOrders.filter(w => w.column === 'dispatched').length;
    const woProgress = workOrders.filter(w => w.column === 'progress').length;
    const woCompleted = workOrders.filter(w => w.column === 'completed').length;

    const allChecklistItems = workOrders.flatMap(w => w.checklist);
    const completedChecklistItems = allChecklistItems.filter(c => c.completed).length;
    const overallTaskProgress = allChecklistItems.length > 0 
      ? Math.round((completedChecklistItems / allChecklistItems.length) * 100) 
      : 0;

    return {
      criticalCount: critical,
      warningCount: warning,
      lowCount: low,
      resolvedIncidents,
      activeIncidents,
      nsCount: ns,
      ewCount: ew,
      categoryCounts: catMap,
      statusCounts: statusMap,
      incidentResolutionRate: totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0,
      safetyConcernCount: safetyConcern,
      serviceDisruptionCount: serviceDisruption,
      woQueued,
      woDispatched,
      woProgress,
      woCompleted,
      totalChecklistItems: allChecklistItems.length,
      completedChecklistItems,
      overallTaskProgress,
      workOrderCompletionRate: totalWorkOrders > 0 ? Math.round((woCompleted / totalWorkOrders) * 100) : 0
    };
  }, [incidents, workOrders, totalIncidents, totalWorkOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Operational Analytics & Performance
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time incident intelligence and maintenance checklist metrics calculated strictly from stored records.
        </p>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Incidents
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {totalIncidents}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {stats.activeIncidents} currently active
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Incident Resolution
          </span>
          <div className="text-2xl font-bold text-teal-700 mt-1 font-mono tabular-nums">
            {stats.incidentResolutionRate}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {stats.resolvedIncidents} of {totalIncidents} cleared
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Checklist Completion
          </span>
          <div className="text-2xl font-bold text-teal-700 mt-1 font-mono tabular-nums">
            {stats.overallTaskProgress}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {stats.completedChecklistItems} of {stats.totalChecklistItems} inspection steps done
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Work Orders
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {totalWorkOrders}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {stats.woCompleted} signed off, {stats.woProgress} in progress
          </span>
        </div>
      </div>

      {/* Grid: Corridors & Severities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Corridor Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Corridor Line Breakdown
            </h2>
            <span className="text-[11px] font-mono text-slate-400">{totalIncidents} incidents</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* North-South */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800">North-South Line (APMC ⇄ Motera)</span>
                <span className="font-mono text-slate-600">
                  {stats.nsCount} ({totalIncidents > 0 ? Math.round((stats.nsCount / totalIncidents) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-teal-700 transition-all duration-300"
                  style={{ width: `${totalIncidents > 0 ? (stats.nsCount / totalIncidents) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* East-West */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800">East-West Line (Thaltej ⇄ Vastral)</span>
                <span className="font-mono text-slate-600">
                  {stats.ewCount} ({totalIncidents > 0 ? Math.round((stats.ewCount / totalIncidents) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-cyan-600 transition-all duration-300"
                  style={{ width: `${totalIncidents > 0 ? (stats.ewCount / totalIncidents) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Severity Distribution
            </h2>
            <span className="text-[11px] font-mono text-slate-400">By operational urgency</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-red-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  Critical
                </span>
                <span className="font-mono font-semibold text-slate-700">
                  {stats.criticalCount}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${totalIncidents > 0 ? (stats.criticalCount / totalIncidents) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Warning
                </span>
                <span className="font-mono font-semibold text-slate-700">
                  {stats.warningCount}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${totalIncidents > 0 ? (stats.warningCount / totalIncidents) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Low / Routine
                </span>
                <span className="font-mono font-semibold text-slate-700">
                  {stats.lowCount}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-slate-400 transition-all duration-300"
                  style={{ width: `${totalIncidents > 0 ? (stats.lowCount / totalIncidents) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subsystem & Maintenance Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Subsystem & Infrastructure Category
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Domain Classification</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {Object.entries(stats.categoryCounts).map(([cat, count]) => {
              const pct = totalIncidents > 0 ? Math.round((count / totalIncidents) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">{cat}</span>
                    <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-teal-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Maintenance Work Order Stages */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Maintenance Task Pipeline
            </h2>
            <span className="text-[11px] font-mono text-slate-400">{totalWorkOrders} work orders</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-700">Completed & Signed Off</span>
                <span className="font-mono text-emerald-700 font-semibold">{stats.woCompleted}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${totalWorkOrders > 0 ? (stats.woCompleted / totalWorkOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-700">In Progress on Trackside</span>
                <span className="font-mono text-teal-800 font-semibold">{stats.woProgress}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${totalWorkOrders > 0 ? (stats.woProgress / totalWorkOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-700">Dispatched En Route</span>
                <span className="font-mono text-indigo-700 font-semibold">{stats.woDispatched}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${totalWorkOrders > 0 ? (stats.woDispatched / totalWorkOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-700">Queued in Dispatch</span>
                <span className="font-mono text-slate-600 font-semibold">{stats.woQueued}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-slate-400 transition-all duration-300"
                  style={{ width: `${totalWorkOrders > 0 ? (stats.woQueued / totalWorkOrders) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PS-02 Predictive Asset Failure Risk Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-700 text-sm">troubleshoot</span>
              Predictive Asset Failure Risk Distribution (PS-02)
            </h2>
            <span className="text-[11px] text-slate-500">
              Rule-based estimate of relative asset failure risk for the next 7 days across monitored assets.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('asset-risk')}
            className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1"
          >
            <span>Open Asset Risk Console</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-red-50/60 rounded-xl border border-red-200">
            <span className="text-[10px] uppercase font-bold text-red-700 block">High Risk (60+)</span>
            <span className="font-mono text-xl font-bold text-red-800 mt-1 block">
              {rankedAssetRisks.filter(a => a.riskBand === 'High').length}
            </span>
            <span className="text-[10px] text-red-600 mt-0.5 block">Critical shift priority candidates</span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Medium Risk (30-59)</span>
            <span className="font-mono text-xl font-bold text-amber-900 mt-1 block">
              {rankedAssetRisks.filter(a => a.riskBand === 'Medium').length}
            </span>
            <span className="text-[10px] text-amber-700 mt-0.5 block">Pre-failure degradation warnings</span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Low Risk (&lt;30)</span>
            <span className="font-mono text-xl font-bold text-emerald-900 mt-1 block">
              {rankedAssetRisks.filter(a => a.riskBand === 'Low').length}
            </span>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">Nominal operating tolerances</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">Insufficient Data</span>
            <span className="font-mono text-xl font-bold text-slate-800 mt-1 block">
              {rankedAssetRisks.filter(a => !a.hasSufficientData).length}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Observation period &lt;30 days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

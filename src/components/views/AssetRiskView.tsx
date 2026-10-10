import React, { useState, useMemo } from 'react';
import { useMetro } from '../../context/MetroContext';
import { AssetRiskAssessment, AssetType, RiskBand, AssetFaultLog } from '../../types/metro';
import { RISK_ENGINE_CONFIG } from '../../utils/riskEngine';
import { DEMO_DATA_NOTICE } from '../../data/syntheticAssetData';
import { LogFaultModal } from '../modals/LogFaultModal';

export const AssetRiskView: React.FC = () => {
  const { 
    rankedAssetRisks, 
    stations, 
    assets,
    faultLogs,
    resolveFaultLog,
    updateAssetPmDate,
    selectedRiskAssetId,
    setSelectedRiskAssetId,
    setIsGenerateRosterModalOpen,
    setActiveTab,
    initiateWorkOrderFromIncident,
    incidents
  } = useMetro();

  // Filter States
  const [filterStation, setFilterStation] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterBand, setFilterBand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [isLogFaultModalOpen, setIsLogFaultModalOpen] = useState<boolean>(false);
  const [targetAssetForFault, setTargetAssetForFault] = useState<string | undefined>(undefined);

  // Resolution note state inside drawer
  const [resolvingLogId, setResolvingLogId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  // Selected asset detail
  const selectedAssessment = useMemo(() => {
    if (!selectedRiskAssetId) return null;
    return rankedAssetRisks.find(a => a.assetId === selectedRiskAssetId) || null;
  }, [selectedRiskAssetId, rankedAssetRisks]);

  const selectedAssetFaults = useMemo(() => {
    if (!selectedAssessment) return [];
    return faultLogs.filter(l => l.assetId === selectedAssessment.assetId);
  }, [selectedAssessment, faultLogs]);

  // Filtered Assets
  const filteredAssessments = useMemo(() => {
    return rankedAssetRisks.filter(assessment => {
      const { asset, riskBand } = assessment;

      const matchesStation = filterStation === 'all' || asset.station === filterStation;
      const matchesType = filterType === 'all' || asset.type === filterType;
      const matchesBand = filterBand === 'all' || riskBand === filterBand;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.id.toLowerCase().includes(q) ||
        asset.station.toLowerCase().includes(q) ||
        asset.type.toLowerCase().includes(q);

      return matchesStation && matchesType && matchesBand && matchesSearch;
    });
  }, [rankedAssetRisks, filterStation, filterType, filterBand, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = rankedAssetRisks.length;
    const high = rankedAssetRisks.filter(a => a.riskBand === 'High').length;
    const medium = rankedAssetRisks.filter(a => a.riskBand === 'Medium').length;
    const low = rankedAssetRisks.filter(a => a.riskBand === 'Low').length;
    const insufficient = rankedAssetRisks.filter(a => !a.hasSufficientData).length;
    const overduePm = rankedAssetRisks.filter(a => a.maintenanceStatus.isOverdue).length;
    const activeDefects = rankedAssetRisks.reduce((acc, a) => acc + a.unresolvedFaultsCount, 0);

    return { total, high, medium, low, insufficient, overduePm, activeDefects };
  }, [rankedAssetRisks]);

  // Handlers
  const handleOpenFaultModal = (assetId?: string) => {
    setTargetAssetForFault(assetId);
    setIsLogFaultModalOpen(true);
  };

  const handleResolveFault = async (logId: string) => {
    await resolveFaultLog(logId, resolutionNotes || 'Component inspected and rectified during station visit.');
    setResolvingLogId(null);
    setResolutionNotes('');
  };

  const handleQuickPmComplete = async (assetId: string) => {
    await updateAssetPmDate(assetId, new Date().toISOString());
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Asset Failure Risk & Predictive Ranking
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Demo data
            </span>
          </div>
          {/* Concise disclosure */}
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Rule-based relative risk estimate for the next 7 days; not a validated failure probability.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => handleOpenFaultModal()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs min-h-[42px] sm:min-h-auto"
          >
            <span className="material-symbols-outlined text-sm text-amber-700">report_problem</span>
            <span>+ Log Asset Fault</span>
          </button>

          <button
            onClick={() => setIsGenerateRosterModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors shadow-xs min-h-[42px] sm:min-h-auto"
          >
            <span className="material-symbols-outlined text-sm">auto_schedule</span>
            <span>Generate Night-Shift Roster</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Monitored Assets</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">{metrics.total}</span>
          <span className="text-[10px] text-slate-500">Gates, TVMs, Lifts & ESCs</span>
        </div>

        <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-200/80 shadow-xs">
          <span className="text-red-700 text-[10px] uppercase font-bold tracking-wider block">High Risk (60+)</span>
          <span className="text-xl font-bold font-mono text-red-700 mt-1 block">{metrics.high}</span>
          <span className="text-[10px] text-red-600">Immediate shift priority</span>
        </div>

        <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 shadow-xs">
          <span className="text-amber-800 text-[10px] uppercase font-bold tracking-wider block">Medium Risk (30-59)</span>
          <span className="text-xl font-bold font-mono text-amber-800 mt-1 block">{metrics.medium}</span>
          <span className="text-[10px] text-amber-700">Pre-failure degradation</span>
        </div>

        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 shadow-xs">
          <span className="text-emerald-800 text-[10px] uppercase font-bold tracking-wider block">Low Risk (&lt;30)</span>
          <span className="text-xl font-bold font-mono text-emerald-800 mt-1 block">{metrics.low}</span>
          <span className="text-[10px] text-emerald-700">Nominal performance</span>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Insufficient Data</span>
          <span className="text-xl font-bold font-mono text-slate-700 mt-1 block">{metrics.insufficient}</span>
          <span className="text-[10px] text-slate-500">Under 30d baseline</span>
        </div>

        <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80 shadow-xs">
          <span className="text-purple-800 text-[10px] uppercase font-bold tracking-wider block">PM Overdue</span>
          <span className="text-xl font-bold font-mono text-purple-800 mt-1 block">{metrics.overduePm}</span>
          <span className="text-[10px] text-purple-700">Cycle expired</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 flex-1">
          {/* Station Filter */}
          <select
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-teal-600 shadow-xs min-h-[40px]"
          >
            <option value="all">All Stations (Ahmedabad)</option>
            {stations.map(s => (
              <option key={s.id} value={s.name}>{s.name} ({s.line})</option>
            ))}
          </select>

          {/* Asset Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-teal-600 shadow-xs min-h-[40px]"
          >
            <option value="all">All Asset Types</option>
            <option value="Ticket Gate">Ticket Gate</option>
            <option value="Ticket Vending Machine">Ticket Vending Machine</option>
            <option value="Lift">Passenger Lift</option>
            <option value="Escalator">Escalator</option>
            <option value="Platform Screen Door">Platform Screen Door</option>
            <option value="Point Machine">Point Machine</option>
          </select>

          {/* Risk Band Filter */}
          <select
            value={filterBand}
            onChange={(e) => setFilterBand(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-teal-600 shadow-xs min-h-[40px]"
          >
            <option value="all">All Risk Bands</option>
            <option value="High">High Risk (60-100)</option>
            <option value="Medium">Medium Risk (30-59)</option>
            <option value="Low">Low Risk (0-29)</option>
            <option value="Insufficient Data">Insufficient Data</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search asset, ID, station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white min-h-[40px]"
          />
        </div>
      </div>

      {/* Asset Risk Ranking List */}
      <div className="space-y-3">
        {filteredAssessments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
            <span className="material-symbols-outlined text-3xl text-slate-400 mb-1 block">filter_alt_off</span>
            No assets match current filters.
          </div>
        ) : (
          filteredAssessments.map((assessment, rankIdx) => {
            const { asset, riskScore, riskBand, hasSufficientData, recentFaultsCount, frequencyAcceleration, maintenanceStatus, reasons, unresolvedFaultsCount } = assessment;

            const isSelected = selectedRiskAssetId === asset.id;

            return (
              <div
                key={asset.id}
                onClick={() => setSelectedRiskAssetId(isSelected ? null : asset.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                  isSelected 
                    ? 'border-teal-600 ring-2 ring-teal-600/10 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Rank, ID, Asset Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-700 text-xs shrink-0">
                      #{rankIdx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {asset.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          {asset.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                          {asset.type}
                        </span>
                        {/* Distinct Tag for Active Corrective Faults */}
                        {unresolvedFaultsCount > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-900 border border-red-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            {unresolvedFaultsCount} Active Corrective Defect(s)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                        <span>{asset.station} ({asset.line} Line)</span>
                        <span className="hidden sm:inline">·</span>
                        <span>{recentFaultsCount} fault(s) in last 30d</span>
                        <span className="hidden sm:inline">·</span>
                        <span className={maintenanceStatus.isOverdue ? 'text-red-700 font-semibold' : 'text-slate-600'}>
                          {maintenanceStatus.label}
                        </span>
                      </div>

                      {/* Primary Heuristic Reason */}
                      <p className="text-xs text-slate-700 mt-1.5 font-medium leading-relaxed">
                        {reasons[0] || 'Asset operating nominal.'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Risk Score & Action */}
                  <div className="flex items-center gap-4 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    {/* Score Metric */}
                    <div className="text-right">
                      {!hasSufficientData ? (
                        <div>
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Insufficient Data
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Commissioned &lt;30d
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-20 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  riskScore >= 60 ? 'bg-red-600' :
                                  riskScore >= 30 ? 'bg-amber-500' :
                                  'bg-emerald-500'
                                }`}
                                style={{ width: `${riskScore}%` }}
                              />
                            </div>
                            <span className="font-mono text-base font-bold text-slate-900">
                              {riskScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                            </span>
                          </div>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider block mt-0.5 ${
                            riskBand === 'High' ? 'text-red-700' :
                            riskBand === 'Medium' ? 'text-amber-800' :
                            'text-emerald-700'
                          }`}>
                            {riskBand} Risk
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFaultModal(asset.id);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-colors"
                        title="Log a new defect event"
                      >
                        + Log Fault
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRiskAssetId(isSelected ? null : asset.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected 
                            ? 'bg-teal-700 text-white' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isSelected ? 'Close Details' : 'View Breakdown →'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Score Breakdown & Fault History Drawer */}
                {isSelected && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-fade-in"
                  >
                    {/* Heuristic Factors Progress Bars */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-slate-900 text-xs">
                          Deterministic Heuristic Risk Breakdown
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Outlook Window: {new Date(assessment.outlookPeriod.startDate).toLocaleDateString()} to {new Date(assessment.outlookPeriod.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-500 text-[11px]">30-Day Frequency</span>
                            <span className="font-mono font-bold text-slate-800">
                              {assessment.factors.frequencyScore}/35
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-slate-700 rounded-full" 
                              style={{ width: `${(assessment.factors.frequencyScore / 35) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {assessment.recentFaultsCount} faults in 30d
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-500 text-[11px]">Repeated Failure Pattern</span>
                            <span className="font-mono font-bold text-slate-800">
                              {assessment.factors.repeatScore}/25
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-slate-700 rounded-full" 
                              style={{ width: `${(assessment.factors.repeatScore / 25) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {assessment.repeatedFaultPatterns.length > 0 
                              ? `${assessment.repeatedFaultPatterns[0].code} (${assessment.repeatedFaultPatterns[0].count}x)` 
                              : 'No repeating error codes'}
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-500 text-[11px]">Rate Acceleration (14d)</span>
                            <span className="font-mono font-bold text-slate-800">
                              {assessment.factors.accelerationScore}/20
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-slate-700 rounded-full" 
                              style={{ width: `${(assessment.factors.accelerationScore / 20) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block truncate">
                            {assessment.frequencyAcceleration.description}
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-500 text-[11px]">Preventive Maintenance</span>
                            <span className="font-mono font-bold text-slate-800">
                              {assessment.factors.maintenanceScore}/20
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-slate-700 rounded-full" 
                              style={{ width: `${(assessment.factors.maintenanceScore / 20) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {assessment.maintenanceStatus.daysSinceLastPm !== null 
                              ? `Last PM: ${assessment.maintenanceStatus.daysSinceLastPm}d ago` 
                              : 'No schedule recorded'}
                          </span>
                        </div>
                      </div>

                      {/* Contributing Reasons List */}
                      <div className="mt-3 pt-3 border-t border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Contributing Risk Signals:
                        </span>
                        <ul className="space-y-0.5 text-[11px] text-slate-600 list-disc list-inside">
                          {reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Historical Fault Records Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900 text-xs">
                          Underlying Historical Fault Records ({selectedAssetFaults.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickPmComplete(asset.id)}
                            className="text-[11px] text-teal-800 hover:text-teal-900 font-semibold px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                          >
                            ✓ Record PM Servicing Completed Today
                          </button>
                        </div>
                      </div>

                      {selectedAssetFaults.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400 text-xs">
                          No historical faults recorded for this asset.
                        </div>
                      ) : (
                        <>
                          {/* Mobile Fault Cards (< md) */}
                          <div className="md:hidden space-y-2.5">
                            {selectedAssetFaults.map(fault => {
                              const isUnresolved = !fault.resolvedAt;

                              return (
                                <div 
                                  key={fault.id} 
                                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                                    isUnresolved ? 'bg-red-50/40 border-red-200' : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="font-mono font-bold text-slate-900">
                                        {fault.faultCode}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-medium">
                                        {fault.faultCategory}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                        fault.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                                        fault.severity === 'Major' ? 'bg-amber-100 text-amber-900' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {fault.severity}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-slate-700 text-xs leading-relaxed">
                                    {fault.description}
                                  </p>

                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                                    <div className="font-mono text-slate-500">
                                      {new Date(fault.timestamp).toLocaleDateString()} {new Date(fault.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>

                                    <div>
                                      {isUnresolved ? (
                                        <button
                                          onClick={() => setResolvingLogId(fault.id)}
                                          className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition-colors min-h-[38px] flex items-center justify-center gap-1"
                                        >
                                          <span className="material-symbols-outlined text-sm">check_circle</span>
                                          <span>Mark Resolved</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-emerald-700 font-medium">
                                          Resolved ({new Date(fault.resolvedAt!).toLocaleDateString()})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Desktop Table View (>= md) */}
                          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs bg-white">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                                <tr>
                                  <th className="p-2.5">Date / Time</th>
                                  <th className="p-2.5">Fault Code</th>
                                  <th className="p-2.5">Category</th>
                                  <th className="p-2.5">Severity</th>
                                  <th className="p-2.5">Description</th>
                                  <th className="p-2.5">Status</th>
                                  <th className="p-2.5 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {selectedAssetFaults.map(fault => {
                                  const isUnresolved = !fault.resolvedAt;

                                  return (
                                    <tr key={fault.id} className={isUnresolved ? 'bg-red-50/30' : 'hover:bg-slate-50/50'}>
                                      <td className="p-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                                        {new Date(fault.timestamp).toLocaleDateString()} {new Date(fault.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </td>
                                      <td className="p-2.5 font-mono font-bold text-slate-800">
                                        {fault.faultCode}
                                      </td>
                                      <td className="p-2.5 text-slate-700">
                                        {fault.faultCategory}
                                      </td>
                                      <td className="p-2.5">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                          fault.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                                          fault.severity === 'Major' ? 'bg-amber-100 text-amber-900' :
                                          'bg-slate-100 text-slate-700'
                                        }`}>
                                          {fault.severity}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-slate-600 max-w-xs truncate">
                                        {fault.description}
                                      </td>
                                      <td className="p-2.5 whitespace-nowrap">
                                        {isUnresolved ? (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                                            Unresolved Defect
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Resolved ({new Date(fault.resolvedAt!).toLocaleDateString()})
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-right whitespace-nowrap">
                                        {isUnresolved ? (
                                          <button
                                            onClick={() => setResolvingLogId(fault.id)}
                                            className="px-2 py-1 rounded bg-teal-700 text-white font-semibold text-[11px] hover:bg-teal-800 transition-colors"
                                          >
                                            Mark Resolved
                                          </button>
                                        ) : (
                                          <span className="text-[10px] text-slate-400">Archived</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}

                      {/* Resolution Input Drawer */}
                      {resolvingLogId && (
                        <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
                          <input
                            type="text"
                            placeholder="Enter technician clearance resolution note..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-teal-300 bg-white text-xs focus:outline-none min-h-[40px]"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleResolveFault(resolvingLogId)}
                              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors min-h-[40px]"
                            >
                              Save Clearance
                            </button>
                            <button
                              onClick={() => setResolvingLogId(null)}
                              className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-200 min-h-[40px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Log Fault Modal */}
      <LogFaultModal
        isOpen={isLogFaultModalOpen}
        onClose={() => setIsLogFaultModalOpen(false)}
        preselectedAssetId={targetAssetForFault}
      />
    </div>
  );
};

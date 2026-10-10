import React, { useState, useEffect, useMemo } from 'react';
import { useMetro } from '../../context/MetroContext';

export const CommandPalette: React.FC = () => {
  const { 
    isCommandPaletteOpen, 
    setIsCommandPaletteOpen, 
    incidents, 
    stations, 
    workOrders, 
    assets,
    rankedAssetRisks,
    setSelectedRiskAssetId,
    setActiveTab, 
    openDrawer 
  } = useMetro();

  const [query, setQuery] = useState('');

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matchedAssets = rankedAssetRisks
      .filter(a => a.asset.id.toLowerCase().includes(q) || a.asset.name.toLowerCase().includes(q) || a.asset.type.toLowerCase().includes(q) || a.asset.station.toLowerCase().includes(q))
      .slice(0, 3)
      .map(a => ({ type: 'asset' as const, data: a }));

    const matchedIncidents = incidents
      .filter(i => i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.station.toLowerCase().includes(q))
      .slice(0, 3)
      .map(i => ({ type: 'incident' as const, data: i }));

    const matchedWorkOrders = workOrders
      .filter(w => w.id.toLowerCase().includes(q) || w.title.toLowerCase().includes(q) || w.location.toLowerCase().includes(q))
      .slice(0, 3)
      .map(w => ({ type: 'workOrder' as const, data: w }));

    const matchedStations = stations
      .filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      .slice(0, 3)
      .map(s => ({ type: 'station' as const, data: s }));

    return [...matchedAssets, ...matchedIncidents, ...matchedWorkOrders, ...matchedStations];
  }, [query, incidents, workOrders, stations, rankedAssetRisks]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div 
        className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
          <span className="material-symbols-outlined text-slate-400 text-lg mr-2.5">search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search incidents, stations, work orders (e.g. INC-2025, Kalupur, Pantograph)..."
            className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-xs focus:outline-none font-medium"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-500 font-mono text-[10px] border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Quick Navigation Commands */}
        {!query && (
          <div className="p-4 space-y-3 text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Quick Navigation
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setActiveTab('asset-risk'); setIsCommandPaletteOpen(false); }}
                className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/50 hover:bg-amber-50 text-amber-950 text-left transition-colors border border-amber-200"
              >
                <span className="material-symbols-outlined text-base text-amber-700">troubleshoot</span>
                <span className="font-semibold">Asset Failure Risk</span>
              </button>
              <button
                onClick={() => { setActiveTab('maintenance'); setIsCommandPaletteOpen(false); }}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-slate-700 text-left transition-colors border border-slate-100"
              >
                <span className="material-symbols-outlined text-base text-teal-700">nightlight</span>
                <span>Night-Shift Roster</span>
              </button>
              <button
                onClick={() => { setActiveTab('overview'); setIsCommandPaletteOpen(false); }}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-slate-700 text-left transition-colors border border-slate-100"
              >
                <span className="material-symbols-outlined text-base text-teal-700">dashboard</span>
                <span>Operations Overview</span>
              </button>
              <button
                onClick={() => { setActiveTab('incidents'); setIsCommandPaletteOpen(false); }}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-slate-700 text-left transition-colors border border-slate-100"
              >
                <span className="material-symbols-outlined text-base text-teal-700">crisis_alert</span>
                <span>Incident Console</span>
              </button>
              <button
                onClick={() => { setActiveTab('report-incident'); setIsCommandPaletteOpen(false); }}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-slate-700 text-left transition-colors border border-slate-100"
              >
                <span className="material-symbols-outlined text-base text-teal-700">add_circle</span>
                <span>Report Incident</span>
              </button>
              <button
                onClick={() => { setActiveTab('stations-and-assets'); setIsCommandPaletteOpen(false); }}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-slate-700 text-left transition-colors border border-slate-100"
              >
                <span className="material-symbols-outlined text-base text-teal-700">train</span>
                <span>Stations & Alignment</span>
              </button>
            </div>
          </div>
        )}

        {/* Filtered Search Results */}
        {query && (
          <div className="max-h-72 overflow-y-auto p-2 text-xs divide-y divide-slate-100">
            {filteredResults.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No matching results for "{query}"
              </div>
            ) : (
              filteredResults.map((item, idx) => {
                if (item.type === 'asset') {
                  const assessment = item.data;
                  const ast = assessment.asset;
                  return (
                    <div
                      key={`ast-${ast.id}-${idx}`}
                      onClick={() => {
                        setSelectedRiskAssetId(ast.id);
                        setActiveTab('asset-risk');
                        setIsCommandPaletteOpen(false);
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">{ast.id}</span>
                          <span className="font-semibold text-slate-900">{ast.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">{ast.type}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ast.station} · {assessment.reasons[0] || 'Nominal performance'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          assessment.riskBand === 'High' ? 'bg-red-100 text-red-800' :
                          assessment.riskBand === 'Medium' ? 'bg-amber-100 text-amber-900' :
                          assessment.riskBand === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          Risk: {assessment.hasSufficientData ? `${assessment.riskScore}/100` : 'Insuff. Data'}
                        </span>
                      </div>
                    </div>
                  );
                }

                if (item.type === 'incident') {
                  const inc = item.data;
                  return (
                    <div
                      key={`inc-${inc.id}-${idx}`}
                      onClick={() => {
                        setActiveTab('incidents');
                        openDrawer(inc.id);
                        setIsCommandPaletteOpen(false);
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{inc.id}</span>
                          <span className="font-semibold text-slate-900">{inc.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {inc.station} · {inc.category}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inc.severity === 'Critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>
                  );
                }

                if (item.type === 'workOrder') {
                  const wo = item.data;
                  return (
                    <div
                      key={`wo-${wo.id}-${idx}`}
                      onClick={() => {
                        setActiveTab('maintenance');
                        setIsCommandPaletteOpen(false);
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-600 font-semibold">{wo.id}</span>
                          <span className="font-semibold text-slate-900">{wo.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {wo.station} · {wo.assignedTeam}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {wo.column}
                      </span>
                    </div>
                  );
                }

                if (item.type === 'station') {
                  const st = item.data;
                  return (
                    <div
                      key={`st-${st.id}-${idx}`}
                      onClick={() => {
                        setActiveTab('stations-and-assets');
                        setIsCommandPaletteOpen(false);
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{st.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{st.code}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {st.line === 'NS' ? 'North-South Line' : 'East-West Line'} · {st.elevatedOrUnderground}
                        </div>
                      </div>
                      <span className="text-[11px] text-teal-700 font-medium">
                        Jump to Station →
                      </span>
                    </div>
                  );
                }

                return null;
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

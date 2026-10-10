import React, { useState, useMemo } from 'react';
import { useMetro } from '../../context/MetroContext';
import { StationData } from '../../types/metro';

export const StationsAndAssetsView: React.FC = () => {
  const { stations, assets, incidents, setActiveTab, setSelectedRiskAssetId, openDrawer } = useMetro();

  const [selectedLine, setSelectedLine] = useState<'ALL' | 'NS' | 'EW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<StationData | null>(stations[6]); // Old High Court default

  // Calculate station status based on active incidents
  const getStationStatus = (stationName: string) => {
    const stationIncidents = incidents.filter(
      i => i.station.toLowerCase() === stationName.toLowerCase() && i.status !== 'Resolved' && i.status !== 'Closed'
    );

    if (stationIncidents.some(i => i.severity === 'Critical')) {
      return { label: 'Critical Alert', color: 'text-red-700 bg-red-50 border-red-200', count: stationIncidents.length };
    }
    if (stationIncidents.length > 0) {
      return { label: 'Active Advisory', color: 'text-amber-800 bg-amber-50 border-amber-200', count: stationIncidents.length };
    }
    return { label: 'Normal Service', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', count: 0 };
  };

  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      const matchesLine = selectedLine === 'ALL' || s.line === selectedLine;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.name.toLowerCase().includes(q) || 
        s.code.toLowerCase().includes(q) ||
        s.chainageKm.includes(q);
      return matchesLine && matchesSearch;
    });
  }, [stations, selectedLine, searchQuery]);

  // Incidents at the currently selected station
  const stationIncidents = useMemo(() => {
    if (!selectedStation) return [];
    return incidents.filter(i => i.station.toLowerCase() === selectedStation.name.toLowerCase());
  }, [selectedStation, incidents]);

  // Assets at selected station
  const stationAssets = useMemo(() => {
    if (!selectedStation) return [];
    const stName = selectedStation.name.toLowerCase();
    return assets.filter(a => 
      (a.station && a.station.toLowerCase().includes(stName)) ||
      (a.stationOrSection && a.stationOrSection.toLowerCase().includes(stName))
    );
  }, [selectedStation, assets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Stations & Corridor Infrastructure
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ahmedabad Metro Phase 1 network alignment, station interlocks, and trackside assets.
          </p>
        </div>

        {/* Corridor Line Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedLine('ALL')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap min-h-[38px] ${
              selectedLine === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Lines (32)
          </button>
          <button
            onClick={() => setSelectedLine('NS')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap min-h-[38px] ${
              selectedLine === 'NS' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            North-South (15)
          </button>
          <button
            onClick={() => setSelectedLine('EW')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap min-h-[38px] ${
              selectedLine === 'EW' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            East-West (17)
          </button>
        </div>
      </div>

      {/* Corridor Track Ribbon Schematic */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Corridor Station Alignment
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="hidden sm:inline">Click any station node to inspect details</span>
            <span className="sm:hidden font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-[10px]">↔ Swipe line</span>
          </div>
        </div>

        {/* Interactive Station Strip */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
          <div className="flex items-center gap-2 min-w-[900px] py-3 px-2">
            {filteredStations.map((st) => {
              const status = getStationStatus(st.name);
              const isSelected = selectedStation?.id === st.id;

              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`flex-1 min-w-[70px] flex flex-col items-center group transition-all text-center focus:outline-none`}
                >
                  {/* Status Circle Node */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    isSelected 
                      ? 'border-teal-700 bg-teal-700 text-white shadow-xs' 
                      : status.count > 0 
                      ? 'border-amber-500 bg-amber-50 text-amber-800' 
                      : 'border-slate-300 bg-white text-slate-600 group-hover:border-slate-400'
                  }`}>
                    {status.count > 0 ? (
                      <span className="text-[10px] font-bold font-mono">{status.count}</span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    )}
                  </div>

                  {/* Station Code & Name */}
                  <span className={`text-[11px] font-mono font-semibold mt-1.5 transition-colors ${
                    isSelected ? 'text-teal-900 font-bold' : 'text-slate-700'
                  }`}>
                    {st.code}
                  </span>
                  <span className="text-[10px] text-slate-500 max-w-[72px] truncate group-hover:text-slate-900">
                    {st.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Station Directory (7 cols) + Selected Station Detail (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Station Directory */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Station Directory ({filteredStations.length})
            </h2>

            <div className="relative w-48">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search station..."
                className="w-full pl-7 pr-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredStations.map(st => {
              const status = getStationStatus(st.name);
              const isSelected = selectedStation?.id === st.id;

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-lg transition-colors text-xs ${
                    isSelected ? 'bg-teal-50/40 border border-teal-200/60' : ''
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{st.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{st.code}</span>
                      {st.interchange && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                          Interchange
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {st.line === 'NS' ? 'North-South Line' : 'East-West Line'} · {st.elevatedOrUnderground} · {st.chainageKm} km
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Station Detail Inspector */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          {selectedStation ? (
            <>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold">{selectedStation.code}</span>
                    <span>·</span>
                    <span>{selectedStation.line === 'NS' ? 'North-South Corridor' : 'East-West Corridor'}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedStation.name} Station
                  </h3>
                </div>

                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStationStatus(selectedStation.name).color}`}>
                  {getStationStatus(selectedStation.name).label}
                </span>
              </div>

              {/* Station Parameters */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Structure</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{selectedStation.elevatedOrUnderground}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Platforms</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{selectedStation.platforms} Platforms</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Chainage</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block font-mono">{selectedStation.chainageKm} km</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Interchange</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{selectedStation.interchange ? 'Yes (NS / EW)' : 'Standard'}</span>
                </div>
              </div>

              {/* Station Active Incidents */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900">
                  Recorded Incidents at {selectedStation.name} ({stationIncidents.length})
                </h4>

                {stationIncidents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No active or past incidents recorded for this station.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stationIncidents.map(inc => (
                      <div
                        key={inc.id}
                        onClick={() => {
                          setActiveTab('incidents');
                          openDrawer(inc.id);
                        }}
                        className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-slate-800">{inc.id}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            inc.severity === 'Critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {inc.severity}
                          </span>
                        </div>
                        <div className="font-medium text-slate-900 truncate">{inc.title}</div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>{inc.category}</span>
                          <span className="font-medium text-teal-700">{inc.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Station Infrastructure Assets */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900">
                  Trackside Assets ({stationAssets.length})
                </h4>

                {stationAssets.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">
                    Standard station concourse and traction components nominal.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {stationAssets.map(ast => (
                      <div 
                        key={ast.id} 
                        onClick={() => {
                          setSelectedRiskAssetId(ast.id);
                          setActiveTab('asset-risk');
                        }}
                        className="p-2 bg-slate-50 hover:bg-teal-50/50 rounded border border-slate-100 hover:border-teal-200 flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-medium text-slate-800">{ast.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{ast.id} · {ast.type}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                            ast.status === 'Operational' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {ast.status}
                          </span>
                          <span className="text-[10px] text-teal-700 font-semibold">Risk →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('report-incident')}
                  className="w-full py-2 rounded-lg bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition-colors shadow-xs"
                >
                  Report Incident at {selectedStation.name}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a station from the directory to inspect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

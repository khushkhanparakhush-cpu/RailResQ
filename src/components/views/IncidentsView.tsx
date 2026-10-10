import React, { useState, useMemo } from 'react';
import { useMetro } from '../../context/MetroContext';
import { IncidentStatus, IncidentSeverity, Corridor } from '../../types/metro';

export const IncidentsView: React.FC = () => {
  const { 
    incidents, 
    activeDrawerIncident, 
    isDrawerOpen, 
    openDrawer, 
    closeDrawer, 
    updateIncidentStatus, 
    updateIncident, 
    openDeleteIncidentModal,
    workOrders,
    openWorkOrderDrawer,
    initiateWorkOrderFromIncident,
    setActiveTab, 
    showToast,
    globalSearch,
    setGlobalSearch
  } = useMetro();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [corridorFilter, setCorridorFilter] = useState<string>('all');

  // Drawer Edit Form States
  const [noteText, setNoteText] = useState<string>('');
  const [editTeam, setEditTeam] = useState<string>('');
  const [isEditingTeam, setIsEditingTeam] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');

  // Scroll lock and escape listener for drawer
  React.useEffect(() => {
    if (!isDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  // Filter evaluation
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const q = globalSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.station.toLowerCase().includes(q) ||
        inc.location.toLowerCase().includes(q) ||
        inc.category.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter;
      const matchesCorridor = corridorFilter === 'all' || inc.corridor === corridorFilter;

      return matchesSearch && matchesStatus && matchesSeverity && matchesCorridor;
    });
  }, [incidents, globalSearch, statusFilter, severityFilter, corridorFilter]);

  // Linked work orders for active incident
  const linkedWorkOrders = useMemo(() => {
    if (!activeDrawerIncident) return [];
    return workOrders.filter(w => w.linkedIncidentId === activeDrawerIncident.id);
  }, [activeDrawerIncident, workOrders]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Incident ID',
      'Title',
      'Category',
      'Station',
      'Location',
      'Corridor',
      'Severity',
      'Passenger Impact',
      'Safety Concern',
      'Service Disruption',
      'Status',
      'Assigned Team',
      'Created At',
      'Updated At',
      'Resolved At'
    ];

    const rows = filteredIncidents.map(i => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.station}"`,
      `"${i.location}"`,
      i.corridor,
      i.severity,
      `"${i.passengerImpact}"`,
      i.safetyConcern ? 'Yes' : 'No',
      i.serviceDisruption ? 'Yes' : 'No',
      i.status,
      `"${i.assignedTeam}"`,
      i.createdAt,
      i.updatedAt,
      i.resolvedAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RailResQ_Incidents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredIncidents.length} incident records to CSV.`, 'success', 'download');
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !activeDrawerIncident) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedDesc = `${activeDrawerIncident.description}\n\n[Update ${timeStr}]: ${noteText.trim()}`;

    await updateIncident(activeDrawerIncident.id, {
      description: updatedDesc
    });

    setNoteText('');
  };

  const handleSaveTeam = async () => {
    if (!editTeam.trim() || !activeDrawerIncident) return;
    await updateIncident(activeDrawerIncident.id, {
      assignedTeam: editTeam.trim()
    });
    setIsEditingTeam(false);
  };

  const handleSaveTitle = async () => {
    if (!editTitle.trim() || !activeDrawerIncident) return;
    await updateIncident(activeDrawerIncident.id, {
      title: editTitle.trim()
    });
    setIsEditingTitle(false);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Incident Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time incident queue, operational triage, and response management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setActiveTab('report-incident')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search by ID, keyword, station, category..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-teal-600"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-teal-600"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
            <option value="Low">Low</option>
          </select>

          {/* Corridor Filter */}
          <select
            value={corridorFilter}
            onChange={(e) => setCorridorFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-teal-600"
          >
            <option value="all">All Corridors</option>
            <option value="North-South">North-South Line</option>
            <option value="East-West">East-West Line</option>
          </select>

          {(statusFilter !== 'all' || severityFilter !== 'all' || corridorFilter !== 'all' || globalSearch) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSeverityFilter('all');
                setCorridorFilter('all');
                setGlobalSearch('');
              }}
              className="px-2 py-1.5 text-slate-500 hover:text-slate-800 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Incident List */}
      <div className="relative">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong className="text-slate-800 font-mono">{filteredIncidents.length}</strong> incidents</span>
            <span className="font-mono text-[11px]">GMRC Incident Console</span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Title & Location</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Last Updated</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No matching incidents found.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map(inc => (
                    <tr 
                      key={inc.id}
                      onClick={() => openDrawer(inc.id)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        activeDrawerIncident?.id === inc.id && isDrawerOpen ? 'bg-teal-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{inc.id}</span>
                          {inc.isSample && (
                            <span className="px-1 py-0.2 rounded text-[9px] bg-slate-100 text-slate-500 uppercase font-sans">demo</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900 truncate">
                          {inc.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {inc.station} · {inc.location}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {inc.category}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                          inc.severity === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200/60' :
                          inc.severity === 'Warning' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                          'bg-slate-100 text-slate-600 border border-slate-200/60'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                          inc.status === 'Open' ? 'bg-blue-50 text-blue-700' :
                          inc.status === 'Acknowledged' ? 'bg-indigo-50 text-indigo-700' :
                          inc.status === 'In Progress' ? 'bg-teal-50 text-teal-800' :
                          inc.status === 'Resolved' || inc.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {formatDate(inc.updatedAt)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(inc.id);
                          }}
                          className="px-2 py-1 rounded text-teal-700 hover:bg-teal-50 font-semibold text-xs transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Incident Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No matching incidents found.
              </div>
            ) : (
              filteredIncidents.map(inc => (
                <div
                  key={inc.id}
                  onClick={() => openDrawer(inc.id)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-slate-800">{inc.id}</span>
                      {inc.isSample && (
                        <span className="px-1 py-0.2 rounded text-[9px] bg-slate-100 text-slate-500 uppercase">demo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inc.severity === 'Critical' ? 'bg-red-50 text-red-700' :
                        inc.severity === 'Warning' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {inc.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {inc.status}
                      </span>
                    </div>
                  </div>

                  <div className="font-semibold text-slate-900 text-xs">{inc.title}</div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{inc.station} · {inc.corridor}</span>
                    <span className="font-mono text-[10px]">{formatDate(inc.updatedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Slide-over Incident Details Drawer */}
        {isDrawerOpen && activeDrawerIncident && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div 
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
              onClick={closeDrawer}
            />

            <div className="fixed inset-y-0 right-0 pl-0 sm:pl-10 max-w-full flex">
              <div 
                className="w-screen max-w-lg bg-white h-[100dvh] shadow-2xl flex flex-col border-l border-slate-200"
                role="dialog"
                aria-modal="true"
                aria-label={`Incident ${activeDrawerIncident.id} Details`}
              >
                {/* Drawer Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {activeDrawerIncident.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      activeDrawerIncident.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                      activeDrawerIncident.severity === 'Warning' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {activeDrawerIncident.severity}
                    </span>
                    {activeDrawerIncident.isSample && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-600">Demo</span>
                    )}
                  </div>

                  <button
                    onClick={closeDrawer}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 -mr-1"
                    aria-label="Close incident drawer"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                {/* Drawer Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                  {/* Title & Core Location */}
                  <div>
                    {!isEditingTitle ? (
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-base font-bold text-slate-900 leading-snug">
                          {activeDrawerIncident.title}
                        </h2>
                        <button
                          onClick={() => {
                            setEditTitle(activeDrawerIncident.title);
                            setIsEditingTitle(true);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="Edit title"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-semibold text-slate-900"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveTitle}
                            className="px-2 py-0.5 bg-teal-700 text-white rounded text-[11px] font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingTitle(false)}
                            className="text-slate-400 hover:text-slate-600 text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="text-slate-500 text-xs mt-1">
                      {activeDrawerIncident.station} · {activeDrawerIncident.location} ({activeDrawerIncident.corridor} Line)
                    </div>
                  </div>

                  {/* Operational Status Selector */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="font-semibold text-slate-700 block uppercase tracking-wider text-[10px]">
                      Operational Status
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Open', 'In Progress', 'Resolved'] as IncidentStatus[]).map(st => (
                        <button
                          key={st}
                          onClick={() => updateIncidentStatus(activeDrawerIncident.id, st)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors border ${
                            activeDrawerIncident.status === st
                              ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary Attributes Grid */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Category</span>
                      <span className="font-medium text-slate-800 mt-0.5 block">{activeDrawerIncident.category}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Passenger Impact</span>
                      <span className="font-medium text-slate-800 mt-0.5 block">{activeDrawerIncident.passengerImpact}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Safety Concern</span>
                      <span className={`font-medium mt-0.5 block ${activeDrawerIncident.safetyConcern ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                        {activeDrawerIncident.safetyConcern ? 'Yes - Hazard Flagged' : 'No Immediate Hazard'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Service Disruption</span>
                      <span className={`font-medium mt-0.5 block ${activeDrawerIncident.serviceDisruption ? 'text-amber-700' : 'text-slate-600'}`}>
                        {activeDrawerIncident.serviceDisruption ? 'Active Delay' : 'Nominal'}
                      </span>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Team</span>
                        {!isEditingTeam ? (
                          <span className="font-semibold text-slate-800 mt-0.5 block">
                            {activeDrawerIncident.assignedTeam}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={editTeam}
                              onChange={e => setEditTeam(e.target.value)}
                              className="px-2 py-1 rounded border border-slate-200 text-xs w-48"
                            />
                            <button
                              onClick={handleSaveTeam}
                              className="px-2 py-1 rounded bg-teal-700 text-white text-xs font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setIsEditingTeam(false)}
                              className="text-slate-400 hover:text-slate-600 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      {!isEditingTeam && (
                        <button
                          onClick={() => {
                            setEditTeam(activeDrawerIncident.assignedTeam);
                            setIsEditingTeam(true);
                          }}
                          className="text-xs text-teal-700 hover:text-teal-900 font-medium"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Linked Maintenance Work Orders Section */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Linked Maintenance Work Orders ({linkedWorkOrders.length})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Active field tasks for this incident
                        </span>
                      </div>

                      <button
                        onClick={() => initiateWorkOrderFromIncident(activeDrawerIncident)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-700 text-white text-[11px] font-semibold hover:bg-teal-800 transition-colors shadow-xs"
                      >
                        <span className="material-symbols-outlined text-xs">add</span>
                        <span>Create Task</span>
                      </button>
                    </div>

                    {linkedWorkOrders.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px] py-1">
                        No maintenance work orders currently linked to this incident. Click "Create Task" to dispatch a squad with an inspection checklist.
                      </p>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {linkedWorkOrders.map(wo => (
                          <div 
                            key={wo.id}
                            className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-slate-800">{wo.id}</span>
                                <span className="font-semibold text-slate-900 truncate">{wo.title}</span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {wo.assignedTeam} · Progress: <strong className="text-teal-700 font-mono">{wo.progress}%</strong> ({wo.checklist.filter(c => c.completed).length}/{wo.checklist.length})
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                closeDrawer();
                                openWorkOrderDrawer(wo.id);
                              }}
                              className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-medium shrink-0"
                            >
                              Inspect →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Incident Narrative / Description */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Description & Field Notes
                    </span>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line font-mono text-[11px]">
                      {activeDrawerIncident.description}
                    </div>
                  </div>

                  {/* Add Operational Update */}
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Append Operational Note
                    </label>
                    <textarea
                      rows={2}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add an update from trackside inspection or OCC supervisor..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20"
                    />
                    <button
                      type="submit"
                      disabled={!noteText.trim()}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      Post Operational Note
                    </button>
                  </form>

                  {/* Timestamp & Meta */}
                  <div className="text-[11px] text-slate-400 border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2">
                    <span>Logged by: {activeDrawerIncident.reportedBy}</span>
                    <span>Created: {formatDate(activeDrawerIncident.createdAt)}</span>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <button
                    onClick={() => openDeleteIncidentModal(activeDrawerIncident)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>Delete Record</span>
                  </button>

                  <button
                    onClick={closeDrawer}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

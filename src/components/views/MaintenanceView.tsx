import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';
import { WorkOrder, WorkOrderColumn, RosterEntry } from '../../types/metro';
import { DEFAULT_MAINTENANCE_WINDOW_NOTE } from '../../utils/rosterEngine';

export const MaintenanceView: React.FC = () => {
  const { 
    workOrders, 
    advanceWorkOrderStage, 
    toggleChecklistItem,
    openWorkOrderDrawer,
    openDeleteWorkOrderModal,
    setIsCreateWorkOrderModalOpen,
    setIsGenerateRosterModalOpen,
    nightShiftRoster,
    completeTechnicianWorkOrder,
    setActiveTab,
    openDrawer: openIncidentDrawer
  } = useMetro();

  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'roster'>('kanban');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [mobileKanbanColumn, setMobileKanbanColumn] = useState<WorkOrderColumn | 'all'>('all');

  const filteredOrders = workOrders.filter(wo => {
    const matchesPriority = filterPriority === 'all' || wo.priority === filterPriority;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      wo.id.toLowerCase().includes(q) ||
      wo.title.toLowerCase().includes(q) ||
      wo.station.toLowerCase().includes(q) ||
      wo.assignedTeam.toLowerCase().includes(q) ||
      (wo.linkedIncidentId && wo.linkedIncidentId.toLowerCase().includes(q));

    return matchesPriority && matchesSearch;
  });

  const columns: { id: WorkOrderColumn; label: string; count: number }[] = [
    { id: 'queued', label: 'Queued', count: filteredOrders.filter(w => w.column === 'queued').length },
    { id: 'dispatched', label: 'Dispatched', count: filteredOrders.filter(w => w.column === 'dispatched').length },
    { id: 'progress', label: 'In Progress', count: filteredOrders.filter(w => w.column === 'progress').length },
    { id: 'completed', label: 'Completed', count: filteredOrders.filter(w => w.column === 'completed').length },
  ];

  // Roster Filter by Team
  const rosterEntries = nightShiftRoster?.scheduledEntries || [];
  const filteredRosterEntries = rosterEntries.filter(entry => {
    return selectedTeamFilter === 'all' || entry.assignedTeam === selectedTeamFilter;
  });

  const uniqueTeams = Array.from(new Set(rosterEntries.map(e => e.assignedTeam)));

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Maintenance Response & Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Trackside maintenance dispatches, night-shift technician roster, and depot clearance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle (Kanban / List / Night Roster) */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('roster')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'roster' 
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">nightlight</span>
              <span>Night-Shift Roster</span>
            </button>
          </div>

          {viewMode !== 'roster' && (
            <>
              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-teal-600 shadow-xs"
              >
                <option value="all">All Priorities</option>
                <option value="High">High Urgency</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <button
                onClick={() => setIsCreateWorkOrderModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>New Work Order</span>
              </button>
            </>
          )}

          {viewMode === 'roster' && (
            <button
              onClick={() => setIsGenerateRosterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">auto_schedule</span>
              <span>Plan / Re-Generate Roster</span>
            </button>
          )}
        </div>
      </div>

      {/* Roster View Mode */}
      {viewMode === 'roster' && (
        <div className="space-y-4 animate-fade-in">
          {nightShiftRoster ? (
            <>
              {/* Roster Shift Banner & Window Info */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-teal-100 text-teal-800 text-[11px]">
                      Shift Date: {nightShiftRoster.shiftDate}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 text-[11px]">
                      Window: {nightShiftRoster.shiftWindow}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Generated: {new Date(nightShiftRoster.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-slate-400">info</span>
                    <span>{DEFAULT_MAINTENANCE_WINDOW_NOTE}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {nightShiftRoster.summary.scheduledCount} tasks
                    </span>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Teams Deployed</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {nightShiftRoster.summary.teamsUtilized} teams
                    </span>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Unscheduled</span>
                    <span className="font-mono font-bold text-amber-800 text-sm">
                      {nightShiftRoster.summary.unscheduledCount} tasks
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Selector Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-500 text-[11px] font-semibold mr-1 shrink-0">
                  Technician Team View:
                </span>
                <button
                  onClick={() => setSelectedTeamFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                    selectedTeamFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  All Teams ({rosterEntries.length})
                </button>
                {uniqueTeams.map(teamName => {
                  const count = rosterEntries.filter(e => e.assignedTeam === teamName).length;
                  return (
                    <button
                      key={teamName}
                      onClick={() => setSelectedTeamFilter(teamName)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                        selectedTeamFilter === teamName
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {teamName} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Scheduled Tasks Chronological Timeline */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs tracking-tight flex items-center justify-between">
                  <span>Chronological Shift Assignments ({filteredRosterEntries.length})</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Sorted by planned execution window
                  </span>
                </h3>

                {filteredRosterEntries.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                    No tasks assigned to the selected team filter.
                  </div>
                ) : (
                  filteredRosterEntries.map((entry, idx) => {
                    const linkedWo = workOrders.find(w => w.id === entry.workOrderId);
                    const isCompleted = linkedWo?.column === 'completed';
                    const isInProgress = linkedWo?.column === 'progress';
                    const isDispatched = linkedWo?.column === 'dispatched';

                    const completedChecklistCount = linkedWo?.checklist.filter(c => c.completed).length || 0;
                    const totalChecklistCount = linkedWo?.checklist.length || 0;

                    return (
                      <div
                        key={entry.id}
                        className={`p-4 rounded-xl border transition-all bg-white shadow-xs ${
                          isCompleted ? 'border-emerald-200 bg-emerald-50/15' :
                          isInProgress ? 'border-teal-400 ring-2 ring-teal-500/10' :
                          'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          {/* Left: Time slot & Asset */}
                          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                            {/* Time Slot Badge */}
                            <div className="px-2 sm:px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0 min-w-[72px] sm:min-w-22">
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {entry.plannedStart}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ➔ {entry.plannedEnd}
                              </span>
                              <span className="text-[9px] text-slate-500 mt-0.5">
                                {entry.durationMinutes} min
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs">
                                  {entry.taskTitle}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                  {entry.workOrderId}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  entry.priority === 'High' ? 'bg-red-100 text-red-800' :
                                  entry.priority === 'Medium' ? 'bg-amber-100 text-amber-900' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {entry.priority} Priority
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-800 border border-teal-200">
                                  {entry.assignedTeam}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                                <span className="font-semibold text-slate-700">{entry.assetName}</span>
                                <span>({entry.assetType})</span>
                                <span>·</span>
                                <span>{entry.station} ({entry.corridor})</span>
                              </div>

                              {/* Explicit Priority Reason separating predictive vs corrective */}
                              <div className="mt-1.5 text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                <span className="material-symbols-outlined text-xs text-slate-400 mt-0.5 shrink-0">flag</span>
                                <span>{entry.priorityReason}</span>
                              </div>

                              {/* Checklist Verification Progress */}
                              {totalChecklistCount > 0 && (
                                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600 flex-wrap">
                                  <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                    <div
                                      className="h-full bg-teal-600 transition-all"
                                      style={{ width: `${(completedChecklistCount / totalChecklistCount) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] sm:text-[11px]">
                                    {completedChecklistCount} of {totalChecklistCount} checklist verification steps done
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Interactive Technician Actions */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
                            {isCompleted ? (
                              <span className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-300 min-h-[44px] sm:min-h-auto">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                <span>Completed & PM Logged</span>
                              </span>
                            ) : (
                              <>
                                {!isInProgress && (
                                  <button
                                    onClick={() => advanceWorkOrderStage(entry.workOrderId)}
                                    className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors min-h-[44px] sm:min-h-auto flex items-center justify-center"
                                  >
                                    Start Shift Job
                                  </button>
                                )}

                                <button
                                  onClick={() => openWorkOrderDrawer(entry.workOrderId)}
                                  className="px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs min-h-[44px] sm:min-h-auto"
                                >
                                  <span>Execute Checklist</span>
                                  <span className="material-symbols-outlined text-sm">checklist</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Unscheduled Tasks Section */}
              {nightShiftRoster.unscheduledTasks.length > 0 && (
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-amber-700">warning</span>
                      Unscheduled Assets Beyond Shift Capacity ({nightShiftRoster.unscheduledTasks.length})
                    </span>
                    <span className="text-[10px] text-amber-800 font-semibold">
                      Deferred to Next Shift Window
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    These candidate assets were identified as requiring service, but could not be safely accommodated within the 00:30–04:30 track access window or active team skillset capacity.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {nightShiftRoster.unscheduledTasks.map(u => (
                      <div key={u.id} className="p-2.5 bg-white rounded-lg border border-amber-200/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 truncate">{u.assetName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {u.assetType}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{u.station}</span>
                        <div className="mt-1 text-[11px] text-red-700 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          <span>{u.reasonUnscheduled}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty State if No Roster Generated Yet */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">auto_schedule</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  No Night-Shift Roster Planned Yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Generate a prioritized maintenance roster for the 00:30–04:30 non-traffic window using our 7-day asset failure risk calculations and active defect tickets.
                </p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsGenerateRosterModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition-colors shadow-xs inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  <span>Generate Night-Shift Roster Now</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Search for Kanban & List View */}
      {viewMode !== 'roster' && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search work order title, ID, station, assigned crew..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
            />
          </div>
          <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">
            {filteredOrders.length} orders shown
          </span>
        </div>
      )}

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="space-y-3">
          {/* Mobile Kanban Stage Tabs (< md) */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setMobileKanbanColumn('all')}
              className={`px-3 py-2 rounded-lg font-semibold transition-colors shrink-0 min-h-[40px] ${
                mobileKanbanColumn === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              All Columns ({filteredOrders.length})
            </button>
            {columns.map(c => (
              <button
                key={c.id}
                onClick={() => setMobileKanbanColumn(c.id)}
                className={`px-3 py-2 rounded-lg font-semibold transition-colors shrink-0 min-h-[40px] ${
                  mobileKanbanColumn === c.id
                    ? 'bg-teal-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                {c.label} ({c.count})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {columns
              .filter(col => mobileKanbanColumn === 'all' || mobileKanbanColumn === col.id)
              .map(col => {
                const itemsInCol = filteredOrders.filter(w => w.column === col.id);

                return (
                  <div 
                    key={col.id}
                    className="bg-slate-100/70 p-3 rounded-xl border border-slate-200 flex flex-col min-h-80 md:min-h-96"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/80 px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          {col.label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-slate-700 border border-slate-200">
                          {itemsInCol.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards Container */}
                    <div className="space-y-2.5 flex-1 overflow-y-auto">
                      {itemsInCol.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No tasks in this stage
                        </div>
                      ) : (
                        itemsInCol.map(wo => {
                          const completedCount = wo.checklist.filter(c => c.completed).length;
                          const totalChecklist = wo.checklist.length;

                          return (
                            <div
                              key={wo.id}
                              onClick={() => openWorkOrderDrawer(wo.id)}
                              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {wo.id}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  wo.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                                  wo.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {wo.priority}
                                </span>
                              </div>

                              <h4 className="font-semibold text-xs text-slate-900 leading-snug">
                                {wo.title}
                              </h4>

                              <div className="text-[11px] text-slate-500 space-y-0.5">
                                <div>Station: {wo.station}</div>
                                <div>Crew: {wo.assignedTeam}</div>
                              </div>

                              {/* Progress */}
                              {totalChecklist > 0 && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>Checklist</span>
                                    <span>{completedCount}/{totalChecklist} ({wo.progress}%)</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-teal-600 transition-all duration-300"
                                      style={{ width: `${wo.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Quick Advance Button */}
                              <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[11px]">
                                <span className="text-slate-400 text-[10px]">
                                  {new Date(wo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {col.id !== 'completed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      advanceWorkOrderStage(wo.id);
                                    }}
                                    className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-0.5 min-h-[38px] px-2 py-1"
                                  >
                                    <span>Advance</span>
                                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Mobile Work Order Cards (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No matching work orders found.
              </div>
            ) : (
              filteredOrders.map(task => (
                <div
                  key={task.id}
                  onClick={() => openWorkOrderDrawer(task.id)}
                  className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-800">{task.id}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        task.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 capitalize">
                        {task.column}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-semibold text-xs text-slate-900">{task.title}</h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{task.station} · Crew: {task.assignedTeam}</span>
                    <span className="font-mono font-medium">{task.progress}% done</span>
                  </div>

                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openWorkOrderDrawer(task.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 font-semibold text-xs flex items-center gap-1 min-h-[38px]"
                    >
                      <span>View Task</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Station</th>
                  <th className="p-3">Team</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Checklist</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No matching work orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(task => (
                    <tr 
                      key={task.id}
                      onClick={() => openWorkOrderDrawer(task.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-mono font-medium text-slate-700">{task.id}</td>
                      <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">{task.title}</td>
                      <td className="p-3 text-slate-600">{task.station}</td>
                      <td className="p-3 text-slate-600">{task.assignedTeam}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          task.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                          task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-3 capitalize text-slate-700 font-medium">{task.column}</td>
                      <td className="p-3">
                        <span className="font-mono text-[11px] text-slate-600">
                          {task.progress}% ({task.checklist.filter(c => c.completed).length}/{task.checklist.length})
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openWorkOrderDrawer(task.id);
                          }}
                          className="px-2 py-1 rounded text-teal-700 hover:bg-teal-50 font-semibold text-xs"
                        >
                          View Task →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

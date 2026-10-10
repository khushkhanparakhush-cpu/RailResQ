import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';
import { WorkOrderColumn } from '../../types/metro';

export const WorkOrderDrawer: React.FC = () => {
  const { 
    activeWorkOrder, 
    isWorkOrderDrawerOpen, 
    closeWorkOrderDrawer, 
    updateWorkOrder,
    advanceWorkOrderStage,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
    completeTechnicianWorkOrder,
    openDeleteWorkOrderModal,
    openDrawer
  } = useMetro();

  const [newItemText, setNewItemText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [findingsText, setFindingsText] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSigningOff, setIsSigningOff] = useState(false);

  // Scroll lock and escape listener
  React.useEffect(() => {
    if (!isWorkOrderDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWorkOrderDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWorkOrderDrawerOpen, closeWorkOrderDrawer]);

  if (!isWorkOrderDrawerOpen || !activeWorkOrder) return null;

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    await addChecklistItem(activeWorkOrder.id, newItemText.trim());
    setNewItemText('');
  };

  const handleSaveNotes = async () => {
    await updateWorkOrder(activeWorkOrder.id, { notes: notesText });
    setIsEditingNotes(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in"
      onClick={closeWorkOrderDrawer}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white h-[100dvh] shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wo-drawer-title"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/60">
                {activeWorkOrder.id}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeWorkOrder.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                activeWorkOrder.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {activeWorkOrder.priority} Priority
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize">
                {activeWorkOrder.column}
              </span>
            </div>
            <h2 id="wo-drawer-title" className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
              {activeWorkOrder.title}
            </h2>
          </div>
          <button 
            type="button" 
            onClick={closeWorkOrderDrawer}
            className="w-11 h-11 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 flex items-center justify-center transition-colors -mr-2 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label="Close Work Order Drawer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-sm overscroll-contain">
          {/* Quick Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Location</span>
              <span className="text-slate-800 font-medium">{activeWorkOrder.location}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Station & Line</span>
              <span className="text-slate-800 font-medium">{activeWorkOrder.station} ({activeWorkOrder.corridor})</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Assigned Team</span>
              <span className="text-slate-800 font-medium">{activeWorkOrder.assignedTeam}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Category</span>
              <span className="text-slate-800 font-medium">{activeWorkOrder.category}</span>
            </div>
          </div>

          {/* Linked Incident */}
          {activeWorkOrder.linkedIncidentId && (
            <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-teal-600 text-lg">link</span>
                <div>
                  <div className="text-xs font-semibold text-teal-900">
                    Linked to Incident: {activeWorkOrder.linkedIncidentId}
                  </div>
                  <div className="text-[11px] text-teal-700">
                    Click to inspect root cause incident telemetry
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeWorkOrderDrawer();
                  if (activeWorkOrder.linkedIncidentId) {
                    openDrawer(activeWorkOrder.linkedIncidentId);
                  }
                }}
                className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-white hover:bg-teal-100 rounded-lg border border-teal-200 shadow-xs transition-colors"
              >
                View Incident
              </button>
            </div>
          )}

          {/* Description */}
          {activeWorkOrder.description && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Work Scope
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                {activeWorkOrder.description}
              </p>
            </div>
          )}

          {/* Checklist Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-teal-600">checklist</span>
                Task Checklist & Verification ({activeWorkOrder.progress}%)
              </h4>
              <span className="text-xs font-mono text-slate-500">
                {activeWorkOrder.checklist.filter(c => c.completed).length} / {activeWorkOrder.checklist.length} done
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className={`h-full transition-all duration-300 ${
                  activeWorkOrder.progress === 100 ? 'bg-emerald-500' : 'bg-teal-500'
                }`}
                style={{ width: `${activeWorkOrder.progress}%` }}
              />
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              {activeWorkOrder.checklist.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-xl border border-slate-200/70 hover:bg-slate-50/70 transition-colors group"
                >
                  <label className="flex items-start gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => toggleChecklistItem(activeWorkOrder.id, item.id, e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span className={`text-xs leading-relaxed ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {item.text}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => deleteChecklistItem(activeWorkOrder.id, item.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition-opacity"
                    title="Remove item"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Add checklist item */}
            <form onSubmit={handleAddItem} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add checklist verification step..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={!newItemText.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50 transition-colors"
              >
                Add Step
              </button>
            </form>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Field Notes & Shift Handover
              </h4>
              {!isEditingNotes && (
                <button
                  type="button"
                  onClick={() => {
                    setNotesText(activeWorkOrder.notes || '');
                    setIsEditingNotes(true);
                  }}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  Edit Notes
                </button>
              )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="Enter observations, parts replaced, or clearance comments..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-3 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 italic">
                {activeWorkOrder.notes || 'No field notes logged yet.'}
              </p>
            )}
          </div>

          {/* Technician Findings & Component Replacement Sign-Off */}
          <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-teal-900 text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-teal-700">verified</span>
                Technician Findings & Clearance Record
              </span>
              {activeWorkOrder.column === 'completed' && (
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800">
                  Signed Off
                </span>
              )}
            </div>
            {activeWorkOrder.column === 'completed' ? (
              <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-teal-200">
                {activeWorkOrder.findings || 'All safety & diagnostic check items passed nominal clearance limits.'}
              </p>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={findingsText}
                  onChange={(e) => setFindingsText(e.target.value)}
                  placeholder="Record components replaced, sensor calibration values, or clearance verification details..."
                  className="w-full p-2.5 text-xs rounded-lg border border-teal-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  disabled={isSigningOff}
                  onClick={async () => {
                    setIsSigningOff(true);
                    try {
                      await completeTechnicianWorkOrder(
                        activeWorkOrder.id, 
                        findingsText || 'Checklist executed and component tolerances verified nominally.',
                        notesText || activeWorkOrder.notes
                      );
                      closeWorkOrderDrawer();
                    } finally {
                      setIsSigningOff(false);
                    }
                  }}
                  className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">task_alt</span>
                  <span>{isSigningOff ? 'Completing...' : 'Complete & Sign Off Work Order (Update Asset PM)'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Stage Controls */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 pb-safe">
          <button
            type="button"
            onClick={() => openDeleteWorkOrderModal(activeWorkOrder)}
            className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-1 min-h-[44px] sm:min-h-auto order-2 sm:order-1"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            <span>Delete Task</span>
          </button>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            {activeWorkOrder.column !== 'completed' && (
              <button
                type="button"
                onClick={() => advanceWorkOrderStage(activeWorkOrder.id)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <span>Advance Stage</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            )}
            {activeWorkOrder.column === 'completed' && (
              <button
                type="button"
                onClick={() => updateWorkOrder(activeWorkOrder.id, { column: 'progress' as WorkOrderColumn })}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200/70 hover:bg-slate-200 rounded-xl transition-colors min-h-[44px] flex items-center justify-center"
              >
                Reopen Task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default WorkOrderDrawer;

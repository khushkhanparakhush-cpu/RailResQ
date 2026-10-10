import React, { useState, useEffect } from 'react';
import { useMetro } from '../../context/MetroContext';
import { Corridor, IncidentCategory, WorkOrderPriority, WorkOrderColumn } from '../../types/metro';
import { AHMEDABAD_STATIONS } from '../../data/initialData';

export const CreateWorkOrderModal: React.FC = () => {
  const { 
    isCreateWorkOrderModalOpen, 
    setIsCreateWorkOrderModalOpen, 
    prefilledWorkOrder, 
    setPrefilledWorkOrder,
    addWorkOrder,
    incidents,
    assets
  } = useMetro();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [station, setStation] = useState(AHMEDABAD_STATIONS[0].name);
  const [location, setLocation] = useState('');
  const [corridor, setCorridor] = useState<Corridor>('East-West');
  const [category, setCategory] = useState<IncidentCategory>('Traction & Power');
  const [assetId, setAssetId] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('Rapid Electrical Squad');
  const [priority, setPriority] = useState<WorkOrderPriority>('Medium');
  const [column, setColumn] = useState<WorkOrderColumn>('queued');
  const [linkedIncidentId, setLinkedIncidentId] = useState('');
  const [notes, setNotes] = useState('');
  const [checklistInput, setChecklistInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prefilledWorkOrder) {
      if (prefilledWorkOrder.title) setTitle(prefilledWorkOrder.title);
      if (prefilledWorkOrder.description) setDescription(prefilledWorkOrder.description);
      if (prefilledWorkOrder.station) setStation(prefilledWorkOrder.station);
      if (prefilledWorkOrder.location) setLocation(prefilledWorkOrder.location);
      if (prefilledWorkOrder.corridor) setCorridor(prefilledWorkOrder.corridor);
      if (prefilledWorkOrder.category) setCategory(prefilledWorkOrder.category);
      if (prefilledWorkOrder.assetId) setAssetId(prefilledWorkOrder.assetId);
      if (prefilledWorkOrder.assignedTeam) setAssignedTeam(prefilledWorkOrder.assignedTeam);
      if (prefilledWorkOrder.priority) setPriority(prefilledWorkOrder.priority);
      if (prefilledWorkOrder.column) setColumn(prefilledWorkOrder.column);
      if (prefilledWorkOrder.linkedIncidentId) setLinkedIncidentId(prefilledWorkOrder.linkedIncidentId);
      if (prefilledWorkOrder.notes) setNotes(prefilledWorkOrder.notes);
      if (prefilledWorkOrder.checklist && prefilledWorkOrder.checklist.length > 0) {
        setChecklistInput(prefilledWorkOrder.checklist.map(c => c.text).join('\n'));
      }
    }
  }, [prefilledWorkOrder]);

  if (!isCreateWorkOrderModalOpen) return null;

  const handleClose = () => {
    setIsCreateWorkOrderModalOpen(false);
    setPrefilledWorkOrder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !station) return;

    setIsSubmitting(true);
    try {
      const checklistItems = checklistInput
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean)
        .map((text, idx) => ({
          id: `chk-new-${Date.now()}-${idx}`,
          text,
          completed: false
        }));

      await addWorkOrder({
        title: title.trim(),
        description: description.trim(),
        station,
        location: location.trim() || `${station} Technical Bay`,
        corridor,
        category,
        assetId: assetId.trim() || undefined,
        assignedTeam,
        priority,
        column,
        linkedIncidentId: linkedIncidentId.trim() || undefined,
        checklist: checklistItems.length > 0 ? checklistItems : undefined,
        notes: notes.trim()
      });

      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workorder-modal-title"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">engineering</span>
            </div>
            <div>
              <h3 id="create-workorder-modal-title" className="text-base font-semibold text-slate-900">
                Dispatch Maintenance Work Order
              </h3>
              <p className="text-xs text-slate-500">
                Log and assign operational tasks to metro technical teams
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-sm flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inspect Pantograph Collector at Apparel Park"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="Traction & Power">Traction & Power</option>
                <option value="Signalling & Telecom">Signalling & Telecom</option>
                <option value="Rolling Stock">Rolling Stock</option>
                <option value="Station Infrastructure">Station Infrastructure</option>
                <option value="Track & Civil">Track & Civil</option>
                <option value="Fare Collection">Fare Collection</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Assigned Team
              </label>
              <select
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="Rapid Electrical Squad">Rapid Electrical Squad</option>
                <option value="Signalling Team (S. Desai)">Signalling Team (S. Desai)</option>
                <option value="Station Facilities Squad">Station Facilities Squad</option>
                <option value="Depot Mechanical Team">Depot Mechanical Team</option>
                <option value="Traction Crew East">Traction Crew East</option>
                <option value="Track Maintenance Unit">Track Maintenance Unit</option>
                <option value="IT Ticketing Support">IT Ticketing Support</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Station
              </label>
              <select
                value={station}
                onChange={(e) => {
                  setStation(e.target.value);
                  const st = AHMEDABAD_STATIONS.find(s => s.name === e.target.value);
                  if (st) setCorridor(st.line === 'NS' ? 'North-South' : 'East-West');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                {AHMEDABAD_STATIONS.map(st => (
                  <option key={st.id} value={st.name}>
                    {st.name} ({st.line})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Corridor
              </label>
              <select
                value={corridor}
                onChange={(e) => setCorridor(e.target.value as Corridor)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="East-West">East-West Line</option>
                <option value="North-South">North-South Line</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Linked Incident
              </label>
              <select
                value={linkedIncidentId}
                onChange={(e) => setLinkedIncidentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="">-- No Linked Incident --</option>
                {incidents.map(inc => (
                  <option key={inc.id} value={inc.id}>
                    {inc.id}: {inc.title.slice(0, 36)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Linked Asset
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="">-- None / General Location --</option>
                {assets.map(ast => (
                  <option key={ast.id} value={ast.id}>
                    {ast.id}: {ast.name.slice(0, 36)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Description & Work Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed instructions for the assigned maintenance crew..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Initial Checklist Items (one per line)
            </label>
            <textarea
              rows={2}
              value={checklistInput}
              onChange={(e) => setChecklistInput(e.target.value)}
              placeholder="Isolate traction section S-14&#10;Inspect collector carbon strip&#10;Verify clearance certificate"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {isSubmitting ? 'Dispatching...' : 'Dispatch Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateWorkOrderModal;

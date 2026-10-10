import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';

export const IncidentDeleteModal: React.FC = () => {
  const { incidentToDelete, closeDeleteIncidentModal, confirmDeleteIncident } = useMetro();
  const [unlinkWorkOrders, setUnlinkWorkOrders] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!incidentToDelete) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await confirmDeleteIncident(unlinkWorkOrders);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-incident-title"
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>

          <h3 id="delete-incident-title" className="text-lg font-semibold text-slate-900">
            Delete Incident {incidentToDelete.id}?
          </h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Are you sure you want to delete <strong className="text-slate-800">"{incidentToDelete.title}"</strong>? This will remove the record from active lists and dashboard analytics.
          </p>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-700">
              <input
                type="checkbox"
                checked={unlinkWorkOrders}
                onChange={(e) => setUnlinkWorkOrders(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-600">
                Keep related work orders intact by unlinking this incident ID (recommended)
              </span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeDeleteIncidentModal}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Incident'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default IncidentDeleteModal;

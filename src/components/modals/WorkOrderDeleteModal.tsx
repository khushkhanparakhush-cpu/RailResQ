import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';

export const WorkOrderDeleteModal: React.FC = () => {
  const { workOrderToDelete, closeDeleteWorkOrderModal, confirmDeleteWorkOrder } = useMetro();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!workOrderToDelete) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await confirmDeleteWorkOrder();
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
        aria-labelledby="delete-workorder-title"
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">delete_forever</span>
          </div>

          <h3 id="delete-workorder-title" className="text-lg font-semibold text-slate-900">
            Delete Work Order {workOrderToDelete.id}?
          </h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Are you sure you want to delete task <strong className="text-slate-800">"{workOrderToDelete.title}"</strong> assigned to {workOrderToDelete.assignedTeam}? This operation cannot be undone.
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeDeleteWorkOrderModal}
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
            {isDeleting ? 'Deleting...' : 'Delete Work Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default WorkOrderDeleteModal;

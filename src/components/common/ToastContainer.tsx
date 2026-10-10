import React from 'react';
import { useMetro } from '../../context/MetroContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useMetro();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map(toast => {
        let borderClass = 'border-slate-800';
        let iconName = toast.icon || 'check_circle';
        let iconColor = 'text-teal-400';

        if (toast.type === 'error') {
          borderClass = 'border-red-800/80';
          iconName = toast.icon || 'error';
          iconColor = 'text-red-400';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-800/80';
          iconName = toast.icon || 'warning';
          iconColor = 'text-amber-400';
        } else if (toast.type === 'info') {
          borderClass = 'border-slate-700';
          iconName = toast.icon || 'info';
          iconColor = 'text-sky-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto px-3.5 py-2.5 rounded-lg bg-slate-900 text-white text-xs border shadow-lg flex items-center gap-2.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <span className={`material-symbols-outlined text-base ${iconColor} shrink-0`}>
              {iconName}
            </span>
            <span className="flex-1 font-medium leading-relaxed">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

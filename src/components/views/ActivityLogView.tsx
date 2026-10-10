import React, { useState, useMemo } from 'react';
import { useMetro } from '../../context/MetroContext';

export const ActivityLogView: React.FC = () => {
  const { activityLogs, addActivityEvent, showToast, setActiveTab, openDrawer } = useMetro();

  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [manualNote, setManualNote] = useState('');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesFilter = filterType === 'all' || log.type === filterType;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        log.title.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.author.toLowerCase().includes(q) ||
        (log.incidentId && log.incidentId.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [activityLogs, filterType, searchQuery]);

  const handleAddManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNote.trim()) return;

    addActivityEvent({
      type: 'system',
      title: 'OCC Supervisor Operational Note',
      description: manualNote.trim(),
      author: 'R. Mehta (OCC Lead)'
    });

    setManualNote('');
    showToast('Appended operational note to audit log.', 'success', 'history');
  };

  const handleExportAudit = () => {
    const textData = filteredLogs.map(l => 
      `[${l.timestamp}] ${l.id} | ${l.type.toUpperCase()} | ${l.title} | ${l.description} | Author: ${l.author}${l.incidentId ? ` | Linked: ${l.incidentId}` : ''}`
    ).join('\n');

    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RailResQ_Audit_Log_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('Downloaded complete activity audit log.', 'success', 'download');
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Operational Activity & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological record of incident creation, triage changes, work orders, and supervisor memos.
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors shadow-xs"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Manual Entry Form */}
      <form onSubmit={handleAddManualNote} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={manualNote}
          onChange={e => setManualNote(e.target.value)}
          placeholder="Log a supervisor memo or radio transmission note..."
          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20"
        />
        <button
          type="submit"
          disabled={!manualNote.trim()}
          className="px-3.5 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 disabled:opacity-50 transition-colors shadow-xs whitespace-nowrap"
        >
          Add Audit Entry
        </button>
      </form>

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'create', label: 'Created' },
            { id: 'update_status', label: 'Status Updates' },
            { id: 'maintenance', label: 'Maintenance' },
            { id: 'resolve', label: 'Resolved' },
            { id: 'system', label: 'Notes' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === f.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-48 sm:w-56">
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search log entries..."
            className="w-full pl-7 pr-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-teal-600"
          />
        </div>
      </div>

      {/* Log Entries Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong className="text-slate-800 font-mono">{filteredLogs.length}</strong> events</span>
          <span className="font-mono text-[11px]">Audit Timestamp Order</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching activity log entries.
            </div>
          ) : (
            filteredLogs.map(log => {
              let badgeStyle = 'bg-slate-100 text-slate-600';
              if (log.type === 'create') badgeStyle = 'bg-blue-50 text-blue-700';
              else if (log.type === 'update_status') badgeStyle = 'bg-teal-50 text-teal-800';
              else if (log.type === 'resolve') badgeStyle = 'bg-emerald-50 text-emerald-800';
              else if (log.type === 'maintenance') badgeStyle = 'bg-purple-50 text-purple-700';
              else if (log.type === 'delete') badgeStyle = 'bg-red-50 text-red-700';

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-1 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${badgeStyle}`}>
                        {log.type.replace('_', ' ')}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {log.title}
                      </span>
                      {log.incidentId && (
                        <button
                          onClick={() => {
                            setActiveTab('incidents');
                            openDrawer(log.incidentId!);
                          }}
                          className="font-mono text-teal-700 hover:text-teal-900 font-medium text-[11px]"
                        >
                          [{log.incidentId}]
                        </button>
                      )}
                    </div>

                    <span className="font-mono text-[11px] text-slate-400">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed">
                    {log.description}
                  </p>

                  <div className="text-[11px] text-slate-400 pt-0.5">
                    Recorded by: <span className="text-slate-600 font-medium">{log.author}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { useMetro } from '../../context/MetroContext';

export const SettingsView: React.FC = () => {
  const { 
    resetToDemoData, 
    clearAllData, 
    importDataJSON, 
    exportDataJSON,
    getStorageStats,
    incidents,
    workOrders,
    activityLogs,
    showToast 
  } = useMetro();

  const [operatorName, setOperatorName] = useState('R. Mehta (Shift Supervisor)');
  const [defaultLine, setDefaultLine] = useState('East-West');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = getStorageStats();

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('railresq_operator_name', operatorName);
    localStorage.setItem('railresq_default_line', defaultLine);
    showToast('Operational preferences saved to local profile.', 'success', 'check_circle');
  };

  const handleExportBackup = () => {
    exportDataJSON();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataJSON(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Data Management & Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Local offline storage management, sample dataset controls, and operator preferences.
        </p>
      </div>

      {/* Storage & Record Statistics Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
          Local Storage Status
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Incidents</span>
            <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{stats.incidentCount}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Work Orders</span>
            <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{stats.workOrderCount}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Activity Logs</span>
            <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{stats.activityCount}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Estimated Size</span>
            <span className="text-lg font-bold text-teal-700 font-mono mt-0.5 block">{stats.approximateKb} KB</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          All data is persisted in browser LocalStorage. Changes survive page refreshes and work without external server dependencies.
        </p>
      </div>

      {/* Data Import / Export & Reset Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
          Dataset Actions
        </h2>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Full Backup (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>Import JSON Backup</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            onClick={() => {
              if (confirm('Reset all records to the original Ahmedabad Metro demo dataset? Any custom additions will be replaced.')) {
                resetToDemoData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Reset to Demo Data</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Clear all local records? All incidents, work orders, and activity events will be wiped.')) {
                clearAllData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Operator Preferences */}
      <form onSubmit={handleSavePreferences} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
          Console Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Active Operator Callout
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={e => setOperatorName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Corridor Focus
            </label>
            <select
              value={defaultLine}
              onChange={e => setDefaultLine(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-600"
            >
              <option value="East-West">East-West Line (Thaltej ⇄ Vastral)</option>
              <option value="North-South">North-South Line (APMC ⇄ Motera)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition-colors shadow-xs"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* About & Problem Background Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            About RailResQ · Metro Hacks PS-02
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Fix It Before It Breaks
          </span>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Operational Context</h3>
            <p>
              Unexpected failures in ticket gates, ticket vending machines (TVMs), passenger lifts, and escalators disrupt station passenger flow and create maintenance backlogs. Historical fault records exist across station logs, but preventive maintenance scheduling is traditionally manual.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Predictive Methodology</h3>
            <p>
              RailResQ evaluates assets using a reproducible, rule-based heuristic across four weighted factors: 30-day fault frequency (35%), repeated failure patterns (25%), 14-day velocity acceleration (20%), and overdue preventive maintenance intervals (20%). Scores are relative rankings to guide night-shift technician capacity, not probabilistic sensor forecasts.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Night-Shift Roster Generation</h3>
            <p>
              Maintenance tasks are prioritized into the standard non-revenue track access window (00:30–04:30), matching asset types to specialized teams (AFC/TVM, Lifts & Escalators, Heavy Infrastructure) and incorporating travel buffers across stations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';
import { FaultSeverity } from '../../types/metro';

interface LogFaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAssetId?: string;
}

export const LogFaultModal: React.FC<LogFaultModalProps> = ({
  isOpen,
  onClose,
  preselectedAssetId
}) => {
  const { assets, addFaultLog } = useMetro();

  const [assetId, setAssetId] = useState<string>(preselectedAssetId || assets[0]?.id || '');
  const [faultCode, setFaultCode] = useState<string>('ERR-FLAP-401');
  const [faultCategory, setFaultCategory] = useState<string>('Flap Actuator');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<FaultSeverity>('Major');
  const [timestamp, setTimestamp] = useState<string>(new Date().toISOString().slice(0, 16));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync if preselected changes
  React.useEffect(() => {
    if (preselectedAssetId) {
      setAssetId(preselectedAssetId);
    }
  }, [preselectedAssetId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !faultCode.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await addFaultLog({
        assetId,
        faultCode: faultCode.trim().toUpperCase(),
        faultCategory: faultCategory.trim(),
        description: description.trim(),
        severity,
        timestamp: new Date(timestamp).toISOString()
      });
      setDescription('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAsset = assets.find(a => a.id === assetId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-fault-title"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-700 text-lg">report_problem</span>
            <h2 id="log-fault-title" className="text-sm font-bold text-slate-900">
              Log Asset Fault Event
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Target Asset
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-teal-600"
            >
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  [{a.type}] {a.name} ({a.station})
                </option>
              ))}
            </select>
            {selectedAsset && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                ID: {selectedAsset.id} · Type: {selectedAsset.type} · Station: {selectedAsset.station}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Fault Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ERR-FLAP-401"
                value={faultCode}
                onChange={(e) => setFaultCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono uppercase text-xs text-slate-800 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Fault Category
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Optical Sensor, Drive Motor"
                value={faultCategory}
                onChange={(e) => setFaultCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Fault Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as FaultSeverity)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-teal-600"
              >
                <option value="Critical">Critical (Inoperable / Safety Cutout)</option>
                <option value="Major">Major (Degraded / Intermittent)</option>
                <option value="Minor">Minor (Warning / Cosmetic)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Occurrence Timestamp
              </label>
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-800 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Fault Description & Diagnostic Observations
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detail the failure symptoms, error code telemetry, or mechanical obstruction observed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-amber-700 text-white font-semibold hover:bg-amber-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Fault Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

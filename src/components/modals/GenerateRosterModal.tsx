import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';
import { 
  DEFAULT_MAINTENANCE_WINDOW_NOTE, 
  DEFAULT_TEAMS_CONFIG, 
  DEFAULT_TASK_DURATIONS 
} from '../../utils/rosterEngine';
import { RosterPlanConfig, AssetType } from '../../types/metro';

export const GenerateRosterModal: React.FC = () => {
  const { 
    isGenerateRosterModalOpen, 
    setIsGenerateRosterModalOpen, 
    generateAndSaveRoster,
    rankedAssetRisks,
    incidents,
    setActiveTab
  } = useMetro();

  // Tomorrow's date formatted as YYYY-MM-DD
  const defaultDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [shiftDate, setShiftDate] = useState<string>(defaultDate);
  const [shiftStartTime, setShiftStartTime] = useState<string>('00:30');
  const [shiftEndTime, setShiftEndTime] = useState<string>('04:30');
  const [travelBufferMinutes, setTravelBufferMinutes] = useState<number>(15);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Editable teams configuration
  const [teams, setTeams] = useState(DEFAULT_TEAMS_CONFIG);

  // Scroll lock and escape listener
  React.useEffect(() => {
    if (!isGenerateRosterModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsGenerateRosterModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGenerateRosterModalOpen, setIsGenerateRosterModalOpen]);

  if (!isGenerateRosterModalOpen) return null;

  // Candidate assets preview count
  const highRiskCount = rankedAssetRisks.filter(a => a.riskBand === 'High').length;
  const mediumRiskCount = rankedAssetRisks.filter(a => a.riskBand === 'Medium').length;
  const activeDefectCount = rankedAssetRisks.filter(a => a.unresolvedFaultsCount > 0).length;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const config: RosterPlanConfig = {
        shiftDate,
        shiftStartTime,
        shiftEndTime,
        travelBufferMinutes,
        teams
      };

      await generateAndSaveRoster(config);
      setIsGenerateRosterModalOpen(false);
      setActiveTab('maintenance');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTeam = (index: number) => {
    setTeams(prev => prev.map((t, idx) => {
      if (idx === index) {
        // Toggle max tasks between 0 and 3
        return {
          ...t,
          maxTasksPerShift: t.maxTasksPerShift && t.maxTasksPerShift > 0 ? 0 : 3
        };
      }
      return t;
    }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={() => setIsGenerateRosterModalOpen(false)}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roster-modal-title"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shrink-0">
              <span className="material-symbols-outlined text-xl">auto_schedule</span>
            </div>
            <div className="min-w-0">
              <h2 id="roster-modal-title" className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                Generate Night-Shift Maintenance Roster
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                Automated heuristic scheduling based on next-7-day asset risk and active corrective faults.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGenerateRosterModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-200/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 -mr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs overscroll-contain">
          {/* Candidates Evaluation Preview */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2">
              <span className="material-symbols-outlined text-amber-700 text-base shrink-0 mt-0.5 sm:mt-0">analytics</span>
              <div>
                <span className="font-semibold text-amber-900 block text-xs">
                  Candidate Work Orders Ready for Allocation
                </span>
                <span className="text-[11px] text-amber-800 leading-snug">
                  {activeDefectCount} active corrective defects · {highRiskCount} high-risk assets · {mediumRiskCount} medium-risk preventive candidates
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-amber-300 rounded font-bold text-amber-900 self-start sm:self-auto shrink-0">
              Prioritized Sequence
            </span>
          </div>

          {/* Shift Time Window Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Shift Calendar Date
              </label>
              <input
                type="date"
                required
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-800 focus:outline-none focus:border-teal-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Night shift anchor date</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Shift Window Start
              </label>
              <input
                type="time"
                required
                value={shiftStartTime}
                onChange={(e) => setShiftStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-800 focus:outline-none focus:border-teal-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Non-traffic hours track access</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Shift Window End
              </label>
              <input
                type="time"
                required
                value={shiftEndTime}
                onChange={(e) => setShiftEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-800 focus:outline-none focus:border-teal-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Depot clear before revenue run</span>
            </div>
          </div>

          {/* Maintenance Window Label Required by Prompt */}
          <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-slate-500">info</span>
            <span>{DEFAULT_MAINTENANCE_WINDOW_NOTE}</span>
          </div>

          {/* Transit Buffer */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <span className="font-semibold text-slate-800 block text-xs">
                Station Transit & Tool Rig Buffer
              </span>
              <span className="text-[11px] text-slate-500">
                Minimum buffer time between jobs for ladder movement and safety lockout/tagout.
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="5"
                max="60"
                step="5"
                value={travelBufferMinutes}
                onChange={(e) => setTravelBufferMinutes(Number(e.target.value))}
                className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-center text-xs font-semibold"
              />
              <span className="text-slate-500 text-[11px]">min</span>
            </div>
          </div>

          {/* Available Teams & Skill Certification Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 text-xs">
                Available Technician Teams & Certified Skillsets
              </span>
              <span className="text-[10px] text-slate-500">
                Click team to toggle on-shift availability
              </span>
            </div>

            <div className="space-y-2">
              {teams.map((team, idx) => {
                const isActive = (team.maxTasksPerShift || 0) > 0;
                return (
                  <div
                    key={team.name}
                    onClick={() => toggleTeam(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isActive 
                        ? 'border-teal-300 bg-teal-50/30' 
                        : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span className="font-semibold text-slate-900 text-xs">{team.name}</span>
                        <span className="text-[10px] text-slate-500">
                          ({isActive ? `Max ${team.maxTasksPerShift} jobs` : 'Standby / Off-shift'})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {team.compatibleAssetTypes.map(t => (
                          <span 
                            key={t}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-700 font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
                        isActive ? 'text-teal-800 bg-teal-100' : 'text-slate-500 bg-slate-200'
                      }`}>
                        {isActive ? 'Available' : 'Excluded'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-safe">
            <button
              type="button"
              onClick={() => setIsGenerateRosterModalOpen(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold transition-colors min-h-[44px] order-2 sm:order-1 flex items-center justify-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isGenerating || teams.every(t => (t.maxTasksPerShift || 0) <= 0)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors shadow-xs disabled:opacity-50 min-h-[44px] order-1 sm:order-2"
            >
              <span className="material-symbols-outlined text-sm">
                {isGenerating ? 'sync' : 'bolt'}
              </span>
              <span>{isGenerating ? 'Generating...' : 'Generate Shift Roster'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

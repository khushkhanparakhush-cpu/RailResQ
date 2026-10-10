import React, { useState, useMemo } from 'react';
import { useMetro } from '../../context/MetroContext';
import { 
  IncidentCategory, 
  IncidentSeverity, 
  PassengerImpact, 
  Corridor 
} from '../../types/metro';
import { calculateIncidentPriority } from '../../utils/priorityEngine';

export const ReportIncidentView: React.FC = () => {
  const { addIncident, stations, incidents, initiateWorkOrderFromIncident, setActiveTab, openDrawer } = useMetro();

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('Traction & Power');
  const [station, setStation] = useState(stations[0]?.name || 'Apparel Park');
  const [location, setLocation] = useState('');
  const [corridor, setCorridor] = useState<Corridor>('East-West');
  const [severity, setSeverity] = useState<IncidentSeverity>('Warning');
  const [passengerImpact, setPassengerImpact] = useState<PassengerImpact>('Minor Delay (<5m)');
  const [safetyConcern, setSafetyConcern] = useState<boolean>(false);
  const [serviceDisruption, setServiceDisruption] = useState<boolean>(false);
  const [description, setDescription] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('Central Rapid Response');
  const [assetId, setAssetId] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Live Explainable Priority Calculation
  const livePriority = useMemo(() => {
    return calculateIncidentPriority({
      severity,
      safetyConcern,
      serviceDisruption,
      passengerImpact
    });
  }, [severity, safetyConcern, serviceDisruption, passengerImpact]);

  // UI States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  const handleStationChange = (stName: string) => {
    setStation(stName);
    const found = stations.find(s => s.name === stName);
    if (found) {
      setCorridor(found.line === 'NS' ? 'North-South' : 'East-West');
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!title.trim()) {
      errs.title = 'Incident title is required.';
    } else if (title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters.';
    }

    if (!station) {
      errs.station = 'Station selection is required.';
    }

    if (!description.trim()) {
      errs.description = 'Incident description is required.';
    } else if (description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const fullDesc = additionalNotes.trim() 
        ? `${description.trim()}\n\nAdditional Notes: ${additionalNotes.trim()}`
        : description.trim();

      const newId = await addIncident({
        title: title.trim(),
        category,
        description: fullDesc,
        station,
        location: location.trim() || `${station} Station Area`,
        corridor,
        assetId: assetId.trim() || undefined,
        severity,
        passengerImpact,
        safetyConcern,
        serviceDisruption,
        assignedTeam: assignedTeam.trim() || 'Central Rapid Response',
        reportedBy: 'Station Operations Controller'
      });

      setCreatedIncidentId(newId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setCategory('Traction & Power');
    setStation(stations[0]?.name || 'Apparel Park');
    setLocation('');
    setCorridor('East-West');
    setSeverity('Warning');
    setPassengerImpact('Minor Delay (<5m)');
    setSafetyConcern(false);
    setServiceDisruption(false);
    setDescription('');
    setAssignedTeam('Central Rapid Response');
    setAssetId('');
    setAdditionalNotes('');
    setErrors({});
    setCreatedIncidentId(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Report Incident
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit an operational incident ticket to the Ahmedabad Metro incident dispatch queue.
        </p>
      </div>

      {/* Success Confirmation Banner */}
      {createdIncidentId && (() => {
        const loggedInc = incidents.find(i => i.id === createdIncidentId);
        return (
          <div className="p-5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 space-y-4 animate-in fade-in duration-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700 text-xl">check_circle</span>
                <h2 className="text-sm font-bold text-teal-950">
                  Incident Successfully Logged: <span className="font-mono">{createdIncidentId}</span>
                </h2>
              </div>
              {loggedInc && (
                <span className={`px-2.5 py-1 rounded text-xs font-bold border self-start sm:self-auto ${
                  loggedInc.priorityTier === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
                  loggedInc.priorityTier === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  'bg-teal-100 text-teal-800 border-teal-200'
                }`}>
                  {loggedInc.priorityTier} Urgency · Score {loggedInc.priorityScore}/100
                </span>
              )}
            </div>

            {loggedInc && (
              <div className="p-3.5 bg-white/90 rounded-lg border border-teal-200/80 text-xs space-y-1.5">
                <div className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-teal-700 text-base">psychology_alt</span>
                  <span>Explainable Priority Assessment:</span>
                </div>
                <div className="text-slate-700 pl-5 leading-relaxed">
                  <strong className="text-slate-900">Why it needs attention:</strong> {loggedInc.priorityReason}
                </div>
                <div className="text-slate-500 pl-5 text-[11px]">
                  Location: {loggedInc.station} ({loggedInc.corridor} Line) · {loggedInc.location} · Assigned: {loggedInc.assignedTeam}
                </div>
              </div>
            )}

            <p className="text-xs text-teal-800 leading-relaxed">
              Ticket registered in local-first database. Create a linked trackside maintenance work order now to assign a squad and track verification progress.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {loggedInc && (
                <button
                  type="button"
                  onClick={() => initiateWorkOrderFromIncident(loggedInc)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">build</span>
                  <span>Create Linked Maintenance Task →</span>
                </button>
              )}
              <button
                onClick={() => {
                  setActiveTab('incidents');
                  openDrawer(createdIncidentId);
                }}
                className="px-3.5 py-2 rounded-lg bg-white border border-teal-300 text-teal-900 text-xs font-medium hover:bg-teal-100/50 transition-colors"
              >
                View in Incident Console
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors"
              >
                Report Another Incident
              </button>
            </div>
          </div>
        );
      })()}

      {/* Incident Reporting Form */}
      {!createdIncidentId && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-6">
          {/* Section 1: Classification & Core Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              1. Incident Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Overhead 25kV Catenary Arcing at Viaduct Pier 142"
                className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-800 focus:outline-none focus:ring-1 transition-all ${
                  errors.title ? 'border-red-400 focus:ring-red-300 bg-red-50/20' : 'border-slate-200 focus:border-teal-600 focus:ring-teal-600/20'
                }`}
              />
              {errors.title && (
                <p className="text-[11px] text-red-600 mt-1">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incident Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                >
                  <option value="Traction & Power">Traction & Power (25kV OHE)</option>
                  <option value="Signalling & Telecom">Signalling & Telecom (CBTC)</option>
                  <option value="Rolling Stock">Rolling Stock</option>
                  <option value="Station Infrastructure">Station Infrastructure & PSD</option>
                  <option value="Track & Civil">Track & Civil Works</option>
                  <option value="Fare Collection">Fare Collection & AFC Gates</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Severity Level <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Critical', 'Warning', 'Low'] as IncidentSeverity[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        severity === lvl
                          ? lvl === 'Critical'
                            ? 'bg-red-50 border-red-500 text-red-700 font-bold'
                            : lvl === 'Warning'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold'
                            : 'bg-teal-50 border-teal-500 text-teal-800 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Location & Alignment */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              2. Station & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Station <span className="text-red-500">*</span>
                </label>
                <select
                  value={station}
                  onChange={(e) => handleStationChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                >
                  <optgroup label="North-South Line (APMC ⇄ Motera)">
                    {stations.filter(s => s.line === 'NS').map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                    ))}
                  </optgroup>
                  <optgroup label="East-West Line (Thaltej ⇄ Vastral)">
                    {stations.filter(s => s.line === 'EW').map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                    ))}
                  </optgroup>
                </select>
                {errors.station && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.station}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corridor Line
                </label>
                <select
                  value={corridor}
                  onChange={(e) => setCorridor(e.target.value as Corridor)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                >
                  <option value="North-South">North-South Line</option>
                  <option value="East-West">East-West Line</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Location (Platform / Track / Pier)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Platform 2, Crossover Point 12B"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asset ID (Optional)
                </label>
                <input
                  type="text"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="e.g. AST-OHE-01 or Rake Set DM-08"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Passenger Impact & Safety Evaluation */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              3. Operational Impact & Safety
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Passenger Delay Impact <span className="text-red-500">*</span>
              </label>
              <select
                value={passengerImpact}
                onChange={(e) => setPassengerImpact(e.target.value as PassengerImpact)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
              >
                <option value="None">None (No Passenger Delay)</option>
                <option value="Minor Delay (<5m)">Minor Delay (&lt; 5 minutes)</option>
                <option value="Moderate Delay (5-15m)">Moderate Delay (5 – 15 minutes)</option>
                <option value="Severe Delay (>15m)">Severe Delay (&gt; 15 minutes)</option>
                <option value="Service Halt">Service Halt (Corridor Line Suspended)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={safetyConcern}
                  onChange={(e) => setSafetyConcern(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Safety Concern / Hazard Flag
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Flag immediate trackside or passenger safety protocol.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={serviceDisruption}
                  onChange={(e) => setServiceDisruption(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Service Disruption Active
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Causes headway delay or speed restriction on line.
                  </span>
                </div>
              </label>
            </div>

            {/* Live Explainable Priority Decision Support */}
            <div className="p-4 rounded-xl border border-teal-200/90 bg-teal-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-teal-700 text-base">psychology_alt</span>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Explainable Priority Engine (Real-Time Preview)
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                  livePriority.tier === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
                  livePriority.tier === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  'bg-teal-100 text-teal-800 border-teal-200'
                }`}>
                  {livePriority.tier} Priority · Score {livePriority.score}/100
                </span>
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    livePriority.score >= 60 ? 'bg-red-500' :
                    livePriority.score >= 30 ? 'bg-amber-500' :
                    'bg-teal-600'
                  }`}
                  style={{ width: `${Math.min(livePriority.score, 100)}%` }}
                />
              </div>

              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Why it needs attention:</strong> {livePriority.reason}
              </div>
              <p className="text-[10px] text-slate-400">
                Transparent deterministic criteria: Safety hazard flag (+40), Severity weighting (+5 to +30), Line disruption (+20), Passenger delay impact (+5 to +20).
              </p>
            </div>
          </div>

          {/* Section 4: Narrative Description & Assignment */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              4. Description & Field Assignment
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide factual details observed: sensor alert, electrical flash, door malfunction, passenger report..."
                className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-800 focus:outline-none focus:ring-1 transition-all ${
                  errors.description ? 'border-red-400 focus:ring-red-300 bg-red-50/20' : 'border-slate-200 focus:border-teal-600 focus:ring-teal-600/20'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Maintenance Squad
                </label>
                <input
                  type="text"
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  placeholder="e.g. Electrical Rapid Response (Apparel Depot)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Field Notes (Optional)
                </label>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Inverter thermal log attached"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px] flex items-center justify-center"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 disabled:opacity-50 transition-colors shadow-xs min-h-[44px]"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>Submit Incident Record</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

import { MetroAsset, AssetFaultLog } from '../types/metro';

/**
 * Demo reference date management.
 * Seeds relative to a saved demo reference date so dates remain deterministic and stable across reloads.
 */
const STORAGE_KEY_REF_DATE = 'railresq_demo_ref_date_v3';

export function getDemoReferenceDate(): Date {
  if (typeof window === 'undefined') {
    return new Date('2025-10-15T09:00:00.000Z');
  }
  const saved = localStorage.getItem(STORAGE_KEY_REF_DATE);
  if (saved) {
    const d = new Date(saved);
    if (!isNaN(d.getTime())) return d;
  }
  // Fixed demo reference anchor for consistent evaluation
  const anchor = new Date();
  localStorage.setItem(STORAGE_KEY_REF_DATE, anchor.toISOString());
  return anchor;
}

export const DEMO_DATA_NOTICE = 'Synthetic demonstration data — not official metro operational records.';

/**
 * 18 Realistic Ahmedabad Metro Assets covering ticket gates, ticket vending machines, lifts, and escalators.
 */
export function buildSyntheticAssets(refDate: Date): MetroAsset[] {
  const refTime = refDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  return [
    // Ticket Gates (AFC Gates)
    {
      id: 'AST-GATE-KLP-01',
      name: 'Kalupur Concourse Flap Gate Lane 1',
      type: 'Ticket Gate',
      station: 'Kalupur Railway Station',
      stationOrSection: 'Kalupur Railway Station - North Concourse',
      line: 'East-West',
      status: 'Maintenance Required',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 46 * dayMs).toISOString(), // Overdue by 16 days
      installedYear: 2021,
      manufacturer: 'Nippon Signal / Thales',
      isSample: true
    },
    {
      id: 'AST-GATE-KLP-02',
      name: 'Kalupur Concourse Flap Gate Lane 2',
      type: 'Ticket Gate',
      station: 'Kalupur Railway Station',
      stationOrSection: 'Kalupur Railway Station - North Concourse',
      line: 'East-West',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 18 * dayMs).toISOString(),
      installedYear: 2021,
      manufacturer: 'Nippon Signal / Thales',
      isSample: true
    },
    {
      id: 'AST-GATE-OHC-01',
      name: 'Old High Court Interchange Gate Lane 4',
      type: 'Ticket Gate',
      station: 'Old High Court',
      stationOrSection: 'Old High Court - Mezzanine Interchange Gate Bank',
      line: 'North-South',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 24 * dayMs).toISOString(),
      installedYear: 2022,
      manufacturer: 'Thales Transportation',
      isSample: true
    },
    {
      id: 'AST-GATE-VGAM-01',
      name: 'Vastral Gam Wide Access Gate Lane W-1',
      type: 'Ticket Gate',
      station: 'Vastral Gam',
      stationOrSection: 'Vastral Gam - Gate Bank A',
      line: 'East-West',
      status: 'Operational',
      maintenanceIntervalDays: 45,
      lastPmDate: new Date(refTime - 12 * dayMs).toISOString(),
      installedYear: 2022,
      manufacturer: 'Thales Transportation',
      isSample: true
    },

    // Ticket Vending Machines (TVMs)
    {
      id: 'AST-TVM-KLP-01',
      name: 'Kalupur Automatic Ticket Vending Machine TVM-01',
      type: 'Ticket Vending Machine',
      station: 'Kalupur Railway Station',
      stationOrSection: 'Kalupur Railway Station - Booking Hall East',
      line: 'East-West',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 33 * dayMs).toISOString(), // Overdue by 3 days
      installedYear: 2021,
      manufacturer: 'Omron AFC Systems',
      isSample: true
    },
    {
      id: 'AST-TVM-PLDI-01',
      name: 'Paldi Station Ticket Vending Machine TVM-02',
      type: 'Ticket Vending Machine',
      station: 'Paldi',
      stationOrSection: 'Paldi - Concourse Concourse West',
      line: 'North-South',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 15 * dayMs).toISOString(),
      installedYear: 2022,
      manufacturer: 'Omron AFC Systems',
      isSample: true
    },
    {
      id: 'AST-TVM-THLT-01',
      name: 'Thaltej Gam Ticket Vending Machine TVM-01',
      type: 'Ticket Vending Machine',
      station: 'Thaltej Gam',
      stationOrSection: 'Thaltej Gam - Street Entrance Foyer',
      line: 'East-West',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 9 * dayMs).toISOString(),
      installedYear: 2023,
      manufacturer: 'Omron AFC Systems',
      isSample: true
    },
    {
      id: 'AST-TVM-RNP-01',
      name: 'Ranip Interchange Ticket Vending Machine TVM-03',
      type: 'Ticket Vending Machine',
      station: 'Ranip',
      stationOrSection: 'Ranip - GSRTC Bus Terminal Link',
      line: 'North-South',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 28 * dayMs).toISOString(),
      installedYear: 2022,
      manufacturer: 'Omron AFC Systems',
      isSample: true
    },

    // Lifts (Elevators)
    {
      id: 'AST-LIFT-APPR-01',
      name: 'Apparel Park Platform 1 Passenger Lift L-01',
      type: 'Lift',
      station: 'Apparel Park',
      stationOrSection: 'Apparel Park - Platform 1 to Concourse Shaft',
      line: 'East-West',
      status: 'Maintenance Required',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 45 * dayMs).toISOString(), // Overdue by 15 days
      installedYear: 2021,
      manufacturer: 'Schindler Metro Elevators',
      isSample: true
    },
    {
      id: 'AST-LIFT-OHC-01',
      name: 'Old High Court Interchange Accessible Lift L-03',
      type: 'Lift',
      station: 'Old High Court',
      stationOrSection: 'Old High Court - EW to NS Transfer Core',
      line: 'North-South',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 21 * dayMs).toISOString(),
      installedYear: 2022,
      manufacturer: 'Schindler Metro Elevators',
      isSample: true
    },
    {
      id: 'AST-LIFT-KNKR-01',
      name: 'Kankaria East Street-to-Concourse Lift L-02',
      type: 'Lift',
      station: 'Kankaria East',
      stationOrSection: 'Kankaria East - Gate 2 Street Shaft',
      line: 'East-West',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 14 * dayMs).toISOString(),
      installedYear: 2022,
      manufacturer: 'Otis Rail Transit',
      isSample: true
    },
    {
      id: 'AST-LIFT-SHPR-01',
      name: 'Shahpur Underground Deep Lift L-01',
      type: 'Lift',
      station: 'Shahpur',
      stationOrSection: 'Shahpur - Subsurface Level B2 to Platform',
      line: 'East-West',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 26 * dayMs).toISOString(),
      installedYear: 2022,
      manufacturer: 'Otis Rail Transit',
      isSample: true
    },
    {
      id: 'AST-LIFT-SHPR-02',
      name: 'Shahpur Underground Emergency Exit Lift L-04',
      type: 'Lift',
      station: 'Shahpur',
      stationOrSection: 'Shahpur - West Shaft Evacuation Bank',
      line: 'East-West',
      status: 'Under Review',
      maintenanceIntervalDays: 30,
      // No last PM date and commissioned very recently -> Insufficient Data test case
      lastPmDate: undefined,
      installedYear: new Date(refTime).getFullYear(),
      manufacturer: 'Otis Rail Transit',
      isSample: true
    },

    // Escalators
    {
      id: 'AST-ESC-OHC-02',
      name: 'Old High Court Concourse-to-Platform Escalator E-02',
      type: 'Escalator',
      station: 'Old High Court',
      stationOrSection: 'Old High Court - North-South Line Platform 1 Escalator Well',
      line: 'North-South',
      status: 'Maintenance Required',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 52 * dayMs).toISOString(), // Overdue by 22 days
      installedYear: 2021,
      manufacturer: 'KONE Transit Escalators',
      isSample: true
    },
    {
      id: 'AST-ESC-KLP-01',
      name: 'Kalupur Underpass Heavy-Duty Escalator E-01',
      type: 'Escalator',
      station: 'Kalupur Railway Station',
      stationOrSection: 'Kalupur Railway Station - Railway Sub-connection Escalator',
      line: 'East-West',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 35 * dayMs).toISOString(), // Overdue by 5 days
      installedYear: 2021,
      manufacturer: 'KONE Transit Escalators',
      isSample: true
    },
    {
      id: 'AST-ESC-GUJR-01',
      name: 'Gujarat University North Escalator E-01',
      type: 'Escalator',
      station: 'Gujarat University',
      stationOrSection: 'Gujarat University - Street Entrance Gate A',
      line: 'East-West',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 19 * dayMs).toISOString(),
      installedYear: 2022,
      manufacturer: 'ThyssenKrupp Metro Escalators',
      isSample: true
    },
    {
      id: 'AST-ESC-MOTR-01',
      name: 'Motera Stadium High-Capacity Event Escalator E-04',
      type: 'Escalator',
      station: 'Motera Stadium',
      stationOrSection: 'Motera Stadium - South Plaza Ingress Well',
      line: 'North-South',
      status: 'Operational',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 11 * dayMs).toISOString(),
      installedYear: 2022,
      manufacturer: 'ThyssenKrupp Metro Escalators',
      isSample: true
    },

    // Legacy infrastructure assets kept for system compatibility
    {
      id: 'AST-PSD-SAB06',
      name: 'Platform Screen Door Bank (Platform 1, Door 6)',
      type: 'Platform Screen Door',
      station: 'Sabarmati Railway Station',
      stationOrSection: 'Sabarmati Railway Station - Platform 1',
      line: 'North-South',
      status: 'Maintenance Required',
      maintenanceIntervalDays: 30,
      lastPmDate: new Date(refTime - 28 * dayMs).toISOString(),
      installedYear: 2021,
      manufacturer: 'Westinghouse Platform Screen Doors',
      isSample: true
    },
    {
      id: 'AST-SIG-12B',
      name: 'Old High Court Crossover Point Machine 12B',
      type: 'Point Machine',
      station: 'Old High Court',
      stationOrSection: 'Old High Court Interlocking',
      line: 'North-South',
      status: 'Operational',
      maintenanceIntervalDays: 45,
      lastPmDate: new Date(refTime - 38 * dayMs).toISOString(),
      installedYear: 2020,
      manufacturer: 'Alstom Signalling',
      isSample: true
    }
  ];
}

/**
 * Realistic synthetic historical fault logs over ~60 to 90 days.
 * Produces meaningfully varied, reproducible risk scores across assets.
 */
export function buildSyntheticFaultLogs(refDate: Date): AssetFaultLog[] {
  const refTime = refDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  return [
    // --- AST-GATE-KLP-01: High Risk (Score ~85-95) ---
    // 4 recent faults in last 30d, repeat fault ERR-FLAP-401, acceleration spike, overdue PM (46d)
    {
      id: 'FLT-KLP-01-01',
      assetId: 'AST-GATE-KLP-01',
      timestamp: new Date(refTime - 75 * dayMs).toISOString(),
      faultCode: 'ERR-OPT-102',
      faultCategory: 'Optical Sensor',
      description: 'Passenger clearance optical beam obscured by dirt build-up',
      severity: 'Minor',
      resolvedAt: new Date(refTime - 75 * dayMs + 3 * hourMs).toISOString(),
      resolutionNotes: 'Optical beam emitter cleaned and sensitivity calibrated.',
      isSample: true
    },
    {
      id: 'FLT-KLP-01-02',
      assetId: 'AST-GATE-KLP-01',
      timestamp: new Date(refTime - 50 * dayMs).toISOString(),
      faultCode: 'ERR-FLAP-401',
      faultCategory: 'Flap Actuator',
      description: 'Retractable flap mechanical drive resistance during peak passenger surge',
      severity: 'Major',
      resolvedAt: new Date(refTime - 50 * dayMs + 5 * hourMs).toISOString(),
      resolutionNotes: 'Actuator linkage lubricated; motor current returned to nominal 1.8A.',
      isSample: true
    },
    {
      id: 'FLT-KLP-01-03',
      assetId: 'AST-GATE-KLP-01',
      timestamp: new Date(refTime - 25 * dayMs).toISOString(),
      faultCode: 'ERR-FLAP-401',
      faultCategory: 'Flap Actuator',
      description: 'Flap gate stuck open on lane 1; torque sensor triggered safety cut-out',
      severity: 'Major',
      resolvedAt: new Date(refTime - 25 * dayMs + 4 * hourMs).toISOString(),
      resolutionNotes: 'Reset gearbox mechanical pin. Flagged for complete motor array replacement.',
      isSample: true
    },
    {
      id: 'FLT-KLP-01-04',
      assetId: 'AST-GATE-KLP-01',
      timestamp: new Date(refTime - 12 * dayMs).toISOString(),
      faultCode: 'ERR-FLAP-401',
      faultCategory: 'Flap Actuator',
      description: 'Flap motor overheating warning under sustained passenger throughput',
      severity: 'Major',
      resolvedAt: new Date(refTime - 12 * dayMs + 2 * hourMs).toISOString(),
      resolutionNotes: 'Thermistor calibrated; motor duty cycle reset.',
      isSample: true
    },
    {
      id: 'FLT-KLP-01-05',
      assetId: 'AST-GATE-KLP-01',
      timestamp: new Date(refTime - 6 * dayMs).toISOString(),
      faultCode: 'ERR-FLAP-401',
      faultCategory: 'Flap Actuator',
      description: 'Flap barrier intermittent lag on cycle closure; optical sync warning',
      severity: 'Critical',
      resolvedAt: new Date(refTime - 6 * dayMs + 6 * hourMs).toISOString(),
      resolutionNotes: 'Temporary gear tension adjusted. Urgent overhaul required before total lockup.',
      isSample: true
    },
    {
      id: 'FLT-KLP-01-06',
      assetId: 'AST-GATE-KLP-01',
      timestamp: new Date(refTime - 2 * dayMs).toISOString(),
      faultCode: 'ERR-COMM-502',
      faultCategory: 'Station Controller Comms',
      description: 'Ethernet bus drop between gate lane 1 local CPU and station central validator',
      severity: 'Major',
      resolvedAt: new Date(refTime - 2 * dayMs + 2 * hourMs).toISOString(),
      resolutionNotes: 'RJ45 port reseated; comms loop verified.',
      isSample: true
    },

    // --- AST-ESC-OHC-02: High Risk with Active Unresolved Defect (Score ~88) ---
    // Repeat handrail drive slip ERR-DRV-202, PM overdue (52d), 1 active unresolved fault
    {
      id: 'FLT-ESC-OHC-01',
      assetId: 'AST-ESC-OHC-02',
      timestamp: new Date(refTime - 70 * dayMs).toISOString(),
      faultCode: 'ERR-BRK-301',
      faultCategory: 'Brake Mechanism',
      description: 'Auxiliary pawl safety brake clearance limit switch trip during routine inspection',
      severity: 'Minor',
      resolvedAt: new Date(refTime - 70 * dayMs + 4 * hourMs).toISOString(),
      resolutionNotes: 'Microswitch clearance shim adjusted to 1.5mm.',
      isSample: true
    },
    {
      id: 'FLT-ESC-OHC-02',
      assetId: 'AST-ESC-OHC-02',
      timestamp: new Date(refTime - 22 * dayMs).toISOString(),
      faultCode: 'ERR-DRV-202',
      faultCategory: 'Handrail Drive',
      description: 'Right handrail drive belt speed synchronization discrepancy exceeding 2%',
      severity: 'Major',
      resolvedAt: new Date(refTime - 22 * dayMs + 5 * hourMs).toISOString(),
      resolutionNotes: 'Drive friction roller tensioner re-torqued.',
      isSample: true
    },
    {
      id: 'FLT-ESC-OHC-03',
      assetId: 'AST-ESC-OHC-02',
      timestamp: new Date(refTime - 8 * dayMs).toISOString(),
      faultCode: 'ERR-DRV-202',
      faultCategory: 'Handrail Drive',
      description: 'Handrail drive belt friction slip and thermal sensor alert at upper landing',
      severity: 'Critical',
      resolvedAt: new Date(refTime - 8 * dayMs + 6 * hourMs).toISOString(),
      resolutionNotes: 'Friction pulley surface degreased and drive belt aligned.',
      isSample: true
    },
    {
      id: 'FLT-ESC-OHC-04',
      assetId: 'AST-ESC-OHC-02',
      timestamp: new Date(refTime - 1 * dayMs).toISOString(),
      faultCode: 'ERR-DRV-202',
      faultCategory: 'Handrail Drive',
      description: 'Handrail slip sensor continuous alarm; escalator stopped on safety circuit trip',
      severity: 'Critical',
      // Unresolved fault!
      resolvedAt: undefined,
      resolutionNotes: undefined,
      isSample: true
    },

    // --- AST-LIFT-APPR-01: High Risk (Score ~82) ---
    // 4 recent faults in 30d, leveling sensor drift ERR-LVL-105, PM overdue (45d)
    {
      id: 'FLT-LFT-APP-01',
      assetId: 'AST-LIFT-APPR-01',
      timestamp: new Date(refTime - 80 * dayMs).toISOString(),
      faultCode: 'ERR-DOOR-204',
      faultCategory: 'Door Operator',
      description: 'Car door protective light curtain infrared emitter alignment drift',
      severity: 'Minor',
      resolvedAt: new Date(refTime - 80 * dayMs + 3 * hourMs).toISOString(),
      resolutionNotes: 'Re-centered optical photodiode brackets.',
      isSample: true
    },
    {
      id: 'FLT-LFT-APP-02',
      assetId: 'AST-LIFT-APPR-01',
      timestamp: new Date(refTime - 27 * dayMs).toISOString(),
      faultCode: 'ERR-LVL-105',
      faultCategory: 'Leveling Sensor',
      description: 'Floor leveling discrepancy >12mm observed at Concourse landing',
      severity: 'Major',
      resolvedAt: new Date(refTime - 27 * dayMs + 4 * hourMs).toISOString(),
      resolutionNotes: 'Magnetic landing vane sensor re-calibrated.',
      isSample: true
    },
    {
      id: 'FLT-LFT-APP-03',
      assetId: 'AST-LIFT-APPR-01',
      timestamp: new Date(refTime - 15 * dayMs).toISOString(),
      faultCode: 'ERR-LVL-105',
      faultCategory: 'Leveling Sensor',
      description: 'Car overshot Platform 1 landing threshold by 15mm; passenger step trip hazard',
      severity: 'Critical',
      resolvedAt: new Date(refTime - 15 * dayMs + 5 * hourMs).toISOString(),
      resolutionNotes: 'Variable frequency drive deceleration curve re-programmed.',
      isSample: true
    },
    {
      id: 'FLT-LFT-APP-04',
      assetId: 'AST-LIFT-APPR-01',
      timestamp: new Date(refTime - 5 * dayMs).toISOString(),
      faultCode: 'ERR-LVL-105',
      faultCategory: 'Leveling Sensor',
      description: 'Leveling sensor signal jitter causing emergency brake shudder on approach',
      severity: 'Major',
      resolvedAt: new Date(refTime - 5 * dayMs + 3 * hourMs).toISOString(),
      resolutionNotes: 'Replaced magnetic encoder pickup cable; scheduled full floor sensor array overhaul.',
      isSample: true
    },

    // --- AST-TVM-KLP-01: Medium Risk (Score ~52) ---
    // 2 faults in 30d, repeat banknote validator jam ERR-VAL-302, PM due in 3 days
    {
      id: 'FLT-TVM-KLP-01',
      assetId: 'AST-TVM-KLP-01',
      timestamp: new Date(refTime - 60 * dayMs).toISOString(),
      faultCode: 'ERR-PRN-101',
      faultCategory: 'Thermal Printer',
      description: 'Paper roll paper jam in paper cutter mechanism during receipt printing',
      severity: 'Minor',
      resolvedAt: new Date(refTime - 60 * dayMs + 2 * hourMs).toISOString(),
      resolutionNotes: 'Paper path cleared and thermal print head cleaned.',
      isSample: true
    },
    {
      id: 'FLT-TVM-KLP-02',
      assetId: 'AST-TVM-KLP-01',
      timestamp: new Date(refTime - 20 * dayMs).toISOString(),
      faultCode: 'ERR-VAL-302',
      faultCategory: 'Banknote Validator',
      description: 'Currency acceptor optical validation reject rate exceeds 25%',
      severity: 'Major',
      resolvedAt: new Date(refTime - 20 * dayMs + 3 * hourMs).toISOString(),
      resolutionNotes: 'Optical sensor prism cleaned with isopropyl alcohol.',
      isSample: true
    },
    {
      id: 'FLT-TVM-KLP-03',
      assetId: 'AST-TVM-KLP-01',
      timestamp: new Date(refTime - 7 * dayMs).toISOString(),
      faultCode: 'ERR-VAL-302',
      faultCategory: 'Banknote Validator',
      description: 'Banknote feeder motor slip during high passenger volume ticket purchase',
      severity: 'Major',
      resolvedAt: new Date(refTime - 7 * dayMs + 4 * hourMs).toISOString(),
      resolutionNotes: 'Roller belts tensioned; cash box cash stacker lubricated.',
      isSample: true
    },

    // --- AST-ESC-KLP-01: Medium Risk (Score ~48) ---
    // 2 faults in 30d, repeat comb plate sensor trip ERR-COMB-101, PM overdue (35d)
    {
      id: 'FLT-ESC-KLP-01',
      assetId: 'AST-ESC-KLP-01',
      timestamp: new Date(refTime - 65 * dayMs).toISOString(),
      faultCode: 'ERR-STEP-201',
      faultCategory: 'Step Chain',
      description: 'Step roller guide friction squeal on lower curve track',
      severity: 'Minor',
      resolvedAt: new Date(refTime - 65 * dayMs + 3 * hourMs).toISOString(),
      resolutionNotes: 'Automatic lubrication reservoir refilled and nozzles cleared.',
      isSample: true
    },
    {
      id: 'FLT-ESC-KLP-02',
      assetId: 'AST-ESC-KLP-01',
      timestamp: new Date(refTime - 18 * dayMs).toISOString(),
      faultCode: 'ERR-COMB-101',
      faultCategory: 'Comb Plate Safety',
      description: 'Upper landing comb plate safety switch tripped by coin wedged in tooth gap',
      severity: 'Major',
      resolvedAt: new Date(refTime - 18 * dayMs + 2 * hourMs).toISOString(),
      resolutionNotes: 'Foreign object extracted; comb teeth checked for breakage.',
      isSample: true
    },
    {
      id: 'FLT-ESC-KLP-03',
      assetId: 'AST-ESC-KLP-01',
      timestamp: new Date(refTime - 4 * dayMs).toISOString(),
      faultCode: 'ERR-COMB-101',
      faultCategory: 'Comb Plate Safety',
      description: 'Comb plate deflection sensor microswitch intermittent contact jitter',
      severity: 'Major',
      resolvedAt: new Date(refTime - 4 * dayMs + 3 * hourMs).toISOString(),
      resolutionNotes: 'Microswitch contact cleaned and return spring tension verified.',
      isSample: true
    },

    // --- AST-GATE-OHC-01: Medium Risk (Score ~38) ---
    // 2 faults in 30d, different codes, PM nominal
    {
      id: 'FLT-GAT-OHC-01',
      assetId: 'AST-GATE-OHC-01',
      timestamp: new Date(refTime - 24 * dayMs).toISOString(),
      faultCode: 'ERR-SCAN-104',
      faultCategory: 'QR / Smartcard Reader',
      description: 'Smartcard contactless antenna NFC reader timeout on rapid successive taps',
      severity: 'Minor',
      resolvedAt: new Date(refTime - 24 * dayMs + 2 * hourMs).toISOString(),
      resolutionNotes: 'SAM card firmware rebooted and antenna tuned.',
      isSample: true
    },
    {
      id: 'FLT-GAT-OHC-02',
      assetId: 'AST-GATE-OHC-01',
      timestamp: new Date(refTime - 9 * dayMs).toISOString(),
      faultCode: 'ERR-DISP-201',
      faultCategory: 'Passenger Display',
      description: 'Gate status LCD screen backlight flickering on entry side',
      severity: 'Minor',
      resolvedAt: new Date(refTime - 9 * dayMs + 2 * hourMs).toISOString(),
      resolutionNotes: 'Inverter ribbon cable re-seated.',
      isSample: true
    },

    // --- AST-TVM-THLT-01: Low Risk (Score ~10) ---
    // 1 historical fault 55d ago, 0 faults in 30d, PM completed 9d ago
    {
      id: 'FLT-TVM-THL-01',
      assetId: 'AST-TVM-THLT-01',
      timestamp: new Date(refTime - 55 * dayMs).toISOString(),
      faultCode: 'ERR-COIN-102',
      faultCategory: 'Coin Hopper',
      description: 'Coin hopper change dispensing sensor low margin alert',
      severity: 'Minor',
      resolvedAt: new Date(refTime - 55 * dayMs + 2 * hourMs).toISOString(),
      resolutionNotes: 'Hopper optics cleaned; sensor zero point reset.',
      isSample: true
    },

    // --- AST-LIFT-KNKR-01: Low Risk (Score ~10) ---
    // 1 fault 42d ago, 0 in 30d, PM completed 14d ago
    {
      id: 'FLT-LFT-KNK-01',
      assetId: 'AST-LIFT-KNKR-01',
      timestamp: new Date(refTime - 42 * dayMs).toISOString(),
      faultCode: 'ERR-DOOR-102',
      faultCategory: 'Door Operator',
      description: 'Door closing speed profile delayed by debris in bottom sill track',
      severity: 'Minor',
      resolvedAt: new Date(refTime - 42 * dayMs + 1 * hourMs).toISOString(),
      resolutionNotes: 'Sill track vacuumed and lubricated.',
      isSample: true
    },

    // --- AST-GATE-VGAM-01: Low Risk (Score 0) ---
    // 0 faults in entire history, PM fresh (12d ago)

    // --- AST-ESC-MOTR-01: Low Risk (Score 0) ---
    // 0 faults in 90d, PM fresh (11d ago)

    // --- AST-PSD-SAB06: Linked to active incident INC-2025-0819 ---
    {
      id: 'FLT-PSD-SAB-01',
      assetId: 'AST-PSD-SAB06',
      timestamp: new Date(refTime - 110 * (60 * 1000)).toISOString(),
      faultCode: 'ERR-PSD-SYNC',
      faultCategory: 'Platform Screen Door',
      description: 'Door Leaf 6 interlock sensor obstruction mismatch during train departure',
      severity: 'Major',
      resolvedAt: undefined, // Unresolved!
      isSample: true
    }
  ];
}

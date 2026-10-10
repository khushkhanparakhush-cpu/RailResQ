import { 
  Incident, 
  WorkOrder, 
  StationData, 
  MetroAsset, 
  ActivityEvent 
} from '../types/metro';
import { calculateIncidentPriority } from '../utils/priorityEngine';

export const HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA65EeLZ_MxrS7MSDxlpeDTropDSu9UW8guy2Sv9a6VonZQE-efHLLbxzrLHXNQLsQe3-pqNCoKg27VE0japYFeI3av8D__WQtO2d7WQ7F7FT-6T0jA9J30AV6tNUpW1ouNlRINX_2C-oQDpQZwd7XgGECkijl_4noaXgXwXb6xaAN2nTo_lkMVpGBTi9eJBbeU_oRbMXwtVsEJnVRlz2bQMnSkjYzGPtMNBTlvK1BjQKlUHfMTP3hOA';

export const LOGO_IMAGE = 'https://lh3.googleusercontent.com/aida/AEtjO1UC4uesV_5EKTH3WDoRackCrVDw_6YFWOUl5nfV8Fu6cK79p8Y5vkRQTPbObwVoCszE0K6z6iN1xsupZyg3DOm96K6ov1fHISQlSnZpl2GEES5XrWewkoET0K9E0IB642hyzctn7ywSFS9Th9L-o9HjIEoI8u4SSj_j3q77_bODbkcKF6opeiFbyF7K6mB3voXCKOdySoRLhyL5UMwXtAZHbo2OkSeCecV4HMSRg-XAbvQ47CHrI_z3fdXV';

export const AHMEDABAD_STATIONS: StationData[] = [
  // North-South Line (APMC ⇄ Motera Stadium, 18.87 km)
  { id: 'st-ns-01', name: 'APMC', line: 'NS', code: 'APMC', chainageKm: '0.00', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-02', name: 'Jivraj Park', line: 'NS', code: 'JVRJ', chainageKm: '1.82', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-03', name: 'Rajiv Nagar', line: 'NS', code: 'RJNV', chainageKm: '3.10', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-04', name: 'Shreyas', line: 'NS', code: 'SHRY', chainageKm: '4.65', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-05', name: 'Paldi', line: 'NS', code: 'PLDI', chainageKm: '6.20', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-06', name: 'Gandhigram', line: 'NS', code: 'GNDH', chainageKm: '7.85', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-07', name: 'Old High Court', line: 'NS', code: 'OHC', chainageKm: '9.40', elevatedOrUnderground: 'Elevated', platforms: 4, interchange: true },
  { id: 'st-ns-08', name: 'Usmanpura', line: 'NS', code: 'USMN', chainageKm: '10.95', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-09', name: 'Vijay Nagar', line: 'NS', code: 'VJYN', chainageKm: '12.45', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-10', name: 'Vadaj', line: 'NS', code: 'VDJ', chainageKm: '13.90', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-11', name: 'Ranip', line: 'NS', code: 'RNP', chainageKm: '15.20', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-12', name: 'Sabarmati Railway Station', line: 'NS', code: 'SABR', chainageKm: '16.70', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-13', name: 'AEC', line: 'NS', code: 'AEC', chainageKm: '17.80', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-14', name: 'Sabarmati', line: 'NS', code: 'SABM', chainageKm: '18.20', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ns-15', name: 'Motera Stadium', line: 'NS', code: 'MOTR', chainageKm: '18.87', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },

  // East-West Line (Thaltej Gam ⇄ Vastral Gam, 21.16 km)
  { id: 'st-ew-01', name: 'Thaltej Gam', line: 'EW', code: 'THLT', chainageKm: '0.00', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-02', name: 'Doordarshan Kendra', line: 'EW', code: 'DDK', chainageKm: '1.45', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-03', name: 'Gurukul Road', line: 'EW', code: 'GRKL', chainageKm: '2.90', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-04', name: 'Gujarat University', line: 'EW', code: 'GUJR', chainageKm: '4.55', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-05', name: 'Commerce Six Road', line: 'EW', code: 'CSR', chainageKm: '5.90', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-06', name: 'Stadium', line: 'EW', code: 'STDM', chainageKm: '7.30', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-07', name: 'Old High Court', line: 'EW', code: 'OHC', chainageKm: '8.80', elevatedOrUnderground: 'Elevated', platforms: 4, interchange: true },
  { id: 'st-ew-08', name: 'Shahpur', line: 'EW', code: 'SHPR', chainageKm: '10.35', elevatedOrUnderground: 'Underground', platforms: 2, interchange: false },
  { id: 'st-ew-09', name: 'Gheekanta', line: 'EW', code: 'GHK', chainageKm: '11.85', elevatedOrUnderground: 'Underground', platforms: 2, interchange: false },
  { id: 'st-ew-10', name: 'Kalupur Railway Station', line: 'EW', code: 'KLP', chainageKm: '13.40', elevatedOrUnderground: 'Underground', platforms: 2, interchange: false },
  { id: 'st-ew-11', name: 'Kankaria East', line: 'EW', code: 'KNKR', chainageKm: '15.10', elevatedOrUnderground: 'Underground', platforms: 2, interchange: false },
  { id: 'st-ew-12', name: 'Apparel Park', line: 'EW', code: 'APPR', chainageKm: '16.90', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-13', name: 'Amraiwadi', line: 'EW', code: 'AMRW', chainageKm: '18.10', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-14', name: 'Rabari Colony', line: 'EW', code: 'RBR', chainageKm: '19.20', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-15', name: 'Vastral', line: 'EW', code: 'VSTL', chainageKm: '20.25', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-16', name: 'Nirant Cross Road', line: 'EW', code: 'NRNT', chainageKm: '20.75', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false },
  { id: 'st-ew-17', name: 'Vastral Gam', line: 'EW', code: 'VGAM', chainageKm: '21.16', elevatedOrUnderground: 'Elevated', platforms: 2, interchange: false }
];

export const SAMPLE_ASSETS: MetroAsset[] = [
  { id: 'AST-OHE-01', name: 'Apparel Park Traction Substation (25kV)', type: 'Traction Substation', station: 'Apparel Park', stationOrSection: 'Apparel Park Depot', line: 'East-West', status: 'Under Review', maintenanceIntervalDays: 60, lastPmDate: '2025-08-15T00:00:00.000Z', isSample: true },
  { id: 'AST-SIG-12B', name: 'Old High Court Crossover Point Machine 12B', type: 'Point Machine', station: 'Old High Court', stationOrSection: 'Old High Court Interlocking', line: 'North-South', status: 'Operational', maintenanceIntervalDays: 45, lastPmDate: '2025-09-01T00:00:00.000Z', isSample: true },
  { id: 'AST-PSD-SAB06', name: 'Platform Screen Door Bank (Platform 1, Door 6)', type: 'Platform Screen Door', station: 'Sabarmati Railway Station', stationOrSection: 'Sabarmati Railway Station', line: 'North-South', status: 'Maintenance Required', maintenanceIntervalDays: 30, lastPmDate: '2025-09-10T00:00:00.000Z', isSample: true },
  { id: 'AST-AFC-KLP04', name: 'Kalupur Concourse Fare Validator Array B-04', type: 'Ticket Gate', station: 'Kalupur Railway Station', stationOrSection: 'Kalupur Railway Station', line: 'East-West', status: 'Operational', maintenanceIntervalDays: 30, lastPmDate: '2025-09-18T00:00:00.000Z', isSample: true },
  { id: 'AST-SIG-S104', name: 'Tunnel Entry Signal Head S-104', type: 'Signal Head', station: 'Shahpur', stationOrSection: 'Shahpur Underground Portal', line: 'East-West', status: 'Operational', maintenanceIntervalDays: 60, lastPmDate: '2025-08-20T00:00:00.000Z', isSample: true },
  { id: 'AST-RS-DM08', name: 'Rolling Stock 3-Car Rake Set DM-08', type: 'Rolling Stock', station: 'Apparel Park', stationOrSection: 'In Revenue Transit', line: 'East-West', status: 'Operational', maintenanceIntervalDays: 30, lastPmDate: '2025-09-25T00:00:00.000Z', isSample: true },
  { id: 'AST-RS-DM12', name: 'Rolling Stock 3-Car Rake Set DM-12', type: 'Rolling Stock', station: 'Apparel Park', stationOrSection: 'Apparel Park Stabling Bay', line: 'East-West', status: 'Operational', maintenanceIntervalDays: 30, lastPmDate: '2025-09-28T00:00:00.000Z', isSample: true }
];

function createSampleIncident(
  data: Omit<Incident, 'isSample' | 'priorityScore' | 'priorityTier' | 'priorityReason'>
): Incident {
  const priority = calculateIncidentPriority({
    severity: data.severity,
    safetyConcern: data.safetyConcern,
    serviceDisruption: data.serviceDisruption,
    passengerImpact: data.passengerImpact
  });

  return {
    ...data,
    isSample: true,
    priorityScore: priority.score,
    priorityTier: priority.tier,
    priorityReason: priority.reason
  };
}

export const INITIAL_INCIDENTS: Incident[] = [
  createSampleIncident({
    id: 'INC-2025-0821',
    title: 'Pantograph Contact Arcing at Apparel Park Viaduct',
    category: 'Traction & Power',
    description: 'Electrical flash reported near Viaduct Pier 142 during train passage. Section overhead wire requires inspection of carbon collector strips and tensioning wire.',
    station: 'Apparel Park',
    location: 'Viaduct Pier 142 (East-West Line)',
    corridor: 'East-West',
    assetId: 'AST-OHE-01',
    severity: 'Critical',
    passengerImpact: 'Moderate Delay (5-15m)',
    safetyConcern: true,
    serviceDisruption: true,
    assignedTeam: 'Electrical Rapid Team (Apparel Depot)',
    status: 'In Progress',
    reportedBy: 'R. Mehta (Shift Lead)',
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }),
  createSampleIncident({
    id: 'INC-2025-0820',
    title: 'Axle Counter Response Delay at Old High Court',
    category: 'Signalling & Telecom',
    description: 'Track circuit transponder on Switch 12B platform 2 showing intermittent clearance detection. Signaling operating under automatic speed restriction profile.',
    station: 'Old High Court',
    location: 'Platform 2 Crossover Switch 12B',
    corridor: 'North-South',
    assetId: 'AST-SIG-12B',
    severity: 'Warning',
    passengerImpact: 'Minor Delay (<5m)',
    safetyConcern: false,
    serviceDisruption: false,
    assignedTeam: 'Signalling Team (S. Desai)',
    status: 'Acknowledged',
    reportedBy: 'ATC Signaling Telemetry',
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }),
  createSampleIncident({
    id: 'INC-2025-0819',
    title: 'Platform Screen Door Interlock Sensor Fault',
    category: 'Station Infrastructure',
    description: 'Door Leaf 6 on Platform 1 failed obstruction sensor sync during train boarding. Safety latch reset manually by station marshal.',
    station: 'Sabarmati Railway Station',
    location: 'Platform 1, Door Set 6',
    corridor: 'North-South',
    assetId: 'AST-PSD-SAB06',
    severity: 'Warning',
    passengerImpact: 'Minor Delay (<5m)',
    safetyConcern: true,
    serviceDisruption: false,
    assignedTeam: 'Station Facilities Squad',
    status: 'In Progress',
    reportedBy: 'Sabarmati Station Controller',
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  }),
  createSampleIncident({
    id: 'INC-2025-0818',
    title: 'Concourse AFC Gate Array Validator Timeout',
    category: 'Fare Collection',
    description: 'Turnstile Gate B-04 optical validator offline. Token and QR scanning routed through secondary barriers to avoid passenger buildup.',
    station: 'Kalupur Railway Station',
    location: 'Main Concourse Array B',
    corridor: 'East-West',
    assetId: 'AST-AFC-KLP04',
    severity: 'Low',
    passengerImpact: 'None',
    safetyConcern: false,
    serviceDisruption: false,
    assignedTeam: 'IT Ticketing Support',
    status: 'Open',
    reportedBy: 'Kalupur Station Supervisor',
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString()
  }),
  createSampleIncident({
    id: 'INC-2025-0817',
    title: 'Air Conditioning Pressure Variance on Rake DM-08',
    category: 'Rolling Stock',
    description: 'Coach TC-02 cabin temperature elevated +1.5°C over nominal setpoint. Scheduled for routine chiller compressor filter replacement at depot.',
    station: 'Old High Court',
    location: 'Rake Set DM-08',
    corridor: 'East-West',
    assetId: 'AST-RS-DM08',
    severity: 'Low',
    passengerImpact: 'None',
    safetyConcern: false,
    serviceDisruption: false,
    assignedTeam: 'Depot Mechanical Team',
    status: 'Resolved',
    reportedBy: 'TCMS Train Monitoring',
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  }),
  createSampleIncident({
    id: 'INC-2025-0816',
    title: 'Section Isolator Contact Re-Torque Completed',
    category: 'Traction & Power',
    description: 'Periodic thermography check indicated thermal drift at terminal siding isolator B-7. Physical connection inspected, torqued, and verified clear.',
    station: 'Vastral Gam',
    location: 'Terminal Siding Isolator B-7',
    corridor: 'East-West',
    severity: 'Low',
    passengerImpact: 'None',
    safetyConcern: false,
    serviceDisruption: false,
    assignedTeam: 'Traction Crew East',
    status: 'Closed',
    reportedBy: 'Vastral Depot Engineer',
    createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
  })
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-2025-0401',
    title: 'Overhead Wire Inspection at Apparel Park Pier 142',
    description: 'Isolate section and inspect catenary dropper wire tension and carbon contact strips.',
    location: 'Pier 142 Viaduct',
    station: 'Apparel Park',
    corridor: 'East-West',
    category: 'Traction & Power',
    assetId: 'AST-OHE-01',
    assignedTeam: 'Electrical Rapid Team (Apparel Depot)',
    priority: 'High',
    column: 'progress',
    linkedIncidentId: 'INC-2025-0821',
    checklist: [
      { id: 'chk-01', text: 'Isolate 25kV feeder section switch S-14 and verify earth ground', completed: true, completedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { id: 'chk-02', text: 'Inspect pantograph carbon strip collector for arcing burns', completed: true, completedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
      { id: 'chk-03', text: 'Verify dropper tension and catenary height tolerance (+/- 5mm)', completed: false },
      { id: 'chk-04', text: 'Issue traction clearance certificate to OCC supervisor', completed: false }
    ],
    progress: 50, // 2 of 4 items completed
    notes: 'Ladder rig active on trackside; catenary dropper tension check in progress.',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: 'WO-2025-0402',
    title: 'Axle Counter Sensor Node Recalibration',
    description: 'Digital calibration of track circuit transponder on Switch 12B.',
    location: 'Platform 2 Crossover Switch 12B',
    station: 'Old High Court',
    corridor: 'North-South',
    category: 'Signalling & Telecom',
    assetId: 'AST-SIG-12B',
    assignedTeam: 'Signalling Team (S. Desai)',
    priority: 'Medium',
    column: 'dispatched',
    linkedIncidentId: 'INC-2025-0820',
    checklist: [
      { id: 'chk-11', text: 'Connect digital multitester to axle counter terminal block', completed: true, completedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
      { id: 'chk-12', text: 'Calibrate wheel detector wheel rim magnetic flux sensitivity', completed: false },
      { id: 'chk-13', text: 'Execute 3-axle simulated train run verification', completed: false }
    ],
    progress: 33, // 1 of 3 items completed
    notes: 'En route with digital diagnostic multitester kit.',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: 'WO-2025-0403',
    title: 'Platform Screen Door Leaf 6 Obstruction Clearance',
    description: 'Clear foreign obstacle and test sensor optical alignment.',
    location: 'Platform 1 Door 6',
    station: 'Sabarmati Railway Station',
    corridor: 'North-South',
    category: 'Station Infrastructure',
    assetId: 'AST-PSD-SAB06',
    assignedTeam: 'Station Facilities Squad',
    priority: 'Medium',
    column: 'queued',
    linkedIncidentId: 'INC-2025-0819',
    checklist: [
      { id: 'chk-21', text: 'Check platform 1 door 6 guide rail for foreign obstruction', completed: false },
      { id: 'chk-22', text: 'Recalibrate safety optical curtain sync pulse', completed: false },
      { id: 'chk-23', text: 'Test emergency manual release handle', completed: false }
    ],
    progress: 0, // 0 of 3 items completed
    notes: 'Guide rail slot checked; interlock recalibration scheduled.',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    isSample: true
  },
  {
    id: 'WO-2025-0404',
    title: 'Routine Pantograph Strip Wear Measurement (Rake DM-12)',
    description: 'Depot preventive maintenance inspection on rolling stock DM-12.',
    location: 'Depot Stabling Bay 4',
    station: 'Apparel Park',
    corridor: 'East-West',
    category: 'Rolling Stock',
    assetId: 'AST-RS-DM12',
    assignedTeam: 'Depot Mechanical Team',
    priority: 'Low',
    column: 'completed',
    checklist: [
      { id: 'chk-31', text: 'Position rake DM-12 on stabling bay 4 inspection pit', completed: true, completedAt: new Date(Date.now() - 160 * 60 * 1000).toISOString() },
      { id: 'chk-32', text: 'Measure carbon strip thickness across 4 contact points', completed: true, completedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString() },
      { id: 'chk-33', text: 'Inspect horn and bow assembly for mechanical deformation', completed: true, completedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
      { id: 'chk-34', text: 'Sign off depot pre-service clearance log', completed: true, completedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() }
    ],
    progress: 100, // 4 of 4 items completed
    notes: 'Carbon strip thickness measured at 24mm (well above 15mm replacement limit).',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isSample: true
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityEvent[] = [
  {
    id: 'ACT-001',
    type: 'create',
    title: 'Incident INC-2025-0821 Logged',
    description: 'Pantograph Contact Arcing logged at Apparel Park Viaduct Pier 142. Severity: Critical.',
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    incidentId: 'INC-2025-0821',
    author: 'Local Demo Operator',
    isSample: true
  },
  {
    id: 'ACT-002',
    type: 'assign',
    title: 'Team Assigned to INC-2025-0821',
    description: 'Electrical Rapid Team dispatched from Apparel Depot with ladder rig.',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    incidentId: 'INC-2025-0821',
    author: 'Local Demo Operator',
    isSample: true
  },
  {
    id: 'ACT-003',
    type: 'maintenance',
    title: 'Work Order WO-2025-0401 Checklist Progress (50%)',
    description: '2 of 4 inspection items completed for catenary contact wire check.',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    incidentId: 'INC-2025-0821',
    workOrderId: 'WO-2025-0401',
    author: 'Electrical Rapid Team',
    isSample: true
  },
  {
    id: 'ACT-004',
    type: 'update_status',
    title: 'Incident INC-2025-0820 Acknowledged',
    description: 'Axle Counter Response Delay status updated to Acknowledged. Speed restriction profile active.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    incidentId: 'INC-2025-0820',
    author: 'Local Demo Operator',
    isSample: true
  },
  {
    id: 'ACT-005',
    type: 'resolve',
    title: 'Incident INC-2025-0817 Resolved',
    description: 'Air Conditioning Pressure Variance on Rake DM-08 verified and resolved at depot dock.',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    incidentId: 'INC-2025-0817',
    author: 'Depot Mechanical Team',
    isSample: true
  }
];

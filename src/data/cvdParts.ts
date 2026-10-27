/**
 * cvdParts.ts — the single part database shared by the 3D scene,
 * the interaction layer and every UI panel.
 *
 * Every numeric value is a teaching-schematic value. Real equipment
 * ratings must come from the manufacturer's datasheet.
 */

import type { Vec3 } from './equipmentConfig';

export type CategoryId = 'frame' | 'furnace' | 'reactor' | 'gas' | 'vacuum' | 'control';

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  en: string;
  accent: string;
}

export interface PartParam {
  key: string;
  value: string;
}

export interface CVDPartConfig {
  id: string;
  code: string;
  name: string;
  en: string;
  category: CategoryId;
  /** one-line annotation value */
  spec: string;
  /** short label used by the in-scene callouts */
  short?: string;
  summary: string;
  principle: string;
  parameters: PartParam[];
  /** translation applied to the part group when fully exploded */
  explode: Vec3;
  /** local anchor used for the screen-space callout */
  anchor: Vec3;
  accent: string;
  /** show a callout by default (before any interaction) */
  keyLabel?: boolean;
  note?: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'frame', name: 'Frame & Support', en: 'FRAME', accent: '#648BFF' },
  { id: 'furnace', name: 'Furnace System', en: 'FURNACE', accent: '#FF9B52' },
  { id: 'reactor', name: 'Reactor & Sample', en: 'REACTOR', accent: '#36D9E8' },
  { id: 'gas', name: 'Gas Delivery', en: 'GAS DELIVERY', accent: '#42E4A0' },
  { id: 'vacuum', name: 'Vacuum & Exhaust', en: 'VACUUM', accent: '#8F7BFF' },
  { id: 'control', name: 'Control & Sensors', en: 'CONTROL', accent: '#E7C15A' },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryInfo> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<CategoryId, CategoryInfo>,
);

export const PARTS: CVDPartConfig[] = [
  /* ------------------------------- FRAME ------------------------------- */
  {
    id: 'base-frame',
    code: 'FR-01',
    name: 'Bench & Frame',
    en: 'Rack & Optical Bench',
    category: 'frame',
    spec: '1500 × 800 mm',
    short: 'Bench & Frame',
    summary:
      'Aluminium-profile frame and levelling bench that provides a single horizontal datum for the furnace, gas panel, vacuum group and control cabinet.',
    principle:
      'Profile beams and four levelling feet form a rigid platform; the open base isolates the deck from floor vibration. The T-slot deck accepts the furnace pedestals, cylinder rack and cable trays without drilling.',
    parameters: [
      { key: 'Deck size', value: '1500 × 800 mm (schematic)' },
      { key: 'Deck height', value: '≈ 850 mm (schematic)' },
      { key: 'Material', value: '6061 aluminium profile, anodised' },
      { key: 'Levelling travel', value: '± 15 mm' },
      { key: 'Load capacity', value: '≥ 300 kg' },
      { key: 'Deck flatness', value: '≤ 0.5 mm / m' },
    ],
    explode: [0, 0, -1.35],
    anchor: [-6.4, 3.2, 0.1],
    accent: '#648BFF',
    note: 'Dimensions follow the teaching scale; select a real bench for the actual furnace mass and room height.',
  },
  {
    id: 'furnace-support',
    code: 'FR-02',
    name: 'Furnace Pedestals',
    en: 'Furnace Pedestals',
    category: 'frame',
    spec: 'H 130 mm × 2',
    short: 'Furnace Pedestals',
    summary:
      'Two insulated pedestals that raise the furnace to the tube axis and allow free axial expansion when the body heats up.',
    principle:
      'Ceramic-fibre pads and a sliding guide sit between the pedestal and the shell, so thermal growth can slip along X instead of loading the quartz tube.',
    parameters: [
      { key: 'Support height', value: '130 mm (schematic)' },
      { key: 'Quantity', value: '2 sets' },
      { key: 'Material', value: '304 stainless + alumina pad' },
      { key: 'Coaxiality', value: '≤ 0.1 mm' },
      { key: 'Thermal break', value: 'Ceramic-fibre gasket' },
    ],
    explode: [0, 0, -0.85],
    anchor: [-2.4, 0.62, 0.78],
    accent: '#648BFF',
  },

  /* ------------------------------ FURNACE ------------------------------ */
  {
    id: 'shell-upper',
    code: 'FU-01',
    name: 'Furnace Shell · Upper',
    en: 'Split Shell — Upper',
    category: 'furnace',
    spec: '660 × 340 × 160 mm',
    short: 'Upper Shell',
    summary:
      'Hinged, double-wall air-cooled upper shell with a quartz view port and a full ceramic-fibre insulation package underneath.',
    principle:
      'An air gap between the steel skin and the insulation keeps the outer surface cool. The lid lifts on a rear hinge so the tube, boats and heating elements can be serviced without moving the bench.',
    parameters: [
      { key: 'Half-shell size', value: '660 × 340 × 160 mm (schematic)' },
      { key: 'Shell material', value: 'Cold-rolled steel, powder coated' },
      { key: 'External rise', value: '≤ 40 K (schematic)' },
      { key: 'Opening', value: 'Rear hinge, lift-up lid' },
      { key: 'View port', value: 'Φ70 mm quartz window' },
      { key: 'Finish', value: 'High-temperature matte grey' },
    ],
    explode: [0, 0, 5.8],
    anchor: [1.7, 0, 4.46],
    accent: '#FF9B52',
    keyLabel: true,
    note: 'Modelled after a 1200 °C split tube furnace; real shell construction varies by model.',
  },
  {
    id: 'shell-lower',
    code: 'FU-02',
    name: 'Furnace Shell · Lower',
    en: 'Split Shell — Lower',
    category: 'furnace',
    spec: '660 × 340 × 160 mm',
    short: 'Lower Shell',
    summary:
      'Load-bearing lower shell with terminal box, grounding stud and rating plate; it carries the insulation and heating assembly.',
    principle:
      'The shell sits on the insulated pedestals and fixes the lower insulation half. Cable glands and a routing slot bring the heating and thermocouple leads out to the power controller.',
    parameters: [
      { key: 'Half-shell size', value: '660 × 340 × 160 mm (schematic)' },
      { key: 'Sheet thickness', value: '1.5 mm (schematic)' },
      { key: 'Protection', value: 'IP20 (schematic)' },
      { key: 'Grounding', value: 'M6 stud' },
      { key: 'Leads', value: '3 heating + 1 thermocouple' },
    ],
    explode: [0, 0, -1.3],
    anchor: [-1.7, 1.25, 1.36],
    accent: '#FF9B52',
  },
  {
    id: 'insulation-upper',
    code: 'FU-03',
    name: 'Thermal Insulation · Upper',
    en: 'Insulation — Upper',
    category: 'furnace',
    spec: 'Al₂O₃ fibre · 32 mm',
    short: 'Insulation · Upper',
    summary:
      'Vacuum-formed alumina-fibre insulation in three segments, enclosing the upper half of the heated chamber.',
    principle:
      'Low-conductivity fibre keeps the Joule heat inside the chamber. Segmenting the shell relieves thermal stress and lets a single element be replaced without rebuilding the whole hot zone.',
    parameters: [
      { key: 'Thickness', value: '32 mm (schematic)' },
      { key: 'Material', value: '1260-grade polycrystalline alumina fibre' },
      { key: 'Max service temp.', value: '1400 °C (material grade)' },
      { key: 'Conductivity', value: '≈ 0.12 W/(m·K) @ 800 °C' },
      { key: 'Construction', value: '3 stacked segments' },
    ],
    explode: [0, 0, 2.6],
    anchor: [-0.2, 0, 4.2],
    accent: '#FF9B52',
  },
  {
    id: 'insulation-lower',
    code: 'FU-04',
    name: 'Thermal Insulation · Lower',
    en: 'Insulation — Lower',
    category: 'furnace',
    spec: 'Al₂O₃ fibre · 32 mm',
    short: 'Insulation · Lower',
    summary:
      'Lower insulation half that supports the winding and shields the steel shell, terminal box and bench from radiant heat.',
    principle:
      'Closing the upper half forms the cylindrical hot chamber. The split line leaves a channel for the quartz tube and end heat shields limit axial heat loss.',
    parameters: [
      { key: 'Thickness', value: '32 mm (schematic)' },
      { key: 'Material', value: '1260-grade polycrystalline alumina fibre' },
      { key: 'Chamber bore', value: 'Φ 204 mm (schematic)' },
      { key: 'End detail', value: 'Heat shield + tube notch' },
    ],
    explode: [0, 0, -0.75],
    anchor: [1.4, 0, 1.72],
    accent: '#FF9B52',
  },
  {
    id: 'heating-coil',
    code: 'FU-05',
    name: 'Three-Zone Heating Elements',
    en: 'Three-Zone Heating Elements',
    category: 'furnace',
    spec: '3 zones · 1200 °C',
    short: 'Heating Elements',
    summary:
      'Three independently controlled FeCrAl resistance windings, helically wound around the tube to produce a programmable temperature profile.',
    principle:
      'Joule heating in the wire is transferred to the quartz tube by radiation and convection. Each zone closes its own K-type thermocouple loop, enabling ramp, soak and cool segments for 2D-material growth.',
    parameters: [
      { key: 'Zones', value: '3, independently controlled' },
      { key: 'Element', value: '0Cr27Al7Mo2 FeCrAl alloy' },
      { key: 'Max furnace temp.', value: '1200 °C (schematic)' },
      { key: 'Control accuracy', value: '± 1 °C (schematic)' },
      { key: 'Ramp rate', value: '≤ 20 °C/min (schematic)' },
      { key: 'Sensing', value: 'K-type sheathed thermocouple' },
    ],
    explode: [0, 5.4, 0.8],
    anchor: [-2.45, 0, 2.72],
    accent: '#FF9B52',
    keyLabel: true,
    note: 'The usable limit depends on the tube, flange seals and insulation; values shown are illustrative only.',
  },

  /* ------------------------------ REACTOR ------------------------------ */
  {
    id: 'quartz-tube',
    code: 'RC-01',
    name: 'Quartz Reaction Tube',
    en: 'Quartz Reaction Tube',
    category: 'reactor',
    spec: 'Φ60 × 1100 mm',
    short: 'Quartz Tube',
    summary:
      'High-purity fused-quartz tube providing a clean, quasi-one-dimensional reaction volume for precursor transport, pyrolysis and 2D nucleation.',
    principle:
      'Carrier gas enters at −X, precursors decompose in the heated zone and react on the substrate; unreacted species and by-products leave at +X. The tube runs at atmospheric pressure or under rough vacuum (LPCVD).',
    parameters: [
      { key: 'Length', value: '1100 mm (schematic)' },
      { key: 'OD / ID', value: 'Φ60 / Φ53 mm (schematic)' },
      { key: 'Material', value: 'Fused quartz, SiO₂ ≥ 99.99 %' },
      { key: 'Max service temp.', value: '1200 °C (short term)' },
      { key: 'Sealing', value: 'O-ring + bolted flange' },
      { key: 'Atmosphere', value: 'Ar / H₂ / CH₄, etc.' },
    ],
    explode: [0, 7.6, 1.4],
    anchor: [4.35, 0, 3.42],
    accent: '#36D9E8',
    keyLabel: true,
    note: 'Above ~1100 °C quartz softens and devitrifies; ramp rate and peak temperature must be limited in practice.',
  },
  {
    id: 'flange-inlet',
    code: 'RC-02',
    name: 'Inlet Flange Assembly',
    en: 'Inlet Flange',
    category: 'reactor',
    spec: 'Φ85 mm · 8 × M6',
    short: 'Inlet Flange',
    summary:
      'Stainless inlet flange with O-ring seal, clamping bolts and gas inlet port; it is the interface between gas panel and reaction chamber.',
    principle:
      'Evenly torqued bolts compress a fluoroelastomer O-ring for a demountable seal. The central port connects the mixing manifold; the side port feeds the thermocouple into the tube.',
    parameters: [
      { key: 'Flange OD', value: 'Φ85 mm (schematic)' },
      { key: 'Seal', value: 'FKM O-ring (FFKM optional)' },
      { key: 'Bolting', value: '8 × M6 on a pitch circle' },
      { key: 'Port', value: 'Swagelok 1/4″' },
      { key: 'Leak rate', value: '< 1 × 10⁻⁹ Pa·m³/s (schematic)' },
    ],
    explode: [-2.9, 0, 0],
    anchor: [-5.56, 0, 3.26],
    accent: '#36D9E8',
  },
  {
    id: 'flange-outlet',
    code: 'RC-03',
    name: 'Outlet Flange & Isolation Valve',
    en: 'Outlet Flange & Valve',
    category: 'reactor',
    spec: 'KF25 · angle valve',
    short: 'Outlet Flange',
    summary:
      'Exhaust-end flange carrying the isolation valve, pressure take-off and vacuum connection.',
    principle:
      'Process gas leaves the chamber through this flange. The isolation valve separates the tube from the pump group during tube exchange or shutdown, while the take-off port feeds the vacuum gauge.',
    parameters: [
      { key: 'Flange OD', value: 'Φ85 mm (schematic)' },
      { key: 'Valve', value: 'Manual / pneumatic angle valve (schematic)' },
      { key: 'Ports', value: 'KF25 + 1/4″' },
      { key: 'Pressure tap', value: '1/8″ NPT' },
      { key: 'Seal', value: 'FKM O-ring' },
    ],
    explode: [1.2, 0, 0.7],
    anchor: [5.56, 0, 3.26],
    accent: '#36D9E8',
  },
  {
    id: 'sample-boat',
    code: 'RC-04',
    name: 'Substrate Boat',
    en: 'Substrate Boat',
    category: 'reactor',
    spec: '150 × 46 × 9 mm',
    short: 'Substrate Boat',
    summary:
      'Quartz or alumina boat that positions the substrate at the centre of the constant-temperature zone.',
    principle:
      'The boat rests low in the tube where the flow is fully developed. A push rod (not shown) allows the sample to be repositioned inside the hot zone without breaking the seal.',
    parameters: [
      { key: 'Size', value: '150 × 46 × 9 mm (schematic)' },
      { key: 'Material', value: 'Fused quartz / alumina' },
      { key: 'Sample area', value: '40 × 34 mm' },
      { key: 'Push rod', value: 'Φ6 mm quartz rod' },
      { key: 'Positioning', value: 'Hot-zone centre ± 10 mm' },
    ],
    explode: [0.1, 7.6, 2.9],
    anchor: [0.4, 0.18, 2.56],
    accent: '#36D9E8',
    keyLabel: true,
  },
  {
    id: 'substrate',
    code: 'RC-05',
    name: '2D Material Substrate',
    en: '2D Material Substrate',
    category: 'reactor',
    spec: 'Si / SiO₂ · 10 × 10 mm',
    short: '2D Substrate',
    summary:
      'Si/SiO₂ wafer and the growing 2D film (schematic) — the interface where gas-phase species adsorb, nucleate and coalesce.',
    principle:
      'Precursor species adsorb on the hot surface, migrate, nucleate and grow laterally into graphene, h-BN or transition-metal dichalcogenide domains. Surface preparation and supersaturation control the domain density.',
    parameters: [
      { key: 'Substrate', value: 'Si + 300 nm SiO₂ (schematic)' },
      { key: 'Size', value: '10 × 10 mm' },
      { key: 'Target material', value: 'Graphene / MoS₂ / h-BN' },
      { key: 'Growth temp.', value: '600 – 1050 °C (schematic)' },
      { key: 'Carrier gas', value: 'Ar / H₂' },
    ],
    explode: [0.25, 7.6, 4.0],
    anchor: [0.4, 0.3, 2.6],
    accent: '#36D9E8',
    note: 'The film is rendered schematically and is not drawn to the true lattice scale.',
  },
  {
    id: 'precursor-boat',
    code: 'RC-06',
    name: 'Precursor Boat',
    en: 'Precursor Boat',
    category: 'reactor',
    spec: 'Quartz · upstream zone',
    short: 'Precursor Boat',
    summary:
      'Source boat holding a solid or powder precursor (sulphur, metal-oxide source) in the cooler upstream zone.',
    principle:
      'Source temperature sets the precursor vapour pressure. The carrier gas transports the vapour downstream to the hot substrate, the basis of LPCVD and vapour-transport growth.',
    parameters: [
      { key: 'Location', value: 'Upstream cool zone (schematic)' },
      { key: 'Material', value: 'Quartz / alumina' },
      { key: 'Charge', value: '50 – 500 mg (schematic)' },
      { key: 'Source temp.', value: '80 – 300 °C (schematic)' },
      { key: 'Typical sources', value: 'S, MoO₃, NH₄Cl, etc.' },
    ],
    explode: [-0.2, 7.6, 2.9],
    anchor: [-2.0, 0.18, 2.56],
    accent: '#36D9E8',
  },

  /* -------------------------------- GAS -------------------------------- */
  {
    id: 'gas-bottles',
    code: 'GS-01',
    name: 'Gas Cylinder Bank',
    en: 'Gas Cylinder Bank',
    category: 'gas',
    spec: 'Ar / CH₄ / H₂',
    short: 'Gas Cylinders',
    summary:
      'Three high-purity supplies — Ar carrier, CH₄ carbon source and H₂ reduction gas — with two-stage regulators and output gauges.',
    principle:
      'Each regulator drops cylinder pressure to the line pressure required by the MFC. Colour-coded pigtails and a common header rail prevent cross-connection and let the bank be purged as one volume.',
    parameters: [
      { key: 'Supplies', value: 'Ar 99.999 % / CH₄ mix / H₂ 99.999 %' },
      { key: 'Cylinder', value: '40 L (schematic)' },
      { key: 'Outlet pressure', value: '0.2 – 0.4 MPa (schematic)' },
      { key: 'Regulator', value: 'Two-stage stainless' },
      { key: 'Coding', value: 'Grey / green / red' },
    ],
    explode: [-1.9, 0, 0],
    anchor: [-5.5, -3.3, 4.7],
    accent: '#42E4A0',
    note: 'H₂ is flammable: real installations require flashback arrestors, gas detection and forced ventilation.',
  },
  {
    id: 'mfc',
    code: 'GS-02',
    name: 'Mass Flow Controller Bank',
    en: 'Mass Flow Controllers',
    category: 'gas',
    spec: '3 ch · ±1 % F.S.',
    short: 'MFC Bank',
    summary:
      'Three-channel mass-flow controller rack that meters and closes the loop on each gas independently.',
    principle:
      'A thermal or differential-pressure sensor measures mass flow and drives a proportional valve. Setpoints come from the HMI, so gas ratios can be changed during a run without touching the panel.',
    parameters: [
      { key: 'Channels', value: '3' },
      { key: 'Ranges', value: 'Ar 500 / CH₄ 100 / H₂ 200 sccm (schematic)' },
      { key: 'Accuracy', value: '± 1 % F.S. (schematic)' },
      { key: 'Response', value: '< 2 s (schematic)' },
      { key: 'Communication', value: 'RS-485 / 0 – 5 V' },
      { key: 'Operating ΔP', value: '0.1 – 0.3 MPa' },
    ],
    explode: [0, 0, 2.3],
    anchor: [-1.9, -3.6, 5.4],
    accent: '#42E4A0',
    keyLabel: true,
  },
  {
    id: 'gas-manifold',
    code: 'GS-03',
    name: 'Mixing Manifold & Valves',
    en: 'Mixing Manifold',
    category: 'gas',
    spec: '316L · 1/4″ EP',
    short: 'Mixing Manifold',
    summary:
      'Mixing block and manual isolation valves that combine the three gas legs before the inlet flange.',
    principle:
      'Each leg passes a check valve into a small mixing volume; a static mixer homogenises the blend. The valves allow leg selection, purging and leak checking without dismantling the panel.',
    parameters: [
      { key: 'Material', value: '316L stainless' },
      { key: 'Tubing', value: '1/4″ electropolished (EP)' },
      { key: 'Mixing', value: 'Static mixing volume' },
      { key: 'Valves', value: '3 × manual bellows valve' },
      { key: 'Purge port', value: 'N₂ purge (schematic)' },
    ],
    explode: [-0.9, 1.2, 1.1],
    anchor: [-4.78, -2.4, 4.38],
    accent: '#42E4A0',
  },

  /* ------------------------------- VACUUM ------------------------------- */
  {
    id: 'vacuum-line',
    code: 'VC-01',
    name: 'Vacuum Line & Isolation Valve',
    en: 'Vacuum Line & Valve',
    category: 'vacuum',
    spec: 'KF25 stainless',
    short: 'Vacuum Line',
    summary:
      'Short, large-bore line with an isolation valve connecting the outlet flange to the pump inlet.',
    principle:
      'The isolation valve opens or closes the chamber-to-pump path. Short, wide tubing with KF clamps minimises conductance loss and lets the line be removed for cleaning.',
    parameters: [
      { key: 'Bore', value: 'KF25 / Φ25 mm (schematic)' },
      { key: 'Material', value: '304 stainless' },
      { key: 'Valve', value: 'KF25 manual angle valve' },
      { key: 'Ultimate pressure', value: '< 1 Pa (schematic)' },
      { key: 'Joints', value: 'KF clamp + centring ring' },
    ],
    explode: [0, 0, 1.9],
    anchor: [6.36, -0.7, 2.56],
    accent: '#8F7BFF',
  },
  {
    id: 'vacuum-pump',
    code: 'VC-02',
    name: 'Rotary Vane Pump',
    en: 'Rotary Vane Pump',
    category: 'vacuum',
    spec: '8 m³/h · 0.5 Pa',
    short: 'Rotary Vane Pump',
    summary:
      'Two-stage rotary-vane pump that provides rough vacuum for LPCVD and removes the process exhaust.',
    principle:
      'An eccentric rotor drives sliding vanes that trap and compress gas before discharging it through the exhaust valve. Pump oil seals clearances and lubricates the vanes.',
    parameters: [
      { key: 'Pumping speed', value: '≈ 8 m³/h (schematic)' },
      { key: 'Ultimate pressure', value: '≈ 0.5 Pa (schematic)' },
      { key: 'Motor', value: '0.55 kW (schematic)' },
      { key: 'Oil', value: 'Two-stage rotary-vane oil' },
      { key: 'Inlet', value: 'KF25' },
    ],
    explode: [2.3, 1.9, 0],
    anchor: [5.2, -2.55, 1.18],
    accent: '#8F7BFF',
    keyLabel: true,
    note: 'Corrosive by-products require a cold trap and scrubber, plus scheduled oil changes.',
  },
  {
    id: 'vacuum-gauge',
    code: 'VC-03',
    name: 'Vacuum Gauge & Readout',
    en: 'Vacuum Gauge',
    category: 'vacuum',
    spec: '10⁻³ – 1000 mbar',
    short: 'Vacuum Gauge',
    summary:
      'Capacitance-diaphragm (or Pirani) gauge head and local readout that monitor chamber pressure.',
    principle:
      'Pressure deflects a thin diaphragm and the resulting capacitance change is converted to a pressure reading. The capacitance type is largely gas-species independent in the low-pressure range.',
    parameters: [
      { key: 'Range', value: '1 × 10⁻³ – 1000 mbar (schematic)' },
      { key: 'Accuracy', value: '± 0.2 % of reading (schematic)' },
      { key: 'Flange', value: 'KF16' },
      { key: 'Output', value: 'Local display + 0 – 10 V analogue' },
      { key: 'Location', value: 'Exhaust take-off port' },
    ],
    explode: [0, 1.1, 2.4],
    anchor: [6.45, 0.15, 3.42],
    accent: '#8F7BFF',
  },
  {
    id: 'exhaust-scrubber',
    code: 'VC-04',
    name: 'Exhaust Scrubber',
    en: 'Exhaust Scrubber',
    category: 'vacuum',
    spec: 'Activated carbon',
    short: 'Exhaust Scrubber',
    summary:
      'Scrubbing canister that removes unreacted precursors and hazardous by-products before the exhaust is released.',
    principle:
      'Exhaust flows upward through activated carbon, alumina or chemical absorbents where harmful species are trapped or converted. A quick-release flange allows the media to be replaced.',
    parameters: [
      { key: 'Material', value: '316L stainless' },
      { key: 'Media', value: 'Activated carbon + chemical absorbent (schematic)' },
      { key: 'Ports', value: 'KF25 in / out' },
      { key: 'Service interval', value: 'Process and load dependent' },
      { key: 'Monitoring', value: 'Duct gas alarm (optional)' },
    ],
    explode: [-1.0, 0, 1.6],
    anchor: [6.95, -3.5, 2.15],
    accent: '#8F7BFF',
  },

  /* ------------------------------- CONTROL ------------------------------ */
  {
    id: 'control-cabinet',
    code: 'CT-01',
    name: 'Control & Monitoring Cabinet',
    en: 'Control Cabinet',
    category: 'control',
    spec: '15″ HMI · PID / SCR',
    short: 'Control Cabinet',
    summary:
      'Cabinet housing the temperature programmer, flow readout, vacuum display and safety interlocks.',
    principle:
      'The HMI/PLC executes the recipe, commands heating power and flow setpoints, and logs thermocouple, MFC and gauge signals. Interlocks trip on over-temperature, gas loss or an emergency stop.',
    parameters: [
      { key: 'Display', value: '15″ touchscreen (schematic)' },
      { key: 'Control', value: 'PID + SCR power regulation' },
      { key: 'I/O', value: '3 × temperature / 3 × flow / 1 × pressure' },
      { key: 'Communication', value: 'Modbus RTU / TCP' },
      { key: 'Interlocks', value: 'Over-temp / gas loss / E-stop' },
    ],
    explode: [1.1, 1.9, 0],
    anchor: [5.5, 3.62, 3.1],
    accent: '#E7C15A',
    keyLabel: true,
    note: 'The on-screen interface is a schematic render, not the real control software.',
  },
  {
    id: 'thermocouple',
    code: 'CT-02',
    name: 'K-Type Thermocouple',
    en: 'K-Type Thermocouple',
    category: 'control',
    spec: 'Φ3 mm · 0 – 1200 °C',
    short: 'Thermocouple',
    summary:
      'Sheathed K-type thermocouple inserted into the chamber to provide feedback for the temperature loop.',
    principle:
      'Two dissimilar wires generate a thermoelectric voltage at the hot junction that is proportional to the temperature difference. Cold-junction compensation converts it to a temperature reading.',
    parameters: [
      { key: 'Type', value: 'K (NiCr–NiSi)' },
      { key: 'Sheath', value: 'Φ3 mm (schematic)' },
      { key: 'Range', value: '0 – 1200 °C' },
      { key: 'Accuracy', value: '± 0.4 % of reading (schematic)' },
      { key: 'Mounting', value: 'Side port, inlet end' },
    ],
    explode: [-4.7, -2.2, 0.9],
    anchor: [-6.1, 0.4, 3.1],
    accent: '#E7C15A',
  },
  {
    id: 'power-controller',
    code: 'CT-03',
    name: 'SCR Power Controller',
    en: 'SCR Power Controller',
    category: 'control',
    spec: '25 A · 220 V AC',
    short: 'SCR Controller',
    summary:
      'Silicon-controlled-rectifier power stage and heat sink that convert control signals into the element current.',
    principle:
      'Phase-angle or zero-cross firing varies the thyristor conduction angle, giving continuous power control. Driven by the PID output, it reproduces the programmed ramp profile.',
    parameters: [
      { key: 'Rated current', value: '25 A (schematic)' },
      { key: 'Input', value: 'Single-phase 220 V AC' },
      { key: 'Output', value: '0 – 220 V variable' },
      { key: 'Control signal', value: '4 – 20 mA / 0 – 10 V' },
      { key: 'Protection', value: 'Over-current / over-temp / phase loss' },
    ],
    explode: [-1.1, 1.9, 0],
    anchor: [-3.5, 2.95, 1.05],
    accent: '#E7C15A',
  },
];

export const PARTS_BY_ID: Record<string, CVDPartConfig> = PARTS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<string, CVDPartConfig>,
);

export const PART_LABELS = PARTS.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
}));

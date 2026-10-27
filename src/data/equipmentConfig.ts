/**
 * equipmentConfig.ts — single source of truth for the CVD rig layout.
 *
 * Coordinate convention (enforced across every builder):
 *   +X  : reaction tube axis (inlet at -X, exhaust at +X)
 *   +Y  : bench depth (gas panel / pump at -Y, operator side at +Y)
 *   +Z  : height (bench top deck = 0)
 *   1 unit = 100 mm
 *
 * Dimensions are teaching-schematic values, not a real product spec.
 */

export const MODEL = {
  /** bench / optical table */
  base: { width: 15, depth: 8, thickness: 0.32, legHeight: 1.5 },

  /** quartz reaction tube */
  tube: { length: 11, outerRadius: 0.6, innerRadius: 0.53, z: 2.9 },

  /** split tube furnace */
  furnace: { length: 6.6, depth: 3.4, height: 3.2, z: 2.9, wall: 0.14 },

  /** ceramic-fibre insulation half shells */
  insulation: { outerRadius: 1.34, innerRadius: 1.02, length: 5.9 },

  /** three-zone resistance winding */
  coil: { radius: 0.93, wireRadius: 0.04, length: 5.4, turns: 5.4, zones: 3 },

  /** sample / precursor boats sit on the tube floor */
  boat: { floorZ: 2.36, sampleX: 0.4, precursorX: -2.0 },

  /** side assemblies */
  gas: {
    bottles: [-6.4, -5.5, -4.6],
    bottleY: -3.3,
    bottleRadius: 0.45,
    bottleHeight: 5.4,
    panel: { x: -1.9, y: -3.62, z: 5.0, width: 2.3, height: 1.0 },
  },
  vacuum: {
    pump: { x: 5.2, y: -2.55, z: 0.62 },
    scrubber: { x: 6.95, y: -3.5 },
  },
  control: {
    cabinet: { x: 5.5, y: 2.9, width: 2.4, depth: 1.4, height: 3.4 },
    scr: { x: -3.5, y: 2.8 },
  },
} as const;

export type Vec3 = [number, number, number];

/**
 * Shared gas-routing curves. Both the tubing geometry and the flowing
 * particle animation read from here so they can never drift apart.
 */
export const ROUTES: Record<string, Vec3[]> = {
  /** bottled precursor → MFC bank */
  bottlesToMfc: [
    [-6.4, -3.3, 5.66],
    [-6.4, -3.72, 5.88],
    [-5.4, -3.86, 5.9],
    [-3.5, -3.8, 5.9],
    [-2.9, -3.7, 5.32],
    [-2.72, -3.62, 4.78],
  ],
  /** MFC outlets → mixing manifold */
  mfcToManifoldA: [
    [-2.72, -3.6, 4.78],
    [-2.9, -3.2, 4.62],
    [-4.1, -2.85, 4.42],
    [-4.72, -2.5, 4.32],
  ],
  mfcToManifoldB: [
    [-1.95, -3.6, 4.78],
    [-2.2, -3.15, 4.55],
    [-3.9, -2.8, 4.38],
    [-4.68, -2.48, 4.32],
  ],
  mfcToManifoldC: [
    [-1.18, -3.6, 4.78],
    [-1.5, -3.05, 4.5],
    [-3.7, -2.75, 4.34],
    [-4.64, -2.46, 4.32],
  ],
  /** manifold → quartz tube inlet flange */
  manifoldToInlet: [
    [-4.74, -2.46, 4.32],
    [-5.3, -2.3, 4.08],
    [-6.05, -1.55, 3.62],
    [-6.26, -0.65, 3.15],
    [-6.26, 0, 2.94],
    [-5.56, 0, 2.9],
  ],
  /** outlet flange → vacuum pump inlet */
  outletToPump: [
    [5.62, 0, 2.9],
    [6.42, 0, 2.88],
    [6.86, -0.75, 2.5],
    [6.86, -1.75, 1.85],
    [6.4, -2.35, 1.5],
    [5.7, -2.55, 1.42],
    [5.5, -2.55, 1.28],
  ],
  /** pump exhaust → scrubber canister */
  pumpToScrubber: [
    [6.06, -2.9, 0.72],
    [6.48, -3.14, 0.84],
    [6.6, -3.36, 1.05],
    [6.55, -3.5, 1.28],
    [6.36, -3.5, 1.35],
  ],
};

export interface ViewPreset {
  position: Vec3;
  target: Vec3;
  fov?: number;
}

export const VIEWS: Record<string, ViewPreset> = {
  iso: { position: [15.2, 16.4, 14.2], target: [0, 0.2, 2.35] },
  front: { position: [0.4, 23.5, 3.5], target: [0, 0.2, 2.4] },
  side: { position: [23.4, 0.6, 3.3], target: [0, 0.2, 2.4] },
  top: { position: [0.4, 0.9, 24.5], target: [0, -0.2, 2.2] },
  gas: { position: [-14.5, -12.5, 14.2], target: [-3.4, -0.4, 2.9] },
  vacuum: { position: [13.8, -13.5, 12.6], target: [3.9, -0.6, 2.2] },
  interior: { position: [-9.6, 1.15, 3.35], target: [-0.6, 0.1, 2.85], fov: 42 },
  reset: { position: [15.2, 16.4, 14.2], target: [0, 0.2, 2.35] },
} as const;

/** approximate thermal palette used by the scene + UI */
export const THERMAL = {
  idle: '#ff7a2f',
  hot: '#ffb15e',
  cool: '#36d9e8',
} as const;

/**
 * Materials.ts — a shared palette of physically-based materials.
 *
 * PartRegistry clones each material per part, so a single prototype can
 * safely be shared by dozens of meshes while still allowing per-part
 * emissive highlighting.
 */

import * as THREE from 'three';

const std = (params: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(params);

export const MAT = {
  /* ---- structure ---- */
  bench: std({ color: 0x1b2532, metalness: 0.62, roughness: 0.55 }),
  benchEdge: std({ color: 0x2b3949, metalness: 0.8, roughness: 0.4 }),
  frame: std({ color: 0x33404f, metalness: 0.82, roughness: 0.36 }),
  frameDark: std({ color: 0x1c242f, metalness: 0.72, roughness: 0.52 }),
  panel: std({ color: 0x2b3542, metalness: 0.68, roughness: 0.46 }),
  panelDark: std({ color: 0x151c25, metalness: 0.65, roughness: 0.55 }),
  shell: std({ color: 0x3b4553, metalness: 0.72, roughness: 0.42 }),
  shellDark: std({ color: 0x242d39, metalness: 0.78, roughness: 0.46 }),

  /* ---- machined metal ---- */
  steel: std({ color: 0xa6b2c1, metalness: 0.96, roughness: 0.26 }),
  steelDark: std({ color: 0x69737f, metalness: 0.92, roughness: 0.38 }),
  steelWarm: std({ color: 0x8b8f96, metalness: 0.9, roughness: 0.34 }),
  brass: std({ color: 0xc9a35f, metalness: 1, roughness: 0.3 }),
  copper: std({ color: 0xb06a3b, metalness: 1, roughness: 0.32 }),
  chrome: std({ color: 0xd6dde6, metalness: 1, roughness: 0.14 }),

  /* ---- non-metal ---- */
  ceramic: std({ color: 0xd8d2c4, roughness: 0.94, metalness: 0.04 }),
  ceramicIns: std({ color: 0xcfc7b6, roughness: 0.98, metalness: 0.02 }),
  ceramicWhite: std({ color: 0xe6e0d3, roughness: 0.9, metalness: 0.03 }),
  rubber: std({ color: 0x12171d, roughness: 0.96, metalness: 0.02 }),
  plastic: std({ color: 0x1d242e, roughness: 0.62, metalness: 0.12 }),
  plasticLight: std({ color: 0x39424e, roughness: 0.55, metalness: 0.1 }),
  cable: std({ color: 0x0f141a, roughness: 0.9, metalness: 0.05 }),
  pumpOil: std({ color: 0x6d3f1d, roughness: 0.25, metalness: 0.1 }),

  /* ---- gases / labels ---- */
  gasAr: std({ color: 0x8f9fb2, metalness: 0.65, roughness: 0.42 }),
  gasCH4: std({ color: 0x2f8f5b, metalness: 0.55, roughness: 0.46 }),
  gasH2: std({ color: 0xa8403c, metalness: 0.55, roughness: 0.46 }),
  gasArLine: std({ color: 0x9aabbd, metalness: 0.3, roughness: 0.5, emissive: 0x1a2b3a, emissiveIntensity: 0.4 }),
  gasCH4Line: std({ color: 0x39d98a, metalness: 0.3, roughness: 0.5, emissive: 0x0c3a24, emissiveIntensity: 0.6 }),
  gasH2Line: std({ color: 0x5b8dff, metalness: 0.3, roughness: 0.5, emissive: 0x122b52, emissiveIntensity: 0.6 }),
  mixedLine: std({ color: 0x7fd6e2, metalness: 0.35, roughness: 0.45, emissive: 0x0d3a44, emissiveIntensity: 0.7 }),

  /* ---- glass ---- */
  quartz: new THREE.MeshPhysicalMaterial({
    color: 0xa9dcec,
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.19,
    side: THREE.DoubleSide,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: new THREE.Color(0x0a3d4d),
    emissiveIntensity: 0.12,
  }),
  quartzFaint: new THREE.MeshPhysicalMaterial({
    color: 0xcbeaf4,
    metalness: 0,
    roughness: 0.1,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
    emissive: new THREE.Color(0x0a3d4d),
    emissiveIntensity: 0.1,
  }),
  glassDark: new THREE.MeshStandardMaterial({
    color: 0x0a1622,
    metalness: 0.4,
    roughness: 0.12,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),

  /* ---- thermal ---- */
  hotWire: new THREE.MeshStandardMaterial({
    color: 0x8a3d1c,
    metalness: 0.55,
    roughness: 0.55,
    emissive: new THREE.Color(0xff5a12),
    emissiveIntensity: 1.25,
  }),
  hotCore: new THREE.MeshStandardMaterial({
    color: 0xffb070,
    metalness: 0.2,
    roughness: 0.6,
    emissive: new THREE.Color(0xffa24a),
    emissiveIntensity: 1.9,
  }),
  hotGlow: new THREE.MeshBasicMaterial({
    color: 0xff8a3a,
    transparent: true,
    opacity: 0.09,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),

  /* ---- wafer & film ---- */
  wafer: new THREE.MeshPhysicalMaterial({
    color: 0x33404f,
    metalness: 0.92,
    roughness: 0.12,
    clearcoat: 1,
  }),
  film: new THREE.MeshPhysicalMaterial({
    color: 0x2a1b4d,
    metalness: 0.55,
    roughness: 0.18,
    iridescence: 1,
    iridescenceIOR: 1.9,
    iridescenceThicknessRange: [120, 520],
    emissive: new THREE.Color(0x2a0a4a),
    emissiveIntensity: 0.32,
  }),
  powder: std({ color: 0xd6b54a, roughness: 0.75, metalness: 0.25 }),

  /* ---- screens & indicators ---- */
  screenBlack: new THREE.MeshBasicMaterial({ color: 0x04090f }),
  ledCyan: new THREE.MeshBasicMaterial({ color: 0x6ff6ff }),
  ledGreen: new THREE.MeshBasicMaterial({ color: 0x4dffa8 }),
  ledAmber: new THREE.MeshBasicMaterial({ color: 0xffb347 }),
  ledRed: new THREE.MeshBasicMaterial({ color: 0xff5a6e }),
  emissiveCyan: new THREE.MeshStandardMaterial({
    color: 0x36d9e8,
    emissive: new THREE.Color(0x36d9e8),
    emissiveIntensity: 1.6,
    roughness: 0.4,
    metalness: 0.2,
  }),

  /* ---- gas cylinders ---- */
  bottleAr: std({ color: 0x93a2b4, metalness: 0.72, roughness: 0.35 }),
  bottleCH4: std({ color: 0x2f8f5b, metalness: 0.6, roughness: 0.4 }),
  bottleH2: std({ color: 0xa8403c, metalness: 0.6, roughness: 0.4 }),
  bottleTop: std({ color: 0x6f7885, metalness: 0.85, roughness: 0.32 }),
  bottleCap: std({ color: 0x1b222b, metalness: 0.5, roughness: 0.6 }),
} as const;

/** dispose helper used when tearing a scene down */
export function disposeMaterial(material: THREE.Material): void {
  const anyMat = material as THREE.Material & { map?: THREE.Texture | null };
  anyMat.map?.dispose();
  material.dispose();
}

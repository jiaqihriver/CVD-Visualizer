/**
 * FurnaceBuilder.ts — split shell, ceramic insulation, three-zone winding.
 */

import * as THREE from 'three';
import { MODEL } from '../data/equipmentConfig';
import { MAT } from './Materials';
import {
  cylX,
  cylZ,
  halfDiscGeometry,
  halfTubeGeometry,
  makeTextPlane,
  roundedBox,
} from './GeometryFactory';

const FURN = MODEL.furnace;
const INS = MODEL.insulation;
const COIL = MODEL.coil;
const SPLIT = FURN.z;

function partGroup(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = id;
  return g;
}

function faceFront(mesh: THREE.Object3D): void {
  mesh.rotation.set(-Math.PI / 2, 0, Math.PI);
}

/* ------------------------------------------------------------------ */
/* shells                                                              */
/* ------------------------------------------------------------------ */

export function buildShellUpper(): THREE.Group {
  const g = partGroup('shell-upper');
  const h = FURN.height / 2;

  const body = new THREE.Mesh(roundedBox(FURN.length, FURN.depth, h, 0.2, 0.035), MAT.shell);
  body.position.set(0, 0, SPLIT + h / 2);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  /* front raised panel */
  const panel = new THREE.Mesh(roundedBox(5.4, 0.05, 1.18, 0.06, 0.012), MAT.shellDark);
  panel.position.set(0, FURN.depth / 2 + 0.02, SPLIT + h / 2 + 0.06);
  g.add(panel);

  /* top lid plate */
  const lid = new THREE.Mesh(roundedBox(6.1, 2.9, 0.04, 0.08, 0.01), MAT.shellDark);
  lid.position.set(0, 0, SPLIT + h + 0.025);
  g.add(lid);

  /* ---- observation window ---- */
  const wy = FURN.depth / 2 + 0.055;
  const wz = SPLIT + h / 2 + 0.16;
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 10, 32), MAT.chrome);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.set(0.85, wy, wz);
  g.add(bezel);

  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.235, 32), MAT.glassDark);
  glass.position.set(0.85, wy + 0.005, wz);
  faceFront(glass);
  g.add(glass);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.19, 28),
    new THREE.MeshBasicMaterial({ color: 0xff8636, transparent: true, opacity: 0.55, toneMapped: false }),
  );
  glow.position.set(0.85, wy - 0.035, wz);
  faceFront(glow);
  g.add(glow);

  /* ---- handle ---- */
  const handleMat = MAT.chrome;
  for (const sx of [-0.42, 0.42]) {
    const post = new THREE.Mesh(cylZ(0.035, 0.035, 0.2, 10), handleMat);
    post.position.set(sx, FURN.depth / 2 + 0.05, SPLIT + h + 0.1);
    g.add(post);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.05, 12), handleMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, FURN.depth / 2 + 0.05, SPLIT + h + 0.21);
  g.add(bar);

  /* ---- hinges on the rear edge ---- */
  for (const sx of [-1.7, 1.7]) {
    const hinge = new THREE.Mesh(cylX(0.075, 0.075, 0.55, 14), MAT.steelDark);
    hinge.position.set(sx, -FURN.depth / 2 - 0.02, SPLIT + h - 0.08);
    g.add(hinge);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.07), MAT.steelDark);
    arm.position.set(sx, -FURN.depth / 2 - 0.08, SPLIT + h - 0.02);
    g.add(arm);
  }

  /* ---- side ventilation slots ---- */
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.42), MAT.frameDark);
      slot.position.set(
        sx * (FURN.length / 2 + 0.005),
        -0.9 + i * 0.45,
        SPLIT + h / 2 + 0.12,
      );
      g.add(slot);
    }
  }

  /* ---- badge + status LED ---- */
  const badge = makeTextPlane('CVD-1200', 1.15, {
    color: '#a8f0fb',
    weight: 600,
    px: 512,
    py: 128,
    glow: '#36d9e8',
  });
  badge.position.set(-2.05, FURN.depth / 2 + 0.05, SPLIT + h / 2 + 0.04);
  faceFront(badge);
  g.add(badge);

  const led = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.035), MAT.ledCyan);
  led.position.set(-2.55, FURN.depth / 2 + 0.05, SPLIT + h / 2 - 0.18);
  g.add(led);

  /* corner bolts */
  const boltGeo = cylX(0.035, 0.035, 0.06, 8);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const b = new THREE.Mesh(boltGeo, MAT.steelDark);
      b.position.set(sx * 2.85, sy * 1.45, SPLIT + h + 0.04);
      g.add(b);
    }
  }

  return g;
}

export function buildShellLower(): THREE.Group {
  const g = partGroup('shell-lower');
  const h = FURN.height / 2;

  const body = new THREE.Mesh(roundedBox(FURN.length, FURN.depth, h, 0.2, 0.035), MAT.shell);
  body.position.set(0, 0, SPLIT - h / 2);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  /* split lip */
  const lip = new THREE.Mesh(roundedBox(FURN.length + 0.08, FURN.depth + 0.08, 0.05, 0.22, 0.01), MAT.shellDark);
  lip.position.set(0, 0, SPLIT - 0.03);
  g.add(lip);

  /* front panel + nameplate */
  const panel = new THREE.Mesh(roundedBox(5.4, 0.05, 0.9, 0.06, 0.012), MAT.shellDark);
  panel.position.set(0, FURN.depth / 2 + 0.02, SPLIT - h / 2 - 0.02);
  g.add(panel);

  const plate = makeTextPlane('SPLIT TUBE FURNACE  ·  3 ZONE', 2.45, {
    color: '#8b98a8',
    weight: 500,
    px: 512,
    py: 96,
    glow: 'rgba(0,0,0,0)',
  });
  plate.position.set(1.0, FURN.depth / 2 + 0.05, SPLIT - h / 2 + 0.02);
  faceFront(plate);
  g.add(plate);

  /* terminal box on the rear face */
  const terminal = new THREE.Mesh(roundedBox(1.0, 0.26, 0.72, 0.05, 0.015), MAT.panelDark);
  terminal.position.set(-2.05, -FURN.depth / 2 - 0.14, SPLIT - h / 2 + 0.05);
  g.add(terminal);

  const glandGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10);
  for (let i = 0; i < 3; i++) {
    const gland = new THREE.Mesh(glandGeo, MAT.brass);
    gland.position.set(-2.4 + i * 0.35, -FURN.depth / 2 - 0.25, SPLIT - h / 2 + 0.05);
    g.add(gland);
  }

  /* vents */
  for (let i = 0; i < 6; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.06), MAT.frameDark);
    vent.position.set(-2.15 + i * 0.16, FURN.depth / 2 + 0.04, SPLIT - h / 2 - 0.3);
    g.add(vent);
  }

  /* feet */
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const foot = new THREE.Mesh(cylZ(0.09, 0.11, 0.1, 12), MAT.frameDark);
      foot.position.set(sx * 2.8, sy * 1.35, SPLIT - h + 0.02);
      g.add(foot);
    }
  }

  /* grounding stud + cable */
  const stud = new THREE.Mesh(cylX(0.03, 0.03, 0.16, 8), MAT.brass);
  stud.position.set(3.34, -1.1, SPLIT - h / 2);
  g.add(stud);
  const ground = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 16), MAT.gasCH4Line);
  ground.position.set(3.44, -1.1, SPLIT - h / 2);
  ground.rotation.y = Math.PI / 2;
  g.add(ground);

  return g;
}

/* ------------------------------------------------------------------ */
/* insulation                                                          */
/* ------------------------------------------------------------------ */

function buildInsulationHalf(upper: boolean): THREE.Group {
  const g = partGroup(upper ? 'insulation-upper' : 'insulation-lower');
  const segmentLength = 1.86;
  const gap = 0.1;

  for (let i = -1; i <= 1; i++) {
    const seg = new THREE.Mesh(
      halfTubeGeometry(INS.outerRadius, segmentLength, upper, 40, INS.outerRadius - INS.innerRadius),
      MAT.ceramicIns,
    );
    seg.position.x = i * (segmentLength + gap);
    seg.position.z = SPLIT;
    seg.castShadow = true;
    seg.receiveShadow = true;
    g.add(seg);
  }

  /* end baffles */
  for (const sx of [-1, 1]) {
    const baffle = new THREE.Mesh(
      halfDiscGeometry(INS.outerRadius, 0.1, upper, 36),
      MAT.ceramic,
    );
    baffle.position.set(sx * (INS.length / 2 + 0.02), 0, SPLIT);
    g.add(baffle);
  }

  /* ceramic edge blocks */
  for (const sx of [-1, 1]) {
    const block = new THREE.Mesh(
      roundedBox(0.12, INS.outerRadius * 1.9, 0.5, 0.04, 0.01),
      MAT.ceramicWhite,
    );
    block.position.set(sx * (INS.length / 2 - 0.06), 0, SPLIT + (upper ? 0.7 : -0.7));
    g.add(block);
  }

  return g;
}

export function buildInsulationUpper(): THREE.Group {
  return buildInsulationHalf(true);
}

export function buildInsulationLower(): THREE.Group {
  return buildInsulationHalf(false);
}

/* ------------------------------------------------------------------ */
/* heating elements                                                    */
/* ------------------------------------------------------------------ */

function helixCurve(x0: number, x1: number, radius: number, turns: number, phase = 0): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const steps = Math.round(turns * 26);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = phase + t * turns * Math.PI * 2;
    pts.push(
      new THREE.Vector3(
        x0 + (x1 - x0) * t,
        Math.cos(a) * radius,
        MODEL.tube.z + Math.sin(a) * radius,
      ),
    );
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
}

export function buildHeatingCoil(): THREE.Group {
  const g = partGroup('heating-coil');

  const zoneLength = 1.72;
  const centres = [-1.95, 0, 1.95];
  const intensity = [0.9, 1.55, 0.9];

  centres.forEach((cx, i) => {
    const curve = helixCurve(cx - zoneLength / 2, cx + zoneLength / 2, COIL.radius, COIL.turns, i * 0.7);
    const geo = new THREE.TubeGeometry(curve, 420, COIL.wireRadius, 8, false);
    const mat = MAT.hotWire.clone();
    mat.emissiveIntensity = intensity[i];
    mat.userData.heat = 1;
    const coil = new THREE.Mesh(geo, mat);
    coil.name = `coil-zone-${i + 1}`;
    coil.castShadow = false;
    g.add(coil);

    /* ceramic terminal blocks at each end of the zone */
    for (const sx of [-1, 1]) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.14), MAT.ceramicWhite);
      block.position.set(cx + sx * (zoneLength / 2 + 0.06), 0, MODEL.tube.z + 0.9);
      g.add(block);

      const tag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.05), MAT.brass);
      tag.position.set(cx + sx * (zoneLength / 2 + 0.015), 0, MODEL.tube.z + 0.9);
      g.add(tag);
    }
  });

  /* four alumina support rods */
  const rodGeo = cylX(0.032, 0.032, COIL.length + 0.2, 10);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
    const rod = new THREE.Mesh(rodGeo, MAT.ceramic);
    rod.position.set(0, Math.cos(a) * 0.98, MODEL.tube.z + Math.sin(a) * 0.98);
    g.add(rod);
  }

  /* end collars that keep the winding centred */
  for (const sx of [-1, 1]) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.03, 8, 32), MAT.ceramicWhite);
    collar.rotation.y = Math.PI / 2;
    collar.position.set(sx * (COIL.length / 2), 0, MODEL.tube.z);
    g.add(collar);
  }

  return g;
}

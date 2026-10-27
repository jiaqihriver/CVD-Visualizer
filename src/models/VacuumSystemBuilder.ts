/**
 * VacuumSystemBuilder.ts — exhaust line, rotary-vane pump, gauge and scrubber.
 */

import * as THREE from 'three';
import { MODEL, ROUTES } from '../data/equipmentConfig';
import { MAT } from './Materials';
import {
  createKfClamp,
  cylX,
  cylZ,
  makeScreen,
  makeTextPlane,
  pipeCurve,
  pipeMesh,
  roundedBox,
} from './GeometryFactory';

const VAC = MODEL.vacuum;

function partGroup(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = id;
  return g;
}

function faceFront(mesh: THREE.Object3D): void {
  mesh.rotation.set(-Math.PI / 2, 0, Math.PI);
}

/* ------------------------------------------------------------------ */
/* vacuum line                                                         */
/* ------------------------------------------------------------------ */

export function buildVacuumLine(): THREE.Group {
  const g = partGroup('vacuum-line');

  g.add(pipeMesh(ROUTES.outletToPump, 0.115, MAT.steel, 120, 14));

  /* bellows rings around the bend */
  const curve = pipeCurve(ROUTES.outletToPump);
  const zAxis = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < 10; i++) {
    const t = 0.22 + i * 0.035;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t).normalize();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.017, 8, 24), MAT.steelDark);
    ring.position.copy(p);
    ring.quaternion.setFromUnitVectors(zAxis, tan);
    g.add(ring);
  }

  /* clamps at both ends */
  const clampA = createKfClamp(0.18, MAT.chrome);
  clampA.rotation.y = Math.PI / 2;
  clampA.position.set(5.78, 0, 2.9);
  g.add(clampA);

  const clampB = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 26), MAT.chrome);
  clampB.position.set(5.5, -2.55, 1.34);
  g.add(clampB);

  /* support bracket down to the deck */
  const mast = new THREE.Mesh(cylZ(0.035, 0.035, 2.2, 10), MAT.frame);
  mast.position.set(6.86, -0.9, 1.2);
  g.add(mast);

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.06), MAT.frame);
  saddle.position.set(6.86, -0.9, 2.25);
  g.add(saddle);

  return g;
}

/* ------------------------------------------------------------------ */
/* rotary vane pump                                                    */
/* ------------------------------------------------------------------ */

export function buildVacuumPump(): THREE.Group {
  const g = partGroup('vacuum-pump');
  const { x, y } = { x: VAC.pump.x, y: VAC.pump.y };
  const zc = 0.66;

  const skid = new THREE.Mesh(roundedBox(2.15, 1.25, 0.13, 0.05, 0.012), MAT.frameDark);
  skid.position.set(x, y, 0.07);
  skid.receiveShadow = true;
  g.add(skid);

  /* pump body */
  const body = new THREE.Mesh(cylX(0.37, 0.37, 1.0, 28), MAT.steelDark);
  body.position.set(x - 0.26, y, zc);
  body.castShadow = true;
  g.add(body);

  const capGeo = new THREE.SphereGeometry(0.37, 24, 12);
  const capA = new THREE.Mesh(capGeo, MAT.steelDark);
  capA.position.set(x - 0.76, y, zc);
  capA.scale.x = 0.35;
  g.add(capA);

  const flange = new THREE.Mesh(cylX(0.4, 0.4, 0.1, 28), MAT.steel);
  flange.position.set(x + 0.28, y, zc);
  g.add(flange);

  /* motor */
  const motor = new THREE.Mesh(cylX(0.27, 0.27, 0.72, 24), MAT.steel);
  motor.position.set(x + 0.72, y, zc);
  motor.castShadow = true;
  g.add(motor);

  for (let i = 0; i < 6; i++) {
    const fin = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.018, 6, 24), MAT.steelDark);
    fin.rotation.y = Math.PI / 2;
    fin.position.set(x + 0.45 + i * 0.1, y, zc);
    g.add(fin);
  }

  const fanCover = new THREE.Mesh(cylX(0.24, 0.28, 0.16, 20), MAT.frameDark);
  fanCover.position.set(x + 1.12, y, zc);
  g.add(fanCover);

  /* coupling guard */
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.42), MAT.frameDark);
  guard.position.set(x + 0.16, y, zc - 0.02);
  g.add(guard);

  /* supports */
  for (const dx of [-0.55, 0.55]) {
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.24), MAT.frame);
    support.position.set(x + dx, y, 0.25);
    g.add(support);
  }

  /* inlet port */
  const inlet = new THREE.Mesh(cylZ(0.11, 0.11, 0.42, 16), MAT.steel);
  inlet.position.set(x + 0.3, y, 1.05);
  g.add(inlet);

  const inletFlange = new THREE.Mesh(cylZ(0.19, 0.19, 0.05, 20), MAT.chrome);
  inletFlange.position.set(x + 0.3, y, 1.27);
  g.add(inletFlange);

  /* oil sight glass */
  const sight = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 20), MAT.pumpOil);
  sight.position.set(x - 0.26, y + 0.38, zc - 0.08);
  g.add(sight);

  const sightRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 20), MAT.chrome);
  sightRing.position.set(x - 0.26, y + 0.395, zc - 0.08);
  g.add(sightRing);

  /* exhaust port + silencer */
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 12), MAT.steelDark);
  exhaust.position.set(x + 0.86, y - 0.35, zc + 0.06);
  g.add(exhaust);

  const exhaustBox = new THREE.Mesh(roundedBox(0.34, 0.28, 0.2, 0.03), MAT.frameDark);
  exhaustBox.position.set(x + 0.86, y - 0.36, zc + 0.06);
  g.add(exhaustBox);

  /* rating plate */
  const plate = makeTextPlane('RV-8  ROTARY VANE', 0.7, {
    color: '#93a7b8',
    weight: 500,
    px: 512,
    py: 96,
    glow: 'rgba(0,0,0,0)',
  });
  plate.position.set(x - 0.2, y + 0.375, zc + 0.16);
  faceFront(plate);
  g.add(plate);

  const led = new THREE.Mesh(new THREE.CircleGeometry(0.025, 12), MAT.ledGreen);
  led.position.set(x + 0.95, y + 0.281, zc + 0.12);
  faceFront(led);
  g.add(led);

  return g;
}

/* ------------------------------------------------------------------ */
/* vacuum gauge                                                        */
/* ------------------------------------------------------------------ */

export function buildVacuumGauge(): THREE.Group {
  const g = partGroup('vacuum-gauge');

  const stem = new THREE.Mesh(cylZ(0.04, 0.04, 0.32, 12), MAT.steel);
  stem.position.set(6.45, 0, 3.04);
  g.add(stem);

  const head = new THREE.Mesh(cylX(0.14, 0.14, 0.34, 24), MAT.steel);
  head.position.set(6.45, 0, 3.24);
  g.add(head);

  const cap = new THREE.Mesh(cylX(0.15, 0.15, 0.05, 24), MAT.steelDark);
  cap.position.set(6.63, 0, 3.24);
  g.add(cap);

  const screen = makeScreen(0.3, 0.12, (ctx) => {
    ctx.fillStyle = '#03121a';
    ctx.fillRect(0, 0, 512, 205);
    ctx.strokeStyle = '#36d9e8';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 506, 199);
    ctx.fillStyle = '#7cf0ff';
    ctx.font = '600 62px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('1.2e-1', 26, 92);
    ctx.fillStyle = '#5f8fa5';
    ctx.font = '500 30px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('mbar', 26, 146);
    ctx.fillStyle = '#36d9e8';
    ctx.fillRect(360, 60, 110, 8);
    ctx.fillStyle = '#2b4b5c';
    ctx.fillRect(360, 78, 110, 8);
    ctx.fillRect(360, 96, 110, 8);
  });
  screen.position.set(6.45, 0.145, 3.24);
  faceFront(screen);
  g.add(screen);

  /* signal cable down to the pump */
  const cable = pipeMesh(
    [
      [6.45, 0.04, 3.16],
      [6.68, 0.18, 2.78],
      [6.84, -0.5, 2.3],
      [6.66, -1.5, 1.82],
      [6.25, -2.2, 1.5],
      [6.0, -2.4, 1.3],
    ],
    0.022,
    MAT.cable,
    60,
    6,
  );
  g.add(cable);

  return g;
}

/* ------------------------------------------------------------------ */
/* exhaust scrubber                                                    */
/* ------------------------------------------------------------------ */

export function buildExhaustScrubber(): THREE.Group {
  const g = partGroup('exhaust-scrubber');
  const x = VAC.scrubber.x;
  const y = VAC.scrubber.y;

  const body = new THREE.Mesh(cylZ(0.34, 0.34, 2.2, 28), MAT.steelDark);
  body.position.set(x, y, 1.1);
  body.castShadow = true;
  g.add(body);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), MAT.steelDark);
  dome.position.set(x, y, 2.2);
  dome.scale.z = 0.55;
  g.add(dome);

  for (const z of [0.1, 0.5, 1.75, 2.17]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.02, 6, 28), MAT.chrome);
    ring.position.set(x, y, z);
    g.add(ring);
  }

  /* inlet / outlet ports */
  const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12), MAT.steel);
  inlet.rotation.z = Math.PI / 2;
  inlet.position.set(x - 0.42, y, 1.35);
  g.add(inlet);

  const vent = new THREE.Mesh(cylZ(0.055, 0.055, 0.6, 12), MAT.steel);
  vent.position.set(x, y, 2.62);
  g.add(vent);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.12, 16), MAT.steelDark);
  cap.rotation.x = Math.PI / 2;
  cap.position.set(x, y, 2.96);
  g.add(cap);

  /* exhaust pipe from the pump */
  g.add(pipeMesh(ROUTES.pumpToScrubber, 0.06, MAT.steel, 60, 8));

  const label = makeTextPlane('SCRUBBER', 0.46, {
    color: '#9fb4c6',
    weight: 600,
    px: 512,
    py: 128,
    glow: 'rgba(0,0,0,0)',
  });
  label.position.set(x, y + 0.345, 1.65);
  faceFront(label);
  g.add(label);

  const led = new THREE.Mesh(new THREE.CircleGeometry(0.024, 12), MAT.ledAmber);
  led.position.set(x, y + 0.345, 1.35);
  faceFront(led);
  g.add(led);

  return g;
}

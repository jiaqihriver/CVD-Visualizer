/**
 * GasSystemBuilder.ts — cylinder bank, MFC rack and mixing manifold.
 */

import * as THREE from 'three';
import { MODEL, ROUTES } from '../data/equipmentConfig';
import { MAT } from './Materials';
import {
  createGauge,
  createHandwheel,
  cylZ,
  makeScreen,
  makeTextPlane,
  pipeMesh,
  roundedBox,
} from './GeometryFactory';

const GAS = MODEL.gas;
const PANEL_Z = GAS.panel.z;

function partGroup(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = id;
  return g;
}

function faceFront(mesh: THREE.Object3D): void {
  mesh.rotation.set(-Math.PI / 2, 0, Math.PI);
}

/* ------------------------------------------------------------------ */
/* gas cylinder bank                                                   */
/* ------------------------------------------------------------------ */

interface BottleSpec {
  x: number;
  label: string;
  material: THREE.Material;
}

export function buildGasBottles(): THREE.Group {
  const g = partGroup('gas-bottles');

  const specs: BottleSpec[] = [
    { x: GAS.bottles[0], label: 'Ar 99.999%', material: MAT.bottleAr },
    { x: GAS.bottles[1], label: 'CH4 / Ar', material: MAT.bottleCH4 },
    { x: GAS.bottles[2], label: 'H2 99.999%', material: MAT.bottleH2 },
  ];

  const bodyGeo = cylZ(GAS.bottleRadius, GAS.bottleRadius, GAS.bottleHeight, 28);
  const shoulderGeo = new THREE.SphereGeometry(GAS.bottleRadius, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const neckGeo = cylZ(0.11, 0.11, 0.3, 16);
  const valveGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);

  for (const spec of specs) {
    const y = GAS.bottleY;

    const body = new THREE.Mesh(bodyGeo, spec.material);
    body.position.set(spec.x, y, GAS.bottleHeight / 2);
    body.castShadow = true;
    g.add(body);

    const shoulder = new THREE.Mesh(shoulderGeo, spec.material);
    shoulder.position.set(spec.x, y, GAS.bottleHeight);
    shoulder.scale.z = 0.55;
    g.add(shoulder);

    const neck = new THREE.Mesh(neckGeo, MAT.bottleTop);
    neck.position.set(spec.x, y, GAS.bottleHeight + 0.2);
    g.add(neck);

    const valve = new THREE.Mesh(valveGeo, MAT.bottleTop);
    valve.position.set(spec.x, y, GAS.bottleHeight + 0.4);
    g.add(valve);

    const wheel = createHandwheel(0.12, MAT.brass, 3);
    wheel.position.set(spec.x, y, GAS.bottleHeight + 0.54);
    g.add(wheel);

    /* regulator + gauge */
    const reg = new THREE.Mesh(cylZ(0.11, 0.11, 0.26, 16), MAT.steel);
    reg.position.set(spec.x, y + 0.14, GAS.bottleHeight + 0.26);
    g.add(reg);

    const gauge = createGauge(0.15, MAT.steel, '#8fe9f5', 2.4);
    gauge.position.set(spec.x + 0.2, y + 0.16, GAS.bottleHeight + 0.32);
    faceFront(gauge);
    g.add(gauge);

    /* label */
    const label = makeTextPlane(spec.label, 0.72, {
      color: '#dfeef8',
      weight: 600,
      px: 512,
      py: 128,
      glow: 'rgba(0,0,0,0)',
    });
    label.position.set(spec.x, y + GAS.bottleRadius + 0.006, 2.75);
    faceFront(label);
    g.add(label);

    const stripe = new THREE.Mesh(cylZ(GAS.bottleRadius + 0.004, GAS.bottleRadius + 0.004, 0.12, 28), MAT.chrome);
    stripe.position.set(spec.x, y, 0.7);
    g.add(stripe);

    /* retention strap */
    for (const z of [1.25, 3.55]) {
      const strap = new THREE.Mesh(new THREE.TorusGeometry(GAS.bottleRadius + 0.02, 0.012, 6, 28), MAT.frameDark);
      strap.position.set(spec.x, y, z);
      g.add(strap);
    }

    /* feed line to the rear rail */
    const feed = pipeMesh(
      [
        [spec.x, y, 5.6],
        [spec.x, y - 0.22, 5.72],
        [spec.x, y - 0.5, 5.88],
      ],
      0.025,
      MAT.gasArLine,
      20,
      8,
    );
    g.add(feed);
  }

  /* rack */
  for (const z of [1.25, 3.55]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.06, 0.06), MAT.frame);
    rail.position.set(-5.5, GAS.bottleY - 0.6, z);
    g.add(rail);
  }
  for (const x of [-7.1, -3.9]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 3.8), MAT.frame);
    post.position.set(x, GAS.bottleY - 0.6, 1.9);
    g.add(post);
  }

  /* header rail → MFC bank */
  const header = pipeMesh(
    [
      [-6.4, GAS.bottleY - 0.55, 5.92],
      [-5.4, GAS.bottleY - 0.56, 5.9],
      [-4.4, GAS.bottleY - 0.56, 5.9],
      [-3.5, GAS.bottleY - 0.5, 5.9],
      [-2.9, GAS.bottleY - 0.4, 5.32],
      [-2.72, GAS.bottleY - 0.32, 4.78],
    ],
    0.035,
    MAT.gasArLine,
    72,
    8,
  );
  g.add(header);

  return g;
}

/* ------------------------------------------------------------------ */
/* MFC rack                                                            */
/* ------------------------------------------------------------------ */

function mfcScreen(gas: string, flow: string, accent: string): THREE.Mesh {
  return makeScreen(0.5, 0.22, (ctx) => {
    ctx.fillStyle = '#04121b';
    ctx.fillRect(0, 0, 512, 225);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 504, 217);

    ctx.fillStyle = '#7f9bb0';
    ctx.font = '500 26px "SFMono-Regular", Menlo, monospace';
    ctx.fillText(gas, 22, 48);

    ctx.fillStyle = accent;
    ctx.font = '600 58px "SFMono-Regular", Menlo, monospace';
    ctx.fillText(flow, 22, 122);

    ctx.fillStyle = '#5f7d93';
    ctx.font = '500 22px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('sccm', 22, 158);

    ctx.fillStyle = 'rgba(90, 140, 170, 0.25)';
    ctx.fillRect(170, 138, 310, 10);
    ctx.fillStyle = accent;
    ctx.fillRect(170, 138, 210, 10);

    ctx.fillStyle = '#47657a';
    ctx.font = '500 20px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('SET', 400, 52);
    ctx.fillStyle = accent;
    ctx.fillText('AUTO', 388, 84);
  });
}

export function buildMfc(): THREE.Group {
  const g = partGroup('mfc');
  const { x, y, width, height } = GAS.panel;
  const panelY = y;

  const plate = new THREE.Mesh(roundedBox(width, 0.12, height, 0.05, 0.012), MAT.panel);
  plate.position.set(x, panelY, PANEL_Z);
  plate.castShadow = true;
  g.add(plate);

  const header = makeTextPlane('MASS FLOW CONTROLLER', 1.65, {
    color: '#7fd8e6',
    weight: 600,
    px: 512,
    py: 64,
    glow: 'rgba(0,0,0,0)',
  });
  header.position.set(x, panelY + 0.066, PANEL_Z + height / 2 - 0.11);
  faceFront(header);
  g.add(header);

  const modules = [
    { dx: -0.72, gas: 'AR', flow: '200.0', accent: '#8fd7ff' },
    { dx: 0, gas: 'CH4', flow: ' 20.0', accent: '#5df0a8' },
    { dx: 0.72, gas: 'H2', flow: ' 50.0', accent: '#7c9dff' },
  ];

  for (const m of modules) {
    const mx = x + m.dx;
    const body = new THREE.Mesh(roundedBox(0.66, 0.18, 0.56, 0.04, 0.01), MAT.panelDark);
    body.position.set(mx, panelY + 0.08, PANEL_Z + 0.02);
    g.add(body);

    const screen = mfcScreen(m.gas, m.flow, m.accent);
    screen.position.set(mx, panelY + 0.176, PANEL_Z + 0.08);
    faceFront(screen);
    g.add(screen);

    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 16), MAT.chrome);
    knob.position.set(mx + 0.22, panelY + 0.21, PANEL_Z - 0.17);
    g.add(knob);

    const led = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), MAT.ledGreen);
    led.position.set(mx - 0.24, panelY + 0.181, PANEL_Z - 0.17);
    faceFront(led);
    g.add(led);

    const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 8), MAT.brass);
    outlet.position.set(mx, panelY - 0.02, PANEL_Z - 0.2);
    g.add(outlet);
  }

  /* mounting posts down to the deck */
  for (const dx of [-1.05, 1.05]) {
    const post = new THREE.Mesh(cylZ(0.05, 0.05, 4.45, 12), MAT.frame);
    post.position.set(x + dx, panelY - 0.12, 2.225);
    g.add(post);

    const foot = new THREE.Mesh(cylZ(0.16, 0.18, 0.06, 16), MAT.frameDark);
    foot.position.set(x + dx, panelY - 0.12, 0.03);
    g.add(foot);

    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.1), MAT.frame);
    brace.position.set(x + dx, panelY - 0.12, PANEL_Z - height / 2 - 0.05);
    g.add(brace);
  }

  const cable = pipeMesh(
    [
      [x - 1.02, panelY - 0.05, PANEL_Z - 0.28],
      [x - 1.3, panelY - 0.05, PANEL_Z - 0.7],
      [x - 1.35, panelY - 0.05, 3.4],
      [x - 1.35, panelY - 0.05, 0.5],
    ],
    0.03,
    MAT.cable,
    40,
    6,
  );
  g.add(cable);

  return g;
}

/* ------------------------------------------------------------------ */
/* mixing manifold                                                     */
/* ------------------------------------------------------------------ */

export function buildGasManifold(): THREE.Group {
  const g = partGroup('gas-manifold');

  const block = new THREE.Mesh(roundedBox(0.52, 0.36, 0.5, 0.05, 0.012), MAT.steel);
  block.position.set(-4.72, -2.5, 4.32);
  block.castShadow = true;
  g.add(block);

  /* three coloured feed lines */
  g.add(pipeMesh(ROUTES.mfcToManifoldA, 0.024, MAT.gasArLine, 56, 8));
  g.add(pipeMesh(ROUTES.mfcToManifoldB, 0.024, MAT.gasCH4Line, 56, 8));
  g.add(pipeMesh(ROUTES.mfcToManifoldC, 0.024, MAT.gasH2Line, 56, 8));

  /* mixed outlet down to the inlet flange */
  g.add(pipeMesh(ROUTES.manifoldToInlet, 0.038, MAT.mixedLine, 120, 10));

  /* manual valves */
  for (const dx of [-0.14, 0.14]) {
    const body = new THREE.Mesh(cylZ(0.055, 0.055, 0.2, 12), MAT.steelDark);
    body.position.set(-4.72 + dx, -2.5, 4.6);
    g.add(body);

    const wheel = createHandwheel(0.1, MAT.brass, 3);
    wheel.position.set(-4.72 + dx, -2.5, 4.73);
    g.add(wheel);
  }

  /* manifold pressure gauge */
  const gauge = createGauge(0.13, MAT.steel, '#8fe9f5', 1.9);
  gauge.position.set(-4.72, -2.28, 4.56);
  faceFront(gauge);
  g.add(gauge);

  /* mounting bracket to the bench */
  const mast = new THREE.Mesh(cylZ(0.035, 0.035, 4.05, 10), MAT.frame);
  mast.position.set(-4.95, -2.68, 2.03);
  g.add(mast);

  const label = makeTextPlane('MIX', 0.3, { color: '#7fd8e6', weight: 600, px: 256, py: 128 });
  label.position.set(-4.72, -2.31, 4.25);
  faceFront(label);
  g.add(label);

  return g;
}

/**
 * FrameBuilder.ts — bench, legs and furnace pedestals.
 */

import * as THREE from 'three';
import { MODEL } from '../data/equipmentConfig';
import { MAT } from './Materials';
import { cylX, cylZ, makeTextPlane, roundedBox } from './GeometryFactory';

function partGroup(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = id;
  return g;
}

export function buildBaseFrame(): THREE.Group {
  const g = partGroup('base-frame');
  const { width, depth, thickness } = MODEL.base;

  /* ---- deck ---- */
  const deck = new THREE.Mesh(roundedBox(width, depth, thickness, 0.14, 0.03), MAT.bench);
  deck.position.z = -thickness / 2;
  deck.receiveShadow = true;
  g.add(deck);

  /* bevelled trim around the deck */
  const trimGeo = roundedBox(width + 0.06, depth + 0.06, 0.1, 0.16, 0.02);
  const trim = new THREE.Mesh(trimGeo, MAT.benchEdge);
  trim.position.z = -0.28;
  g.add(trim);

  /* T-slot grooves on the deck */
  const slotMat = MAT.frameDark;
  for (let i = -2; i <= 2; i++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(width - 0.9, 0.05, 0.014), slotMat);
    slot.position.set(0, i * 1.45, 0.006);
    g.add(slot);
  }

  /* front edge light strip */
  const strip = new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, 0.022, 0.028), MAT.emissiveCyan);
  strip.position.set(0, depth / 2 + 0.035, -0.075);
  g.add(strip);

  /* ---- legs ---- */
  const legH = 1.15;
  const legGeo = cylZ(0.15, 0.17, legH, 14);
  const footGeo = cylZ(0.27, 0.3, 0.07, 20);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, MAT.frame);
      leg.position.set(sx * 6.65, sy * 3.35, -thickness - legH / 2);
      leg.castShadow = true;
      g.add(leg);

      const foot = new THREE.Mesh(footGeo, MAT.frameDark);
      foot.position.set(sx * 6.65, sy * 3.35, -thickness - legH - 0.03);
      g.add(foot);

      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.12), MAT.frame);
      collar.position.set(sx * 6.65, sy * 3.35, -thickness - 0.08);
      g.add(collar);
    }
  }

  /* cross rails */
  const railX = new THREE.Mesh(new THREE.BoxGeometry(13.3, 0.09, 0.09), MAT.frame);
  railX.position.set(0, 3.35, -1.02);
  g.add(railX);
  const railX2 = railX.clone();
  railX2.position.y = -3.35;
  g.add(railX2);
  const railY = new THREE.Mesh(new THREE.BoxGeometry(0.09, 6.7, 0.09), MAT.frame);
  railY.position.set(6.65, 0, -1.02);
  g.add(railY);
  const railY2 = railY.clone();
  railY2.position.x = -6.65;
  g.add(railY2);

  /* ---- front name plate ---- */
  const plate = makeTextPlane('CVD · 2D MATERIALS LAB', 1.9, {
    color: '#7fdcea',
    weight: 500,
    px: 512,
    py: 64,
    align: 'left',
  });
  plate.position.set(3.9, depth / 2 + 0.045, -0.17);
  plate.rotation.set(-Math.PI / 2, 0, Math.PI);
  g.add(plate);

  /* small corner status light */
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.02, 0.03), MAT.ledGreen);
  led.position.set(6.4, depth / 2 + 0.04, -0.075);
  g.add(led);

  return g;
}

export function buildFurnaceSupport(): THREE.Group {
  const g = partGroup('furnace-support');

  const legGeo = roundedBox(0.36, 1.2, 1.22, 0.04, 0.012);
  const padGeo = roundedBox(0.5, 1.3, 0.06, 0.03, 0.01);

  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, MAT.frame);
    leg.position.set(sx * 2.35, 0, 0.63);
    leg.castShadow = true;
    g.add(leg);

    const pad = new THREE.Mesh(padGeo, MAT.ceramic);
    pad.position.set(sx * 2.35, 0, 1.28);
    g.add(pad);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.42, 0.06), MAT.frameDark);
    foot.position.set(sx * 2.35, 0, 0.03);
    g.add(foot);

    /* clamping bolts */
    const boltGeo = cylX(0.035, 0.035, 0.1, 8);
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const b = new THREE.Mesh(boltGeo, MAT.steel);
        b.position.set(sx * 2.35 + i * 0.13, j * 0.55, 1.32);
        g.add(b);
      }
    }

    /* slide plate */
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.0, 0.02), MAT.steelDark);
    slide.position.set(sx * 2.35, 0, 1.315);
    g.add(slide);
  }

  const brace = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.16, 0.18), MAT.frame);
  brace.position.set(0, 0, 0.36);
  g.add(brace);

  const brace2 = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.1, 0.1), MAT.frameDark);
  brace2.position.set(0, 0, 0.86);
  g.add(brace2);

  return g;
}

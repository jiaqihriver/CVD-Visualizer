/**
 * ReactorBuilder.ts — quartz tube, end flanges, boats and the 2D substrate.
 */

import * as THREE from 'three';
import { MODEL } from '../data/equipmentConfig';
import { MAT } from './Materials';
import {
  boltsAlongX,
  createHandwheel,
  createKfClamp,
  cylX,
  cylZ,
  discGeometry,
  hollowTubeGeometry,
} from './GeometryFactory';

const TUBE = MODEL.tube;
const TZ = TUBE.z;

function partGroup(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = id;
  return g;
}

/* ------------------------------------------------------------------ */
/* quartz tube                                                         */
/* ------------------------------------------------------------------ */

export function buildQuartzTube(): THREE.Group {
  const g = partGroup('quartz-tube');

  const tube = new THREE.Mesh(hollowTubeGeometry(TUBE.outerRadius, TUBE.innerRadius, TUBE.length, 80), MAT.quartz);
  tube.position.z = TZ;
  tube.name = 'tube-shell';
  tube.renderOrder = 4;
  g.add(tube);

  /* support collars just outside the furnace */
  for (const sx of [-1, 1]) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(TUBE.outerRadius + 0.035, 0.035, 10, 36), MAT.steelDark);
    collar.rotation.y = Math.PI / 2;
    collar.position.set(sx * 3.62, 0, TZ);
    g.add(collar);

    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.2), MAT.steelDark);
    clamp.position.set(sx * 3.62, 0, TZ - TUBE.outerRadius - 0.05);
    g.add(clamp);
  }

  /* hot reaction zone volume — opacity is animated at runtime */
  const glowMat = MAT.hotGlow.clone();
  glowMat.opacity = 0.07;
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.49, 0.49, 5.3, 28, 1, true),
    glowMat,
  );
  glow.rotation.z = Math.PI / 2;
  glow.position.z = TZ;
  glow.name = 'heat-glow';
  glow.renderOrder = 5;
  g.add(glow);

  /* faint etched graduation marks */
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue;
    const mark = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.1, 0.006),
      new THREE.MeshBasicMaterial({ color: 0x9fe4f2, transparent: true, opacity: 0.28 }),
    );
    mark.position.set(i * 0.85, -0.06, TZ + TUBE.outerRadius + 0.005);
    g.add(mark);
  }

  return g;
}

/* ------------------------------------------------------------------ */
/* flanges                                                             */
/* ------------------------------------------------------------------ */

export function buildInletFlange(): THREE.Group {
  const g = partGroup('flange-inlet');
  const x = -TUBE.length / 2;

  const body = new THREE.Mesh(discGeometry(0.85, TUBE.outerRadius, 0.16, 56), MAT.steelDark);
  body.position.set(x - 0.06, 0, TZ);
  body.castShadow = true;
  g.add(body);

  const ring = new THREE.Mesh(discGeometry(0.72, TUBE.outerRadius, 0.08, 56), MAT.steel);
  ring.position.set(x - 0.18, 0, TZ);
  g.add(ring);

  /* O-ring seat */
  const oring = new THREE.Mesh(new THREE.TorusGeometry(TUBE.outerRadius + 0.02, 0.024, 10, 36), MAT.rubber);
  oring.rotation.y = Math.PI / 2;
  oring.position.set(x + 0.03, 0, TZ);
  g.add(oring);

  g.add(boltsAlongX(8, 0.73, x - 0.13, 0.034, 0.14, MAT.steel, 0, TZ));

  /* central gas port */
  const port = new THREE.Mesh(cylX(0.16, 0.16, 0.38, 20), MAT.steel);
  port.position.set(x - 0.36, 0, TZ);
  g.add(port);

  const nut = new THREE.Mesh(cylX(0.14, 0.14, 0.12, 6), MAT.brass);
  nut.position.set(x - 0.58, 0, TZ);
  g.add(nut);

  /* thermocouple side port */
  const tcPort = new THREE.Mesh(cylX(0.085, 0.085, 0.3, 14), MAT.steel);
  tcPort.position.set(x - 0.29, 0.35, TZ);
  g.add(tcPort);
  const tcNut = new THREE.Mesh(cylX(0.1, 0.1, 0.08, 6), MAT.brass);
  tcNut.position.set(x - 0.47, 0.35, TZ);
  g.add(tcNut);

  /* clamp ring */
  const clamp = createKfClamp(0.2, MAT.chrome);
  clamp.rotation.y = Math.PI / 2;
  clamp.position.set(x - 0.5, 0, TZ);
  g.add(clamp);

  return g;
}

export function buildOutletFlange(): THREE.Group {
  const g = partGroup('flange-outlet');
  const x = TUBE.length / 2;

  const body = new THREE.Mesh(discGeometry(0.85, TUBE.outerRadius, 0.16, 56), MAT.steelDark);
  body.position.set(x + 0.06, 0, TZ);
  body.castShadow = true;
  g.add(body);

  const ring = new THREE.Mesh(discGeometry(0.72, TUBE.outerRadius, 0.08, 56), MAT.steel);
  ring.position.set(x + 0.18, 0, TZ);
  g.add(ring);

  const oring = new THREE.Mesh(new THREE.TorusGeometry(TUBE.outerRadius + 0.02, 0.024, 10, 36), MAT.rubber);
  oring.rotation.y = Math.PI / 2;
  oring.position.set(x - 0.03, 0, TZ);
  g.add(oring);

  g.add(boltsAlongX(8, 0.73, x + 0.13, 0.034, 0.14, MAT.steel, 0, TZ));

  /* angle isolation valve */
  const valve = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), MAT.steel);
  valve.position.set(x + 0.5, 0, TZ);
  g.add(valve);

  const stem = new THREE.Mesh(cylZ(0.05, 0.05, 0.4, 12), MAT.steelDark);
  stem.position.set(x + 0.5, 0, TZ + 0.36);
  g.add(stem);

  const wheel = createHandwheel(0.2, MAT.chrome, 3);
  wheel.position.set(x + 0.5, 0, TZ + 0.57);
  g.add(wheel);

  /* outlet stub + clamp */
  const stub = new THREE.Mesh(cylX(0.18, 0.18, 0.42, 20), MAT.steel);
  stub.position.set(x + 0.78, 0, TZ);
  g.add(stub);

  const clamp = createKfClamp(0.22, MAT.chrome);
  clamp.rotation.y = Math.PI / 2;
  clamp.position.set(x + 0.96, 0, TZ);
  g.add(clamp);

  return g;
}

/* ------------------------------------------------------------------ */
/* sample boat & substrate                                             */
/* ------------------------------------------------------------------ */

export function buildSampleBoat(): THREE.Group {
  const g = partGroup('sample-boat');
  const x = MODEL.boat.sampleX;
  const z = MODEL.boat.floorZ;
  const w = 1.5;
  const d = 0.46;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, d, 0.03), MAT.ceramicWhite);
  floor.position.set(x, 0, z + 0.015);
  g.add(floor);

  const wallGeo = new THREE.BoxGeometry(w, 0.03, 0.1);
  for (const sy of [-1, 1]) {
    const wall = new THREE.Mesh(wallGeo, MAT.ceramicWhite);
    wall.position.set(x, sy * (d / 2 - 0.015), z + 0.065);
    g.add(wall);
  }

  const endGeo = new THREE.BoxGeometry(0.03, d, 0.1);
  for (const sx of [-1, 1]) {
    const end = new THREE.Mesh(endGeo, MAT.ceramicWhite);
    end.position.set(x + sx * (w / 2 - 0.015), 0, z + 0.065);
    g.add(end);
  }

  /* little lifting lugs */
  for (const sx of [-1, 1]) {
    const lug = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.16), MAT.ceramicWhite);
    lug.position.set(x + sx * (w / 2 + 0.02), 0, z + 0.11);
    g.add(lug);
  }

  /* engraved index mark */
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.005), new THREE.MeshBasicMaterial({ color: 0x6fdcec }));
  mark.position.set(x - w / 2 + 0.07, 0, z + 0.122);
  g.add(mark);

  return g;
}

export function buildSubstrate(): THREE.Group {
  const g = partGroup('substrate');
  const x = MODEL.boat.sampleX;
  const z = MODEL.boat.floorZ + 0.04;

  const wafer = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.014), MAT.wafer);
  wafer.position.set(x, 0, z);
  g.add(wafer);

  const film = new THREE.Mesh(new THREE.CircleGeometry(0.13, 6), MAT.film);
  film.position.set(x - 0.02, 0, z + 0.009);
  film.rotation.z = 0.35;
  g.add(film);

  const flake = new THREE.Mesh(new THREE.CircleGeometry(0.06, 3), MAT.film);
  flake.position.set(x + 0.1, 0.06, z + 0.0095);
  flake.rotation.z = -0.6;
  g.add(flake);

  return g;
}

/* ------------------------------------------------------------------ */
/* precursor boat                                                      */
/* ------------------------------------------------------------------ */

export function buildPrecursorBoat(): THREE.Group {
  const g = partGroup('precursor-boat');
  const x = MODEL.boat.precursorX;
  const z = MODEL.boat.floorZ;
  const w = 1.0;
  const d = 0.4;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, d, 0.035), MAT.ceramicWhite);
  floor.position.set(x, 0, z + 0.02);
  g.add(floor);

  const wallGeo = new THREE.BoxGeometry(w, 0.03, 0.11);
  for (const sy of [-1, 1]) {
    const wall = new THREE.Mesh(wallGeo, MAT.ceramicWhite);
    wall.position.set(x, sy * (d / 2 - 0.015), z + 0.075);
    g.add(wall);
  }
  const endGeo = new THREE.BoxGeometry(0.03, d, 0.11);
  for (const sx of [-1, 1]) {
    const end = new THREE.Mesh(endGeo, MAT.ceramicWhite);
    end.position.set(x + sx * (w / 2 - 0.015), 0, z + 0.075);
    g.add(end);
  }

  /* precursor powder mounds */
  const moundGeo = new THREE.SphereGeometry(0.07, 12, 8);
  const spots: [number, number, number][] = [
    [-0.28, -0.05, 0.02],
    [0.0, 0.06, 0.012],
    [0.26, -0.03, 0.024],
    [0.12, -0.1, 0.01],
  ];
  for (const [dx, dy, s] of spots) {
    const mound = new THREE.Mesh(moundGeo, MAT.powder);
    mound.position.set(x + dx, dy, z + 0.045 + s);
    mound.scale.set(1.6, 1, 0.55);
    g.add(mound);
  }

  return g;
}

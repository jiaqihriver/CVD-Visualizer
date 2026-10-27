/**
 * ControlSystemBuilder.ts — HMI cabinet, thermocouple, SCR power controller.
 */

import * as THREE from 'three';
import { MODEL } from '../data/equipmentConfig';
import { MAT } from './Materials';
import {
  cylX,
  cylZ,
  makeScreen,
  makeTextPlane,
  pipeMesh,
  roundedBox,
} from './GeometryFactory';

const CTRL = MODEL.control;
const TZ = MODEL.tube.z;

function partGroup(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = id;
  return g;
}

function faceFront(mesh: THREE.Object3D): void {
  mesh.rotation.set(-Math.PI / 2, 0, Math.PI);
}

/* ------------------------------------------------------------------ */
/* HMI cabinet                                                         */
/* ------------------------------------------------------------------ */

function hmiTexture(): THREE.Mesh {
  return makeScreen(1.5, 0.95, (ctx) => {
    const W = 512;
    const H = 324;

    ctx.fillStyle = '#04121a';
    ctx.fillRect(0, 0, W, H);

    /* header */
    ctx.fillStyle = '#072330';
    ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = '#6ff0f7';
    ctx.font = '600 20px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('CVD-1200', 18, 29);
    ctx.fillStyle = '#4e7e93';
    ctx.font = '500 13px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('PROCESS CONTROL', 140, 29);

    ctx.fillStyle = '#0d3a2c';
    ctx.fillRect(418, 12, 76, 22);
    ctx.strokeStyle = '#42e4a0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(418, 12, 76, 22);
    ctx.fillStyle = '#42e4a0';
    ctx.font = '600 13px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('RUN', 436, 28);

    /* zone cards */
    const zones = [
      { name: 'ZONE 1', temp: ' 480', color: '#ffb15e' },
      { name: 'ZONE 2', temp: '1050', color: '#ff8a3a' },
      { name: 'ZONE 3', temp: ' 720', color: '#ffb15e' },
    ];
    zones.forEach((z, i) => {
      const x = 14 + i * 164;
      ctx.fillStyle = 'rgba(54, 217, 232, 0.05)';
      ctx.fillRect(x, 56, 152, 70);
      ctx.strokeStyle = 'rgba(90, 150, 180, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, 56, 152, 70);

      ctx.fillStyle = '#4e7e93';
      ctx.font = '500 12px "SFMono-Regular", Menlo, monospace';
      ctx.fillText(z.name, x + 10, 76);

      ctx.fillStyle = z.color;
      ctx.font = '600 32px "SFMono-Regular", Menlo, monospace';
      ctx.fillText(z.temp, x + 10, 108);

      ctx.fillStyle = '#4e7e93';
      ctx.font = '500 11px "SFMono-Regular", Menlo, monospace';
      ctx.fillText('°C', x + 116, 108);
    });

    /* chart */
    const cx = 14;
    const cy = 136;
    const cw = 484;
    const ch = 108;
    ctx.fillStyle = 'rgba(4, 22, 32, 0.9)';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = 'rgba(64, 120, 150, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = cy + (i / 4) * ch;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + cw, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const x = cx + (i / 8) * cw;
      ctx.beginPath();
      ctx.moveTo(x, cy);
      ctx.lineTo(x, cy + ch);
      ctx.stroke();
    }

    const curves = [
      { color: '#ff8a3a', amp: 0.62, phase: 0 },
      { color: '#ffd08a', amp: 0.34, phase: 1.2 },
      { color: '#6ff0f7', amp: 0.2, phase: 2.4 },
    ];
    for (const c of curves) {
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      for (let i = 0; i <= 96; i++) {
        const t = i / 96;
        const v = 0.5 + Math.sin(t * 9 + c.phase) * 0.16 + Math.sin(t * 21 + c.phase * 2) * 0.04;
        const x = cx + t * cw;
        const y = cy + ch - v * ch * c.amp - 8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    /* footer readouts */
    ctx.fillStyle = '#4e7e93';
    ctx.font = '500 12px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('AR  200.0 sccm', 16, 268);
    ctx.fillText('CH4  20.0 sccm', 150, 268);
    ctx.fillText('H2  50.0 sccm', 284, 268);
    ctx.fillStyle = '#6ff0f7';
    ctx.fillText('1.2e-1 mbar', 400, 268);

    ctx.fillStyle = 'rgba(90, 150, 180, 0.28)';
    ctx.fillRect(14, 282, 484, 1);

    ctx.fillStyle = '#3f6a7e';
    ctx.font = '500 11px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('STEP 03 / HEATING  ·  12.4 min  ·  PID AUTO', 16, 302);

    ctx.fillStyle = '#42e4a0';
    ctx.beginPath();
    ctx.arc(492, 298, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function buildControlCabinet(): THREE.Group {
  const g = partGroup('control-cabinet');
  const { x, y, width, depth, height } = CTRL.cabinet;

  const body = new THREE.Mesh(roundedBox(width, depth, height, 0.1, 0.02), MAT.panel);
  body.position.set(x, y, height / 2);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const frame = new THREE.Mesh(roundedBox(width - 0.16, 0.06, height - 0.3, 0.05, 0.012), MAT.panelDark);
  frame.position.set(x, y + depth / 2 + 0.012, height / 2);
  g.add(frame);

  const screen = hmiTexture();
  screen.position.set(x, y + depth / 2 + 0.062, 2.45);
  faceFront(screen);
  g.add(screen);

  /* bezel around the screen */
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.02, 1.07), MAT.frameDark);
  bezel.position.set(x, y + depth / 2 + 0.048, 2.45);
  g.add(bezel);

  /* knobs */
  for (let i = 0; i < 3; i++) {
    const kx = x - 0.75 + i * 0.75;
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.07, 18), MAT.chrome);
    knob.position.set(kx, y + depth / 2 + 0.075, 1.3);
    g.add(knob);

    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.06), MAT.ledCyan);
    marker.position.set(kx, y + depth / 2 + 0.095, 1.33);
    g.add(marker);
  }

  /* status LEDs */
  const ledColors = [MAT.ledGreen, MAT.ledCyan, MAT.ledAmber, MAT.ledRed];
  ledColors.forEach((m, i) => {
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), m);
    led.position.set(x - 0.95 + i * 0.11, y + depth / 2 + 0.052, 1.82);
    faceFront(led);
    g.add(led);
  });

  /* door handle */
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.7), MAT.chrome);
  handle.position.set(x + width / 2 - 0.13, y + depth / 2 + 0.075, 1.9);
  g.add(handle);

  /* side vents */
  for (let i = 0; i < 8; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.05), MAT.frameDark);
    vent.position.set(x + width / 2 + 0.005, y, 0.55 + i * 0.16);
    g.add(vent);
  }

  /* top plate + badge */
  const top = new THREE.Mesh(roundedBox(width - 0.2, depth - 0.2, 0.05, 0.05, 0.012), MAT.frameDark);
  top.position.set(x, y, height + 0.02);
  g.add(top);

  const badge = makeTextPlane('PROCESS CONTROL', 1.5, {
    color: '#8fe9f5',
    weight: 500,
    px: 512,
    py: 80,
    glow: 'rgba(0,0,0,0)',
  });
  badge.position.set(x, y, height + 0.055);
  badge.rotation.z = Math.PI;
  g.add(badge);

  /* feet */
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const foot = new THREE.Mesh(cylZ(0.08, 0.1, 0.08, 12), MAT.frameDark);
      foot.position.set(x + sx * (width / 2 - 0.2), y + sy * (depth / 2 - 0.2), 0.04);
      g.add(foot);
    }
  }

  /* conduit to the deck */
  g.add(
    pipeMesh(
      [
        [x - width / 2 + 0.1, y - depth / 2 + 0.1, 0.4],
        [x - width / 2 - 0.2, y - depth / 2 - 0.1, 0.22],
        [x - width / 2 - 0.5, y - depth / 2 - 0.3, 0.1],
      ],
      0.05,
      MAT.cable,
      24,
      8,
    ),
  );

  return g;
}

/* ------------------------------------------------------------------ */
/* thermocouple                                                        */
/* ------------------------------------------------------------------ */

export function buildThermocouple(): THREE.Group {
  const g = partGroup('thermocouple');

  const sheath = new THREE.Mesh(cylX(0.027, 0.027, 5.7, 12), MAT.steelWarm);
  sheath.position.set(-3.15, 0.35, TZ + 0.02);
  g.add(sheath);

  const ceramic = new THREE.Mesh(cylX(0.055, 0.055, 1.6, 14), MAT.ceramic);
  ceramic.position.set(-5.2, 0.35, TZ + 0.02);
  g.add(ceramic);

  const fitting = new THREE.Mesh(cylX(0.085, 0.085, 0.22, 16), MAT.brass);
  fitting.position.set(-6.12, 0.35, TZ + 0.02);
  g.add(fitting);

  const head = new THREE.Mesh(roundedBox(0.28, 0.22, 0.2, 0.03, 0.008), MAT.panelDark);
  head.position.set(-6.38, 0.35, TZ + 0.12);
  g.add(head);

  const cap = new THREE.Mesh(cylZ(0.05, 0.05, 0.08, 12), MAT.steel);
  cap.position.set(-6.38, 0.35, TZ + 0.26);
  g.add(cap);

  const label = makeTextPlane('K', 0.1, { color: '#ffd08a', weight: 700, px: 128, py: 128, glow: 'rgba(0,0,0,0)' });
  label.position.set(-6.38, 0.462, TZ + 0.12);
  faceFront(label);
  g.add(label);

  const cable = pipeMesh(
    [
      [-6.52, 0.35, TZ + 0.12],
      [-6.66, 0.34, 2.55],
      [-6.78, -0.1, 1.9],
      [-6.86, -1.4, 1.05],
      [-6.95, -3.0, 0.35],
      [-7.02, -3.55, 0.16],
    ],
    0.026,
    MAT.cable,
    64,
    6,
  );
  g.add(cable);

  return g;
}

/* ------------------------------------------------------------------ */
/* SCR power controller                                                */
/* ------------------------------------------------------------------ */

export function buildPowerController(): THREE.Group {
  const g = partGroup('power-controller');
  const x = CTRL.scr.x;
  const y = CTRL.scr.y;

  const body = new THREE.Mesh(roundedBox(1.35, 1.1, 1.2, 0.06, 0.015), MAT.panel);
  body.position.set(x, y, 0.62);
  body.castShadow = true;
  g.add(body);

  /* heat sink */
  for (let i = 0; i < 7; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.92, 0.42), MAT.steelDark);
    fin.position.set(x - 0.42 + i * 0.14, y, 1.36);
    g.add(fin);
  }

  const screen = makeScreen(0.72, 0.3, (ctx) => {
    ctx.fillStyle = '#0a0d0a';
    ctx.fillRect(0, 0, 512, 213);
    ctx.strokeStyle = '#ff9b52';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 504, 205);
    ctx.fillStyle = '#ffb15e';
    ctx.font = '600 54px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('62.4 %', 22, 82);
    ctx.fillStyle = '#7a5a3c';
    ctx.font = '500 24px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('SCR 25A  ·  18.6 A', 22, 128);
    ctx.fillStyle = 'rgba(255, 155, 82, 0.3)';
    ctx.fillRect(22, 150, 468, 14);
    ctx.fillStyle = '#ff9b52';
    ctx.fillRect(22, 150, 292, 14);
  });
  screen.position.set(x, y + 0.555, 0.94);
  faceFront(screen);
  g.add(screen);

  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.38), MAT.frameDark);
  bezel.position.set(x, y + 0.552, 0.94);
  g.add(bezel);

  /* breaker + knob */
  const breaker = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.24), MAT.frameDark);
  breaker.position.set(x - 0.38, y + 0.565, 0.42);
  g.add(breaker);

  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.06, 16), MAT.chrome);
  knob.position.set(x + 0.36, y + 0.585, 0.42);
  g.add(knob);

  const led = new THREE.Mesh(new THREE.CircleGeometry(0.026, 12), MAT.ledAmber);
  led.position.set(x + 0.62, y + 0.553, 0.35);
  faceFront(led);
  g.add(led);

  const label = makeTextPlane('SCR POWER', 0.5, {
    color: '#c8d4de',
    weight: 600,
    px: 512,
    py: 128,
    glow: 'rgba(0,0,0,0)',
  });
  label.position.set(x, y + 0.553, 1.1);
  faceFront(label);
  g.add(label);

  /* heavy output cables to the furnace */
  for (const dx of [-0.09, 0.09]) {
    g.add(
      pipeMesh(
        [
          [x + dx, y - 0.56, 1.06],
          [x + dx + 0.08, y - 0.72, 1.32],
          [x + dx + 0.22, 1.95, 1.48],
          [x + dx + 0.4, 1.72, 1.44],
        ],
        0.045,
        MAT.cable,
        36,
        8,
      ),
    );
  }

  /* feet */
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const foot = new THREE.Mesh(cylZ(0.07, 0.085, 0.07, 12), MAT.frameDark);
      foot.position.set(x + sx * 0.55, y + sy * 0.45, 0.035);
      g.add(foot);
    }
  }

  return g;
}

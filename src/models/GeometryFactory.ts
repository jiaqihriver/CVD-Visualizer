/**
 * GeometryFactory.ts — reusable procedural primitives.
 * Every mesh in the scene originates here or from a builder that uses
 * these helpers. No external model files are loaded.
 */

import * as THREE from 'three';
import type { Vec3 } from '../data/equipmentConfig';

/* ------------------------------------------------------------------ */
/* 2D profiles                                                         */
/* ------------------------------------------------------------------ */

export function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const radius = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001));
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + radius, y);
  s.lineTo(x + w - radius, y);
  s.quadraticCurveTo(x + w, y, x + w, y + radius);
  s.lineTo(x + w, y + h - radius);
  s.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  s.lineTo(x + radius, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - radius);
  s.lineTo(x, y + radius);
  s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}

/** Rounded box: w along X, h along Y, d along Z (centred). */
export function roundedBox(w: number, h: number, d: number, r = 0.08, bevel = 0.02): THREE.BufferGeometry {
  const shape = roundedRectShape(w, h, r);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 8,
    steps: 1,
  });
  geo.translate(0, 0, -d / 2);
  return geo;
}

/* ------------------------------------------------------------------ */
/* axis helpers (cylinders are created along Y by three.js)           */
/* ------------------------------------------------------------------ */

export function axisX(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  geo.rotateZ(Math.PI / 2);
  return geo;
}

export function cylX(
  rTop: number,
  rBottom: number,
  height: number,
  segments = 24,
  open = false,
  thetaStart = 0,
  thetaLength = Math.PI * 2,
): THREE.BufferGeometry {
  return axisX(
    new THREE.CylinderGeometry(rTop, rBottom, height, segments, 1, open, thetaStart, thetaLength),
  );
}

/** Vertical cylinder (axis +Z) — sixths of the scene need this. */
export function cylZ(
  rTop: number,
  rBottom: number,
  height: number,
  segments = 24,
  open = false,
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, height, segments, 1, open);
  geo.rotateX(Math.PI / 2);
  return geo;
}

/** Hollow quartz tube: outer wall + inner wall + two annular end faces. */
export function hollowTubeGeometry(
  outerRadius: number,
  innerRadius: number,
  length: number,
  segments = 72,
): THREE.BufferGeometry {
  const half = length / 2;
  const profile = [
    new THREE.Vector2(innerRadius, -half),
    new THREE.Vector2(outerRadius, -half),
    new THREE.Vector2(outerRadius, half),
    new THREE.Vector2(innerRadius, half),
    new THREE.Vector2(innerRadius, -half),
  ];
  const geo = new THREE.LatheGeometry(profile, segments);
  geo.rotateZ(Math.PI / 2);
  return geo;
}

/** Half cylinder shell along X, open ended. upper = +Z half. */
export function halfTubeGeometry(
  radius: number,
  length: number,
  upper = true,
  segments = 40,
  thickness = 0,
): THREE.BufferGeometry {
  const rIn = Math.max(0.001, radius - thickness);
  const start = upper ? -Math.PI / 2 : Math.PI / 2;
  if (thickness <= 0) {
    return cylX(radius, radius, length, segments, true, start, Math.PI);
  }
  // build a thin shell by lathe-ing a half profile
  const half = length / 2;
  const profile = [
    new THREE.Vector2(rIn, -half),
    new THREE.Vector2(radius, -half),
    new THREE.Vector2(radius, half),
    new THREE.Vector2(rIn, half),
    new THREE.Vector2(rIn, -half),
  ];
  const geo = new THREE.LatheGeometry(profile, Math.round(segments / 2), start, Math.PI);
  geo.rotateZ(Math.PI / 2);
  return geo;
}

/** Half disc block (used as insulation end caps / baffles). */
export function halfDiscGeometry(
  radius: number,
  thickness: number,
  upper = true,
  segments = 32,
): THREE.BufferGeometry {
  const start = upper ? -Math.PI / 2 : Math.PI / 2;
  return cylX(radius, radius, thickness, segments, false, start, Math.PI);
}

/** Flat ring disc along the X axis (flange face). */
export function discGeometry(outerRadius: number, innerRadius: number, thickness: number, segments = 48) {
  return hollowTubeGeometry(outerRadius, Math.max(0.0001, innerRadius), thickness, segments);
}

/* ------------------------------------------------------------------ */
/* pipes                                                               */
/* ------------------------------------------------------------------ */

export function pipeGeometry(
  points: Vec3[] | THREE.Vector3[],
  radius: number,
  tubularSegments = 64,
  radialSegments = 10,
  closed = false,
): THREE.BufferGeometry {
  const pts = points.map((p) => (Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : p));
  const curve = new THREE.CatmullRomCurve3(pts, closed, 'catmullrom', 0.4);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
}

export function pipeCurve(points: Vec3[]): THREE.CatmullRomCurve3 {
  const pts = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
}

export function pipeMesh(
  points: Vec3[],
  radius: number,
  material: THREE.Material,
  tubularSegments = 64,
  radialSegments = 10,
): THREE.Mesh {
  return new THREE.Mesh(pipeGeometry(points, radius, tubularSegments, radialSegments), material);
}

/* ------------------------------------------------------------------ */
/* fasteners & fittings                                                */
/* ------------------------------------------------------------------ */

export function boltsAlongX(
  count: number,
  ringRadius: number,
  x: number,
  boltRadius: number,
  boltHeight: number,
  material: THREE.Material,
  centreY = 0,
  centreZ = 0,
): THREE.Group {
  const g = new THREE.Group();
  const shaft = cylX(boltRadius, boltRadius, boltHeight, 10);
  const head = cylX(boltRadius * 1.7, boltRadius * 1.7, boltHeight * 0.5, 6);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.PI / count;
    const y = centreY + Math.cos(a) * ringRadius;
    const z = centreZ + Math.sin(a) * ringRadius;
    const s = new THREE.Mesh(shaft, material);
    s.position.set(x, y, z);
    const h = new THREE.Mesh(head, material);
    h.position.set(x + boltHeight * 0.45, y, z);
    g.add(s, h);
  }
  return g;
}

export function createHandwheel(radius: number, material: THREE.Material, spokes = 3): THREE.Group {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.11, 8, 32), material);
  g.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, radius * 0.36, 14), material);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 0.92, radius * 0.08, radius * 0.08),
      material,
    );
    spoke.position.set(Math.cos(a) * radius * 0.46, Math.sin(a) * radius * 0.46, 0);
    spoke.rotation.z = a;
    g.add(spoke);
  }
  return g;
}

/** KF-style quick clamp ring. */
export function createKfClamp(radius: number, material: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.16, 8, 28), material);
  g.add(ring);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.7, radius * 0.18, radius * 0.12), material);
  tab.position.set(radius * 0.9, 0, 0);
  g.add(tab);
  return g;
}

/* ------------------------------------------------------------------ */
/* gauges, screens, labels                                             */
/* ------------------------------------------------------------------ */

function gaugeFaceTexture(accent = '#36d9e8'): THREE.CanvasTexture {
  return canvasTexture(256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#0a1620';
    ctx.beginPath();
    ctx.arc(128, 128, 122, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(140, 180, 205, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.stroke();

    // tick marks (270° sweep)
    ctx.strokeStyle = 'rgba(200, 230, 245, 0.85)';
    for (let i = 0; i <= 40; i++) {
      const a = Math.PI * 0.75 + (i / 40) * Math.PI * 1.5;
      const major = i % 8 === 0;
      const r1 = major ? 82 : 94;
      const r2 = 102;
      ctx.lineWidth = major ? 2.4 : 1;
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
      ctx.lineTo(128 + Math.cos(a) * r2, 128 + Math.sin(a) * r2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(170, 205, 225, 0.75)';
    ctx.font = '600 13px "SFMono-Regular", Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ['0', '1', '2', '3', '4', '5', '6', '7', '8'].forEach((t, i) => {
      const a = Math.PI * 0.75 + (i / 8) * Math.PI * 1.5;
      ctx.fillText(t, 128 + Math.cos(a) * 64, 128 + Math.sin(a) * 64);
    });

    ctx.fillStyle = accent;
    ctx.font = '600 11px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('MPa', 128, 178);
    ctx.fillStyle = 'rgba(120, 155, 180, 0.8)';
    ctx.font = '500 10px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('GAS INLET', 128, 84);
  });
}

/** Analogue dial gauge. Face points toward +Z in local space. */
export function createGauge(radius: number, material: THREE.Material, accent = '#36d9e8', needleAngle = 2.2): THREE.Group {
  const g = new THREE.Group();

  const body = new THREE.Mesh(cylZ(radius, radius, radius * 0.42, 28), material);
  g.add(body);

  const bezel = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.09, 8, 32), material);
  bezel.position.z = radius * 0.18;
  g.add(bezel);

  const face = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.92, 40),
    new THREE.MeshBasicMaterial({ map: gaugeFaceTexture(accent), transparent: true }),
  );
  face.position.z = radius * 0.215;
  g.add(face);

  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 0.06, radius * 0.72, radius * 0.02),
    new THREE.MeshBasicMaterial({ color: 0xff7a4a }),
  );
  needle.geometry.translate(0, radius * 0.3, 0);
  needle.position.z = radius * 0.235;
  needle.rotation.z = -needleAngle;
  g.add(needle);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.1, radius * 0.1, radius * 0.06, 12),
    material,
  );
  cap.rotation.x = Math.PI / 2;
  cap.position.z = radius * 0.24;
  g.add(cap);

  return g;
}

/* ------------------------------------------------------------------ */
/* canvas textures                                                     */
/* ------------------------------------------------------------------ */

export function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export interface TextPlaneOptions {
  color?: string;
  bg?: string;
  border?: string;
  weight?: number;
  font?: string;
  align?: CanvasTextAlign;
  px?: number;
  py?: number;
  glow?: string;
}

/** Flat label plane with transparent background, sized in world units. */
export function makeTextPlane(text: string, width: number, opts: TextPlaneOptions = {}): THREE.Mesh {
  const px = opts.px ?? 512;
  const py = opts.py ?? 128;
  const color = opts.color ?? '#8fe9f5';
  const texture = canvasTexture(px, py, (ctx) => {
    ctx.clearRect(0, 0, px, py);
    if (opts.bg) {
      ctx.fillStyle = opts.bg;
      ctx.fillRect(0, 0, px, py);
    }
    if (opts.border) {
      ctx.strokeStyle = opts.border;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, px - 4, py - 4);
    }
    ctx.fillStyle = color;
    ctx.shadowColor = opts.glow ?? color;
    ctx.shadowBlur = 14;
    ctx.textAlign = opts.align ?? 'center';
    ctx.textBaseline = 'middle';
    const size = Math.round(py * 0.46);
    ctx.font = `${opts.weight ?? 600} ${size}px ${opts.font ?? '"SFMono-Regular", Menlo, monospace'}`;
    const x = opts.align === 'left' ? px * 0.06 : opts.align === 'right' ? px * 0.94 : px / 2;
    ctx.fillText(text, x, py / 2 + 2);
  });

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, (width * py) / px),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  mesh.renderOrder = 3;
  return mesh;
}

/** Emissive screen plane (HMI, MFC displays, readouts). */
export function makeScreen(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.Mesh {
  const texture = canvasTexture(512, Math.round((512 * height) / width), draw);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  mesh.renderOrder = 2;
  return mesh;
}

/** Soft circular shadow catcher used under the bench. */
export function makeContactShadow(radius: number, opacity = 0.55): THREE.Mesh {
  const texture = canvasTexture(256, 256, (ctx) => {
    const grd = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grd.addColorStop(0, 'rgba(0,0,0,0.85)');
    grd.addColorStop(0.55, 'rgba(0,0,0,0.35)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 256, 256);
  });
  return new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false,
    }),
  );
}

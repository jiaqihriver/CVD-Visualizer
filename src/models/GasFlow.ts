/**
 * GasFlow.ts — animated gas stream particles.
 * Positions are sampled from the exact same Catmull-Rom routes that the
 * tubing geometry uses, so the flow can never drift away from the pipes.
 */

import * as THREE from 'three';
import { ROUTES, type Vec3 } from '../data/equipmentConfig';

interface Stream {
  samples: THREE.Vector3[];
  phases: number[];
  jitter: THREE.Vector3[];
  mesh: THREE.InstancedMesh;
  speed: number;
  scale: number;
}

const dummy = new THREE.Object3D();
const tmp = new THREE.Vector3();

function sampleCurve(points: Vec3[], count = 220): THREE.Vector3[] {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    'catmullrom',
    0.4,
  );
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) out.push(curve.getPointAt(i / (count - 1)));
  return out;
}

function buildTubeStream(): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = -5.05 + t * 10.1;
    const a = t * Math.PI * 6;
    pts.push([x, Math.cos(a) * 0.16, 2.9 + Math.sin(a) * 0.16]);
  }
  return pts;
}

export class GasFlow {
  readonly group = new THREE.Group();
  private streams: Stream[] = [];
  private time = 0;
  private enabled = true;
  private targetOpacity = 1;
  private currentOpacity = 1;
  /** fades the whole flow out while the rig is exploded */
  opacityScale = 1;

  constructor() {
    this.group.name = 'gas-flow';
    const colorFor = [0x9fd8ff, 0x5df0a8, 0x7c9dff, 0x7fe6f2];

    const defs: { pts: Vec3[]; color: number; count: number; speed: number; scale: number }[] = [
      { pts: ROUTES.bottlesToMfc, color: colorFor[0], count: 12, speed: 0.13, scale: 1.0 },
      { pts: ROUTES.mfcToManifoldA, color: colorFor[0], count: 8, speed: 0.22, scale: 0.85 },
      { pts: ROUTES.mfcToManifoldB, color: colorFor[1], count: 8, speed: 0.22, scale: 0.85 },
      { pts: ROUTES.mfcToManifoldC, color: colorFor[2], count: 8, speed: 0.22, scale: 0.85 },
      { pts: ROUTES.manifoldToInlet, color: colorFor[3], count: 22, speed: 0.16, scale: 1.0 },
      { pts: buildTubeStream(), color: colorFor[3], count: 26, speed: 0.1, scale: 1.15 },
      { pts: ROUTES.outletToPump, color: 0x8f9dff, count: 18, speed: 0.18, scale: 1.0 },
      { pts: ROUTES.pumpToScrubber, color: 0x8f9dff, count: 8, speed: 0.2, scale: 0.8 },
    ];

    const geo = new THREE.IcosahedronGeometry(0.032, 0);

    for (const def of defs) {
      const material = new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.InstancedMesh(geo, material, def.count);
      mesh.frustumCulled = false;
      mesh.renderOrder = 6;

      const phases: number[] = [];
      const jitter: THREE.Vector3[] = [];
      for (let i = 0; i < def.count; i++) {
        phases.push(i / def.count);
        jitter.push(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05,
          ),
        );
      }

      this.streams.push({
        samples: sampleCurve(def.pts),
        phases,
        jitter,
        mesh,
        speed: def.speed,
        scale: def.scale,
      });
      this.group.add(mesh);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.targetOpacity = enabled ? 1 : 0;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  update(dt: number): void {
    this.time += dt;
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * Math.min(1, dt * 6);

    const n = 220;
    for (const stream of this.streams) {
      const mat = stream.mesh.material as THREE.MeshBasicMaterial;
      const alpha = 0.95 * this.currentOpacity * this.opacityScale;
      mat.opacity = alpha;
      stream.mesh.visible = alpha > 0.02;

      for (let i = 0; i < stream.phases.length; i++) {
        let t = (stream.phases[i] + this.time * stream.speed) % 1;
        if (t < 0) t += 1;

        const f = t * (n - 1);
        const i0 = Math.floor(f);
        const i1 = Math.min(n - 1, i0 + 1);
        const fr = f - i0;
        tmp.copy(stream.samples[i0]).lerp(stream.samples[i1], fr);
        tmp.add(stream.jitter[i]);

        dummy.position.copy(tmp);
        const pulse = 0.75 + 0.25 * Math.sin(this.time * 5 + i);
        dummy.scale.setScalar(stream.scale * pulse);
        dummy.rotation.set(this.time + i, this.time * 0.7, 0);
        dummy.updateMatrix();
        stream.mesh.setMatrixAt(i, dummy.matrix);
      }
      stream.mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

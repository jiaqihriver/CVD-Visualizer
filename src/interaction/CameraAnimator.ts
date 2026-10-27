/**
 * CameraAnimator.ts — interruptible, eased camera flights for view presets
 * and "focus part" actions.
 */

import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { easeInOutCubic } from '../utils/easing';
import type { ViewPreset } from '../data/equipmentConfig';

export class CameraAnimator {
  private fromPos = new THREE.Vector3();
  private toPos = new THREE.Vector3();
  private fromTarget = new THREE.Vector3();
  private toTarget = new THREE.Vector3();
  private fromFov = 40;
  private toFov = 40;
  private elapsed = 0;
  private duration = 0.9;
  private active = false;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly controls: OrbitControls,
  ) {}

  get isActive(): boolean {
    return this.active;
  }

  flyTo(preset: ViewPreset, duration = 0.9): void {
    this.fromPos.copy(this.camera.position);
    this.toPos.set(preset.position[0], preset.position[1], preset.position[2]);
    this.fromTarget.copy(this.controls.target);
    this.toTarget.set(preset.target[0], preset.target[1], preset.target[2]);
    this.fromFov = this.camera.fov;
    this.toFov = preset.fov ?? this.fromFov;
    this.elapsed = 0;
    this.duration = Math.max(0.25, duration);
    this.active = true;
    this.controls.enabled = false;
  }

  focusOn(box: THREE.Box3, direction?: THREE.Vector3, duration = 0.75): void {
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const radius = Math.max(0.6, sphere.radius);
    const distance = Math.min(30, Math.max(3.2, radius * 3.4));

    const dir = direction
      ? direction.clone()
      : this.camera.position.clone().sub(this.controls.target);
    if (dir.lengthSq() < 0.0001) dir.set(0.7, 0.9, 0.55);
    dir.normalize();

    const target = sphere.center.clone();
    const position = target.clone().addScaledVector(dir, distance);

    this.fromPos.copy(this.camera.position);
    this.toPos.copy(position);
    this.fromTarget.copy(this.controls.target);
    this.toTarget.copy(target);
    this.fromFov = this.camera.fov;
    this.toFov = this.fromFov;
    this.elapsed = 0;
    this.duration = Math.max(0.25, duration);
    this.active = true;
    this.controls.enabled = false;
  }

  /** Frame a bounding box from the current viewing direction. */
  fitBox(box: THREE.Box3, padding = 1.08, duration = 0.9): void {
    if (box.isEmpty()) return;
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const radius = Math.max(2, sphere.radius);

    const vHalf = THREE.MathUtils.degToRad(this.camera.fov * 0.5);
    const hHalf = Math.atan(Math.tan(vHalf) * this.camera.aspect);
    const half = Math.min(vHalf, hHalf);
    const distance = Math.min(60, (radius / Math.sin(half)) * padding);

    const dir = this.camera.position.clone().sub(this.controls.target);
    if (dir.lengthSq() < 0.0001) dir.set(0.7, 0.9, 0.55);
    dir.normalize();

    this.flyTo(
      {
        position: [sphere.center.x + dir.x * distance, sphere.center.y + dir.y * distance, sphere.center.z + dir.z * distance],
        target: [sphere.center.x, sphere.center.y, sphere.center.z],
      },
      duration,
    );
  }

  cancel(): void {
    if (!this.active) return;
    this.active = false;
    this.controls.enabled = true;
  }

  update(dt: number): void {
    if (!this.active) return;

    this.elapsed += dt;
    const raw = Math.min(1, this.elapsed / this.duration);
    const t = easeInOutCubic(raw);

    this.camera.position.lerpVectors(this.fromPos, this.toPos, t);
    this.controls.target.lerpVectors(this.fromTarget, this.toTarget, t);

    if (Math.abs(this.toFov - this.fromFov) > 0.01) {
      this.camera.fov = this.fromFov + (this.toFov - this.fromFov) * t;
      this.camera.updateProjectionMatrix();
    }

    this.controls.update();

    if (raw >= 1) {
      this.active = false;
      this.controls.enabled = true;
    }
  }
}

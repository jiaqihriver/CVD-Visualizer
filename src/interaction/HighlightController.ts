/**
 * HighlightController.ts — hover / selection / motion glow.
 *
 * Glow is applied only through each part's own cloned materials, so a
 * selected part never lights up its neighbours.
 */

import * as THREE from 'three';
import type { PartRuntime, PartRegistry } from './PartRegistry';

const CYAN = new THREE.Color('#46e8ff');
const HOVER = new THREE.Color('#2fb6cc');

export class HighlightController {
  private glow = new Map<string, THREE.Color>();

  constructor(private readonly registry: PartRegistry) {
    for (const part of registry.all()) {
      this.glow.set(part.config.id, new THREE.Color(part.config.accent).lerp(CYAN, 0.62));
    }
  }

  update(time: number): void {
    for (const part of this.registry.all()) {
      this.applyPart(part, time);
    }
  }

  private applyPart(part: PartRuntime, time: number): void {
    const moving = part.progress > 0.004 && part.progress < 0.996;
    const selected = part.selected;

    let intensity = 0;
    let color = this.glow.get(part.config.id) ?? CYAN;

    if (selected) {
      /* soft breathing tint: readable, never blown out */
      const pulse = 0.5 + 0.5 * Math.sin(time * 3.4);
      intensity = 0.15 + pulse * 0.06;
      color = CYAN;
    } else if (part.hovered) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 5);
      intensity = 0.09 + pulse * 0.05;
      color = HOVER;
    }

    if (moving) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 9);
      intensity = Math.max(intensity, 0.1 + pulse * 0.08);
    }

    /* the part that just finished its travel keeps a faint trace */
    const settled = part.progress > 0.996 ? 0.02 : 0;

    for (const mr of part.materials) {
      if (!mr.baseEmissive) continue;

      const target = selected || part.hovered || moving ? intensity : settled;
      if (Math.abs(target - mr.lastGlow) < 0.004) continue;
      mr.lastGlow = target;

      const std = mr.material as THREE.MeshStandardMaterial;
      if (!std.emissive) continue;
      std.emissive.copy(mr.baseEmissive).lerp(color, target * 0.75);
      if (!mr.material.userData.heat) {
        std.emissiveIntensity = mr.baseEmissiveIntensity + target * 0.45;
      }

      /* let glass read a little stronger when it is the focus */
      if (mr.material.transparent && mr.material.opacity > 0.02) {
        mr.material.opacity = Math.min(1, mr.baseOpacity + target * 0.05);
      }
    }
  }

  /** heat glow pulse (reaction zone + coils) */
  updateHeat(time: number, level: number): void {
    for (const part of this.registry.all()) {
      for (const mr of part.materials) {
        if (!mr.material.userData.heat) continue;
        const flicker = 0.94 + 0.06 * Math.sin(time * 2.1) + 0.03 * Math.sin(time * 7.3);
        const std = mr.material as THREE.MeshStandardMaterial;
        std.emissiveIntensity = mr.baseEmissiveIntensity * level * flicker;
      }
    }
  }
}

/**
 * ExplodeController.ts — time-normalised, interruptible assembly animation.
 *
 * Every part owns its own progress value, so an explosion can be reversed
 * mid-flight without two animations fighting over the same transform.
 */

import type { PartRuntime, PartRegistry } from './PartRegistry';
import { clamp01, easeInOutCubic } from '../utils/easing';
import type { CategoryId } from '../data/cvdParts';

export interface ExplodeSnapshot {
  id: string;
  progress: number;
  target: number;
}

export class ExplodeController {
  private duration = 0.85; // seconds for a full 0 → 1 travel
  private listeners = new Set<() => void>();

  constructor(private readonly registry: PartRegistry) {}

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  setExploded(id: string, exploded: boolean, immediate = false): void {
    const part = this.registry.get(id);
    if (!part) return;
    part.target = exploded ? 1 : 0;
    if (immediate) {
      part.progress = part.target;
      this.apply(part);
    }
    this.notify();
  }

  toggle(id: string): void {
    const part = this.registry.get(id);
    if (!part) return;
    this.setExploded(id, part.target < 0.5);
  }

  setAll(exploded: boolean, stagger = true): void {
    for (const part of this.registry.all()) {
      part.target = exploded ? 1 : 0;
      part.delay = stagger ? part.order * 0.028 : 0;
    }
    this.notify();
  }

  setCategory(category: CategoryId, exploded: boolean): void {
    for (const part of this.registry.byCategory(category)) {
      part.target = exploded ? 1 : 0;
      part.delay = 0;
    }
    this.notify();
  }

  isExploded(id: string): boolean {
    return (this.registry.get(id)?.target ?? 0) > 0.5;
  }

  /** true when at least half of the parts are targeted to the exploded state */
  isMostlyExploded(): boolean {
    const parts = this.registry.all();
    if (!parts.length) return false;
    return parts.filter((p) => p.target > 0.5).length >= parts.length / 2;
  }

  isMoving(): boolean {
    return this.registry.all().some((p) => Math.abs(p.target - p.progress) > 0.001 || p.delay > 0);
  }

  /** average progress across every part, used by the HUD */
  overallProgress(): number {
    const parts = this.registry.all();
    if (!parts.length) return 0;
    let sum = 0;
    for (const p of parts) sum += p.progress;
    return sum / parts.length;
  }

  explodedCount(): number {
    return this.registry.all().filter((p) => p.progress > 0.98).length;
  }

  stateLabel(): 'assembled' | 'exploding' | 'exploded' | 'assembling' {
    const parts = this.registry.all();
    const avg = this.overallProgress();
    const targetAvg = parts.length
      ? parts.reduce((sum, p) => sum + p.target, 0) / parts.length
      : 0;

    if (this.isMoving()) return targetAvg > avg ? 'exploding' : 'assembling';
    return avg > 0.98 ? 'exploded' : 'assembled';
  }

  update(dt: number): void {
    const parts = this.registry.all();
    let changed = false;

    for (const part of parts) {
      if (part.delay > 0) {
        part.delay -= dt;
        continue;
      }
      const diff = part.target - part.progress;
      if (Math.abs(diff) < 0.0005) {
        if (part.progress !== part.target) {
          part.progress = part.target;
          this.apply(part);
          changed = true;
        }
        continue;
      }

      const step = dt / this.duration;
      const next = part.progress + Math.sign(diff) * Math.min(Math.abs(diff), step);
      part.progress = clamp01(next);
      this.apply(part);
      changed = true;
    }

    if (changed) this.notify();
  }

  private apply(part: PartRuntime): void {
    const eased = easeInOutCubic(part.progress);
    part.group.position.copy(part.basePosition).addScaledVector(part.offset, eased);
  }

  snapshot(): ExplodeSnapshot[] {
    return this.registry.all().map((p) => ({ id: p.config.id, progress: p.progress, target: p.target }));
  }
}

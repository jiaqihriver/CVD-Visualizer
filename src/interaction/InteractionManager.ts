/**
 * InteractionManager.ts — pointer picking, click/double-click semantics.
 *
 * Single click selects (and optionally toggles the explode state), double
 * click focuses the camera. Clicks that follow a camera drag are ignored.
 */

import * as THREE from 'three';
import type { PartRegistry, PartRuntime } from './PartRegistry';

export interface InteractionCallbacks {
  onHover(part: PartRuntime | null, clientX: number, clientY: number): void;
  onSelect(part: PartRuntime | null): void;
  onFocus(part: PartRuntime): void;
}

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private downX = 0;
  private downY = 0;
  private downTime = 0;
  private pointerDown = false;
  private clickTimer: number | null = null;
  private lastHoverId: string | null = null;
  private disposed = false;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly dom: HTMLCanvasElement,
    private readonly registry: PartRegistry,
    private readonly callbacks: InteractionCallbacks,
  ) {
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('pointerleave', this.onPointerLeave);
    dom.addEventListener('dblclick', this.onDoubleClick);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.dom.removeEventListener('pointermove', this.onPointerMove);
    this.dom.removeEventListener('pointerdown', this.onPointerDown);
    this.dom.removeEventListener('pointerup', this.onPointerUp);
    this.dom.removeEventListener('pointerleave', this.onPointerLeave);
    this.dom.removeEventListener('dblclick', this.onDoubleClick);
    if (this.clickTimer !== null) window.clearTimeout(this.clickTimer);
  }

  pick(clientX: number, clientY: number): PartRuntime | null {
    const rect = this.dom.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const hits = this.raycaster.intersectObjects(this.registry.interactiveMeshes, false);
    for (const hit of hits) {
      if ((hit.object as THREE.Mesh).visible === false) continue;
      const part = this.registry.resolve(hit.object);
      if (part && part.visible) return part;
    }
    return null;
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.pointerDown = true;
    this.downX = event.clientX;
    this.downY = event.clientY;
    this.downTime = performance.now();
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const moved = Math.hypot(event.clientX - this.downX, event.clientY - this.downY);
    const elapsed = performance.now() - this.downTime;
    this.pointerDown = false;
    if (moved > 6 || elapsed > 600) return;

    const part = this.pick(event.clientX, event.clientY);

    if (this.clickTimer !== null) {
      window.clearTimeout(this.clickTimer);
      this.clickTimer = null;
    }

    this.clickTimer = window.setTimeout(() => {
      this.clickTimer = null;
      this.callbacks.onSelect(part);
    }, 190);
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.pointerDown && Math.hypot(event.clientX - this.downX, event.clientY - this.downY) > 5) {
      if (this.lastHoverId !== null) {
        this.lastHoverId = null;
        this.callbacks.onHover(null, event.clientX, event.clientY);
      }
      this.dom.style.cursor = 'grabbing';
      return;
    }

    const part = this.pick(event.clientX, event.clientY);
    const id = part?.config.id ?? null;
    this.dom.style.cursor = part ? 'pointer' : 'grab';

    if (id !== this.lastHoverId) {
      this.lastHoverId = id;
      this.callbacks.onHover(part, event.clientX, event.clientY);
    } else if (part) {
      this.callbacks.onHover(part, event.clientX, event.clientY);
    }
  };

  private onPointerLeave = (): void => {
    this.pointerDown = false;
    this.lastHoverId = null;
    this.dom.style.cursor = 'grab';
    this.callbacks.onHover(null, 0, 0);
  };

  private onDoubleClick = (event: MouseEvent): void => {
    if (this.clickTimer !== null) {
      window.clearTimeout(this.clickTimer);
      this.clickTimer = null;
    }
    const part = this.pick(event.clientX, event.clientY);
    if (part) this.callbacks.onFocus(part);
  };
}

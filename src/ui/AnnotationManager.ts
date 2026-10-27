/**
 * AnnotationManager.ts — HTML callouts projected from 3D anchor points.
 *
 * Only key components, the hovered part and the selected part get a label;
 * a cheap screen-space distance test prevents most overlaps.
 */

import * as THREE from 'three';
import type { PartRegistry, PartRuntime } from '../interaction/PartRegistry';

interface LabelNode {
  root: HTMLDivElement;
  line: SVGLineElement;
  part: PartRuntime;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const LEADER = 52;

export class AnnotationManager {
  private labels = new Map<string, LabelNode>();
  private world = new THREE.Vector3();
  private projected = new THREE.Vector3();

  constructor(
    private readonly container: HTMLElement,
    private readonly svg: SVGSVGElement,
    private readonly camera: THREE.PerspectiveCamera,
    registry: PartRegistry,
  ) {
    for (const part of registry.all()) {
      const root = document.createElement('div');
      root.className = 'anno';
      root.dataset.part = part.config.id;

      const dot = document.createElement('span');
      dot.className = 'anno-dot';

      const card = document.createElement('div');
      card.className = 'anno-card';

      const name = document.createElement('span');
      name.className = 'anno-name';
      name.textContent = part.config.short ?? part.config.name;

      const param = document.createElement('span');
      param.className = 'anno-param';
      param.textContent = part.config.spec;

      card.append(name, param);
      root.append(dot, card);

      const line = document.createElementNS(SVG_NS, 'line');
      this.svg.appendChild(line);

      this.container.appendChild(root);
      this.labels.set(part.config.id, { root, line, part });
    }
  }

  setSvgSize(width: number, height: number): void {
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.svg.setAttribute('width', String(width));
    this.svg.setAttribute('height', String(height));
  }

  update(width: number, height: number): void {
    if (!width || !height) return;

    const candidates = [...this.labels.values()].filter(({ part }) => {
      if (!part.visible) return false;
      return part.selected || part.hovered || part.config.keyLabel === true;
    });

    candidates.sort((a, b) => {
      const pa = a.part.selected ? 0 : a.part.hovered ? 1 : 2;
      const pb = b.part.selected ? 0 : b.part.hovered ? 1 : 2;
      return pa - pb;
    });

    const accepted: { x: number; y: number; w: number; h: number }[] = [];
    const shown = new Set<string>();

    for (const node of candidates) {
      const part = node.part;
      part.anchor.getWorldPosition(this.world);
      this.projected.copy(this.world).project(this.camera);

      if (this.projected.z > 1 || this.projected.z < -1) continue;

      const sx = (this.projected.x * 0.5 + 0.5) * width;
      const sy = (-this.projected.y * 0.5 + 0.5) * height;

      if (sx < -40 || sx > width + 40 || sy < 4 || sy > height - 4) continue;

      const card = node.root.querySelector<HTMLElement>('.anno-card');
      const cw = card?.offsetWidth || 96;
      const ch = card?.offsetHeight || 36;
      const by = Math.max(4, Math.min(height - ch - 4, sy - ch / 2));

      const preferred: 'left' | 'right' = sx > width * 0.55 ? 'left' : 'right';
      const order: ('left' | 'right')[] = [preferred, preferred === 'left' ? 'right' : 'left'];

      let dir: 'left' | 'right' | null = null;
      let bx = 0;

      for (const option of order) {
        const candidate = option === 'right' ? sx + LEADER : sx - LEADER - cw;
        if (candidate < 6 || candidate + cw > width - 6) continue;
        const collides = accepted.some(
          (a) =>
            candidate < a.x + a.w + 6 &&
            candidate + cw + 6 > a.x &&
            by < a.y + a.h + 4 &&
            by + ch + 4 > a.y,
        );
        if (!collides) {
          dir = option;
          bx = candidate;
          break;
        }
      }

      if (!dir) continue;

      accepted.push({ x: bx, y: by, w: cw, h: ch });
      shown.add(part.config.id);

      const sign = dir === 'right' ? 1 : -1;

      node.root.dataset.dir = dir;
      node.root.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
      node.root.style.setProperty('--card-shift', `${(by + ch / 2 - sy).toFixed(1)}px`);
      node.root.classList.toggle('is-active', part.selected);

      node.line.setAttribute('x1', sx.toFixed(1));
      node.line.setAttribute('y1', sy.toFixed(1));
      node.line.setAttribute('x2', (sx + sign * LEADER).toFixed(1));
      node.line.setAttribute('y2', sy.toFixed(1));
      node.line.classList.toggle('is-active', part.selected);
    }

    for (const [id, node] of this.labels) {
      const visible = shown.has(id);
      node.root.classList.toggle('is-visible', visible);
      node.line.style.display = visible ? '' : 'none';
    }
  }
}

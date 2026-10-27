/**
 * PartRegistry.ts — owns every interactive part, its runtime state and
 * its cloned materials. Builders never mutate shared materials directly;
 * the registry clones them so highlights stay local to a single part.
 */

import * as THREE from 'three';
import { PARTS_BY_ID, type CVDPartConfig, type CategoryId } from '../data/cvdParts';

export interface MaterialRuntime {
  material: THREE.Material;
  baseEmissive: THREE.Color | null;
  baseEmissiveIntensity: number;
  baseOpacity: number;
  lastGlow: number;
}

export interface PartRuntime {
  config: CVDPartConfig;
  group: THREE.Group;
  anchor: THREE.Object3D;
  basePosition: THREE.Vector3;
  offset: THREE.Vector3;
  progress: number;
  target: number;
  delay: number;
  meshes: THREE.Mesh[];
  materials: MaterialRuntime[];
  glowMaterials: THREE.MeshStandardMaterial[];
  visible: boolean;
  hovered: boolean;
  selected: boolean;
  order: number;
}

const HIGHLIGHT = new THREE.Color('#46e8ff');

export class PartRegistry {
  private parts = new Map<string, PartRuntime>();
  readonly interactiveMeshes: THREE.Mesh[] = [];
  private heatLevel = 1;

  register(group: THREE.Group): PartRuntime {
    const config = PARTS_BY_ID[group.name];
    if (!config) {
      throw new Error(`[PartRegistry] unknown part group: "${group.name}"`);
    }

    const anchor = new THREE.Object3D();
    anchor.name = `${config.id}-anchor`;
    anchor.position.set(config.anchor[0], config.anchor[1], config.anchor[2]);
    group.add(anchor);

    const meshes: THREE.Mesh[] = [];
    const materials: MaterialRuntime[] = [];
    const glowMaterials: THREE.MeshStandardMaterial[] = [];

    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      const source = mesh.material as THREE.Material | THREE.Material[];
      const cloned = Array.isArray(source) ? source.map((m) => m.clone()) : source.clone();
      mesh.material = cloned;

      const list = Array.isArray(cloned) ? cloned : [cloned];
      for (const mat of list) {
        const standard = mat as THREE.MeshStandardMaterial;
        const hasEmissive = standard.emissive instanceof THREE.Color;
        if (hasEmissive) glowMaterials.push(standard);

        materials.push({
          material: mat,
          baseEmissive: hasEmissive ? standard.emissive.clone() : null,
          baseEmissiveIntensity: hasEmissive ? standard.emissiveIntensity : 1,
          baseOpacity: mat.opacity,
          lastGlow: -1,
        });
      }

      const transparent = list.some((m) => m.transparent);
      const unlit = list.some((m) => (m as THREE.MeshBasicMaterial).isMeshBasicMaterial === true);
      if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
      const bulk = (mesh.geometry.boundingSphere?.radius ?? 0) > 0.32;
      mesh.castShadow = !transparent && !unlit && bulk;
      mesh.receiveShadow = !unlit;
      mesh.userData.partId = config.id;
      meshes.push(mesh);
      this.interactiveMeshes.push(mesh);
    });

    const runtime: PartRuntime = {
      config,
      group,
      anchor,
      basePosition: group.position.clone(),
      offset: new THREE.Vector3(config.explode[0], config.explode[1], config.explode[2]),
      progress: 0,
      target: 0,
      delay: 0,
      meshes,
      materials,
      glowMaterials,
      visible: true,
      hovered: false,
      selected: false,
      order: this.parts.size,
    };

    this.parts.set(config.id, runtime);
    return runtime;
  }

  get(id: string): PartRuntime | undefined {
    return this.parts.get(id);
  }

  all(): PartRuntime[] {
    return [...this.parts.values()];
  }

  byCategory(category: CategoryId): PartRuntime[] {
    return this.all().filter((p) => p.config.category === category);
  }

  resolve(object: THREE.Object3D | null): PartRuntime | null {
    let node: THREE.Object3D | null = object;
    while (node) {
      const id = node.userData?.partId as string | undefined;
      if (id) {
        const part = this.parts.get(id);
        if (part) return part;
      }
      node = node.parent;
    }
    return null;
  }

  setVisible(id: string, visible: boolean): void {
    const part = this.parts.get(id);
    if (!part) return;
    part.visible = visible;
    part.group.visible = visible;
  }

  /** 0..1 thermal level, modulates the emissive base of heating elements */
  setHeatLevel(level: number): void {
    this.heatLevel = level;
    for (const part of this.parts.values()) {
      for (const mr of part.materials) {
        if (mr.material.userData.heat) {
          mr.baseEmissiveIntensity = 1.25 * level;
        }
      }
    }
  }

  getHeatLevel(): number {
    return this.heatLevel;
  }

  glowColorFor(part: PartRuntime): THREE.Color {
    return new THREE.Color(part.config.accent).lerp(HIGHLIGHT, 0.55);
  }

  worldAnchor(id: string, target: THREE.Vector3): boolean {
    const part = this.parts.get(id);
    if (!part) return false;
    part.anchor.getWorldPosition(target);
    return true;
  }

  dispose(): void {
    for (const part of this.parts.values()) {
      for (const mr of part.materials) mr.material.dispose();
      for (const mesh of part.meshes) mesh.geometry.dispose();
    }
    this.parts.clear();
    this.interactiveMeshes.length = 0;
  }
}

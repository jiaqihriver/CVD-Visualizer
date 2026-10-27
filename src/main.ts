/**
 * main.ts — application bootstrap and central coordinator.
 *
 * Three.js / DOM / UI are wired here:
 *   SceneManager  → renderer, camera, lights, post FX
 *   PartRegistry  → all interactive parts + cloned materials
 *   Explode / Highlight / Camera / Annotation controllers
 *   UIController  → panels + HUD, calling back through AppActions
 */

import * as THREE from 'three';
import './styles/base.css';
import './styles/layout.css';
import './styles/panels.css';
import './styles/effects.css';

import { SceneManager } from './core/SceneManager';
import { PartRegistry } from './interaction/PartRegistry';
import { ExplodeController } from './interaction/ExplodeController';
import { HighlightController } from './interaction/HighlightController';
import { CameraAnimator } from './interaction/CameraAnimator';
import { InteractionManager } from './interaction/InteractionManager';
import { AnnotationManager } from './ui/AnnotationManager';
import { UIController, type AppActions } from './ui/UIController';
import { buildCVDModel } from './models/CVDModelBuilder';
import { GasFlow } from './models/GasFlow';
import { VIEWS } from './data/equipmentConfig';
import type { CategoryId } from './data/cvdParts';

const canvas = document.getElementById('scene') as HTMLCanvasElement;

const loader = document.getElementById('loader') as HTMLDivElement;
const loaderBar = document.getElementById('loader-bar') as HTMLElement;
const loaderSub = document.getElementById('loader-sub') as HTMLElement;
const intro = document.getElementById('intro') as HTMLElement;

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => window.setTimeout(resolve, 0));
  });

const setLoader = (pct: number, label: string): void => {
  loaderBar.style.width = `${pct}%`;
  loaderSub.textContent = label;
};

const fatal = (detail: string): void => {
  loader.classList.remove('is-done');
  loaderBar.style.width = '100%';
  loaderBar.style.background = '#ff657a';
  const label = loader.querySelector('.loader-label');
  if (label) {
    label.textContent = 'Unable to start the 3D scene';
  }
  loaderSub.textContent = detail;
  loaderSub.style.letterSpacing = '0.08em';
  loaderSub.style.lineHeight = '1.7';
  loaderSub.style.textTransform = 'none';
};

/**
 * A friendly capability probe before we ask three.js for a context.
 * WebGL 2 is required by the renderer used here.
 */
function supportsWebGL2(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function boot(): Promise<void> {
  if (!supportsWebGL2()) {
    fatal(
      'WebGL 2 is not available in this browser. Enable hardware acceleration, update the GPU driver, or open the page in a current Chrome / Edge / Safari / Firefox build.',
    );
    return;
  }

  setLoader(8, 'INITIALIZING THREE.JS RENDERER');
  await nextFrame();

  let sceneManager: SceneManager;
  try {
    sceneManager = new SceneManager(canvas);
  } catch (error) {
    fatal(
      `The WebGL renderer could not be created. ${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }

  setLoader(26, 'PROCEDURAL GEOMETRY / 23 PARTS');
  await nextFrame();

  const registry = new PartRegistry();
  const model = buildCVDModel(registry);
  sceneManager.scene.add(model);

  /* portrait screens get a wider framing so the whole bench is visible */
  if (window.innerWidth < window.innerHeight) {
    sceneManager.frameWideModel(new THREE.Box3().setFromObject(model));
  }

  const gasFlow = new GasFlow();
  sceneManager.scene.add(gasFlow.group);

  setLoader(58, 'PART REGISTRY / MATERIAL CLONING');
  await nextFrame();

  const explode = new ExplodeController(registry);
  const highlight = new HighlightController(registry);
  const cameraAnimator = new CameraAnimator(sceneManager.camera, sceneManager.controls);

  const annotations = new AnnotationManager(
    document.getElementById('annotations') as HTMLElement,
    document.getElementById('leader-svg') as unknown as SVGSVGElement,
    sceneManager.camera,
    registry,
  );

  let viewportW = window.innerWidth;
  let viewportH = window.innerHeight;
  annotations.setSvgSize(viewportW, viewportH);
  sceneManager.addResizeListener((w, h) => {
    viewportW = w;
    viewportH = h;
    annotations.setSvgSize(w, h);
  });

  setLoader(76, 'BINDING INTERACTION & UI');
  await nextFrame();

  /* ------------------------------------------------------------------ */
  /* app state                                                           */
  /* ------------------------------------------------------------------ */

  let selectedId: string | null = null;
  let clickMode = true;
  let flowOn = true;
  let heatOn = true;

  const selectPart = (id: string | null, scroll = false): void => {
    selectedId = id;
    for (const part of registry.all()) {
      part.selected = part.config.id === id;
    }
    if (id) {
      const part = registry.get(id);
      if (part && !part.visible) {
        registry.setVisible(id, true);
        ui.toast('Part was hidden — visible again');
      }
    }
    ui.setSelected(id, scroll);
  };

  const assembledBounds = (): THREE.Box3 => {
    const box = new THREE.Box3();
    for (const part of registry.all()) {
      const b = new THREE.Box3().setFromObject(part.group);
      if (!b.isEmpty()) box.union(b);
    }
    return box;
  };

  const explodedBounds = (): THREE.Box3 => {
    const box = new THREE.Box3();
    for (const part of registry.all()) {
      const b = new THREE.Box3().setFromObject(part.group);
      if (b.isEmpty()) continue;
      const delta = part.basePosition.clone().add(part.offset).sub(part.group.position);
      b.translate(delta);
      box.union(b);
    }
    return box;
  };

  const actions: AppActions = {
    selectPart,
    toggleExplode: (id) => {
      const part = registry.get(id);
      if (!part) return;
      explode.toggle(id);
      if (!part.selected) selectPart(id);
    },
    setExploded: (id, value) => {
      explode.setExploded(id, value);
      selectPart(id);
    },
    focusPart: (id) => {
      const part = registry.get(id);
      if (!part) return;
      const box = new THREE.Box3().setFromObject(part.group);
      if (box.isEmpty()) return;
      const centre = box.getCenter(new THREE.Vector3());
      const outward = centre.clone().sub(new THREE.Vector3(0, 0, 2.4));
      outward.z = 0;
      if (outward.lengthSq() < 0.6) {
        outward.copy(sceneManager.camera.position).sub(sceneManager.controls.target);
        outward.z = 0;
      }
      outward.normalize();
      outward.z = 0.62;
      outward.normalize();
      cameraAnimator.focusOn(box, outward);
      selectPart(id);
    },
    toggleVisibility: (id) => {
      const part = registry.get(id);
      if (!part) return;
      registry.setVisible(id, !part.visible);
      ui.toast(part.visible ? `${part.config.name} visible` : `${part.config.name} hidden`);
    },
    explodeAll: () => {
      explode.setAll(true);
      const box = explodedBounds();
      if (!box.isEmpty()) cameraAnimator.fitBox(box, 1.06, 1.0);
      ui.toast('Exploding the complete assembly');
    },
    assembleAll: () => {
      explode.setAll(false);
      cameraAnimator.fitBox(assembledBounds(), 1.04, 1.0);
      ui.toast('Restoring the assembled state');
    },
    toggleCategory: (category: CategoryId) => {
      const parts = registry.byCategory(category);
      const anyAssembled = parts.some((p) => p.progress < 0.5);
      explode.setCategory(category, anyAssembled);
      const first = parts[0];
      if (first && anyAssembled) selectPart(first.config.id);
    },
    setView: (view) => {
      const preset = VIEWS[view] ?? VIEWS.iso;
      cameraAnimator.flyTo(preset, 0.95);
      if (view === 'reset') ui.resetViewDock();
    },
    toggleFlow: () => {
      flowOn = !flowOn;
      gasFlow.setEnabled(flowOn);
      return flowOn;
    },
    toggleHeat: () => {
      heatOn = !heatOn;
      return heatOn;
    },
    toggleClickMode: () => {
      clickMode = !clickMode;
      return clickMode;
    },
    isFlowOn: () => flowOn,
    isHeatOn: () => heatOn,
    isClickMode: () => clickMode,
    togglePanels: () => {
      const mobile = window.matchMedia('(max-width: 900px)').matches;
      if (mobile) document.body.classList.toggle('panels-open');
      else document.body.classList.toggle('panels-hidden');
    },
    showHelp: () => ui.showHelp(),
    hideHelp: () => ui.hideHelp(),
  };

  /* ------------------------------------------------------------------ */
  /* UI, interaction, annotation                                         */
  /* ------------------------------------------------------------------ */

  const ui = new UIController(actions, registry, explode);

  const interaction = new InteractionManager(
    sceneManager.camera,
    canvas,
    registry,
    {
      onHover: (part, x, y) => {
        const id = part?.config.id ?? null;
        for (const p of registry.all()) {
          p.hovered = p.config.id === id;
        }
        ui.showTooltip(id, x, y);
      },
      onSelect: (part) => {
        if (!part) {
          selectPart(null);
          return;
        }
        const id = part.config.id;
        const wasSelected = selectedId === id;
        selectPart(id);
        if (!clickMode) return;
        if (wasSelected) explode.toggle(id);
        else explode.setExploded(id, true);
        annotations.update(viewportW, viewportH);
      },
      onFocus: (part) => {
        actions.focusPart(part.config.id);
      },
    },
  );

  /* camera flights cancel as soon as the user grabs the scene */
  canvas.addEventListener('pointerdown', () => cameraAnimator.cancel());

  /* ------------------------------------------------------------------ */
  /* render loop                                                         */
  /* ------------------------------------------------------------------ */

  const clock = new THREE.Clock();
  const glowMesh = model.getObjectByName('heat-glow') as THREE.Mesh | undefined;
  const glowMaterial = glowMesh?.material as THREE.MeshBasicMaterial | undefined;
  let time = 0;
  let fpsFrames = 0;
  let fpsLast = performance.now();
  let syncTime = 0;
  const bootTime = performance.now();
  let quality = 0;
  let lowStreak = 0;

  const animate = (): void => {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1);
    if (document.hidden) return;

    time += dt;
    fpsFrames += 1;
    syncTime += dt;

    explode.update(dt);
    cameraAnimator.update(dt);

    const heatLevel = heatOn ? 1 : 0.08;
    highlight.update(time);
    highlight.updateHeat(time, heatLevel);
    sceneManager.updateHeatLight(heatLevel, time);

    if (glowMaterial) {
      const pulse = 0.86 + 0.14 * Math.sin(time * 2.6);
      glowMaterial.opacity = (0.03 + 0.06 * heatLevel) * pulse;
    }

    gasFlow.opacityScale = Math.max(0, 1 - explode.overallProgress() * 4.5);
    gasFlow.update(dt);

    sceneManager.render();
    annotations.update(viewportW, viewportH);

    if (syncTime > 0.12) {
      syncTime = 0;
      ui.sync();
    }

    const now = performance.now();
    if (now - fpsLast >= 500) {
      const fps = (fpsFrames * 1000) / (now - fpsLast);
      ui.setFps(fps);
      fpsFrames = 0;
      fpsLast = now;

      /* auto-downgrade once the scene has warmed up and is still slow */
      if (now - bootTime > 3500 && quality < 2) {
        if (fps < 24) {
          lowStreak += 1;
          if (lowStreak >= 2) {
            quality += 1;
            lowStreak = 0;
            sceneManager.setQualityLevel(quality);
            ui.setRendererLabel(quality === 1 ? 'WEBGL 2.0 · ECO' : 'WEBGL 2.0 · SAFE');
          }
        } else {
          lowStreak = 0;
        }
      }
    }
  };

  animate();

  /* ------------------------------------------------------------------ */
  /* finish boot                                                         */
  /* ------------------------------------------------------------------ */

  setLoader(96, 'COMPILING SHADERS');
  await nextFrame();
  await nextFrame();

  setLoader(100, 'READY');
  ui.setRendererLabel(
    sceneManager.renderer.capabilities.isWebGL2 ? 'WEBGL 2.0' : 'WEBGL',
  );

  const params = new URLSearchParams(window.location.search);
  const skipIntro = params.get('intro') === '0';

  window.setTimeout(() => {
    loader.classList.add('is-done');
    intro.hidden = skipIntro;
  }, 520);

  if (params.get('explode') === '1') {
    window.setTimeout(() => explode.setAll(true), 700);
  }

  /* intro is dismissible with a click on the backdrop */
  intro.addEventListener('click', (event) => {
    if (event.target === intro) actions.hideHelp();
  });

  /* expose for debugging in the console */
  Object.assign(window as unknown as Record<string, unknown>, {
    __cvd: {
      THREE,
      sceneManager,
      registry,
      explode,
      gasFlow,
      ui,
      actions,
      interaction,
      cameraAnimator,
      annotations,
    },
  });
}

boot().catch((error: unknown) => {
  console.error(error);
  fatal(error instanceof Error ? error.message : String(error));
  const label = loader.querySelector('.loader-label');
  if (label) {
    label.textContent = 'The 3D scene failed to initialise';
  }
});

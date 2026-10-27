/**
 * SceneManager.ts — renderer, camera, lights, environment and post FX.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { VIEWS } from '../data/equipmentConfig';
import { makeContactShadow } from '../models/GeometryFactory';

export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  readonly heatLight: THREE.PointLight;

  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private keyLight!: THREE.DirectionalLight;
  private resizeListeners = new Set<(w: number, h: number) => void>();

  constructor(canvas: HTMLCanvasElement) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene.background = new THREE.Color(0x05080f);
    this.scene.fog = new THREE.Fog(0x05080f, 32, 92);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 400);
    this.camera.up.set(0, 0, 1);
    const iso = VIEWS.iso;
    this.camera.position.set(iso.position[0], iso.position[1], iso.position[2]);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(iso.target[0], iso.target[1], iso.target[2]);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.rotateSpeed = 0.72;
    this.controls.zoomSpeed = 0.9;
    this.controls.panSpeed = 0.8;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 68;
    this.controls.minPolarAngle = 0.05;
    this.controls.maxPolarAngle = Math.PI * 0.52;
    this.controls.update();

    this.setupEnvironment();
    this.setupLights();
    this.setupGround();
    this.heatLight = new THREE.PointLight(0xff7a2f, 7, 9, 2);
    this.heatLight.position.set(0, 0, 2.9);
    this.scene.add(this.heatLight);

    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(width, height);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.52, 0.72, 0.82);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    window.addEventListener('resize', this.onResize);
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => this.onResize());
      ro.observe(canvas.parentElement ?? canvas);
    }
  }

  private setupEnvironment(): void {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new RoomEnvironment();
    const envMap = pmrem.fromScene(envScene, 0.045).texture;
    this.scene.environment = envMap;
    this.scene.environmentIntensity = 0.75;
    pmrem.dispose();
    envScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }

  private setupLights(): void {
    const hemi = new THREE.HemisphereLight(0xa8dcff, 0x0a1220, 0.7);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xdfefff, 3.0);
    key.position.set(11, 13, 19);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 60;
    key.shadow.camera.left = -18;
    key.shadow.camera.right = 18;
    key.shadow.camera.top = 18;
    key.shadow.camera.bottom = -18;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.02;
    this.keyLight = key;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x36d9e8, 1.15);
    rim.position.set(-16, -12, 7);
    this.scene.add(rim);

    const fill = new THREE.DirectionalLight(0x648bff, 0.7);
    fill.position.set(8, -18, 5);
    this.scene.add(fill);

    const top = new THREE.DirectionalLight(0xfff2e0, 0.45);
    top.position.set(0, 6, 22);
    this.scene.add(top);

    /* warm bounce from the operator side so the metal is not purely cyan */
    const bounce = new THREE.DirectionalLight(0xffd8b4, 0.85);
    bounce.position.set(-7, 13, 4);
    this.scene.add(bounce);
  }

  private setupGround(): void {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: 0x060b12, roughness: 0.94, metalness: 0.18 }),
    );
    floor.position.z = -1.53;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(64, 64, 0x2a6a80, 0x102432);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -1.515;
    const gridMat = grid.material as THREE.LineBasicMaterial;
    gridMat.transparent = true;
    gridMat.opacity = 0.5;
    gridMat.depthWrite = false;
    this.scene.add(grid);

    const shadow = makeContactShadow(13.5, 0.6);
    shadow.position.z = -1.5;
    this.scene.add(shadow);

    const under = makeContactShadow(4.5, 0.5);
    under.position.z = -1.498;
    this.scene.add(under);
  }

  onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (!width || !height) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);
    for (const cb of this.resizeListeners) cb(width, height);
  };

  addResizeListener(cb: (w: number, h: number) => void): void {
    this.resizeListeners.add(cb);
  }

  setBloom(enabled: boolean): void {
    this.bloom.enabled = enabled;
  }

  /**
   * Progressive quality fallback for integrated GPUs and software renderers.
   * 0 = full, 1 = reduced resolution, 2 = no bloom + native resolution.
   */
  setQualityLevel(level: number): void {
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    this.bloom.enabled = level < 2;
    this.bloom.strength = level === 0 ? 0.52 : 0.42;
    this.renderer.shadowMap.enabled = level < 2;
    this.keyLight.castShadow = level < 2;
    const ratio = level === 0 ? dpr : level === 1 ? Math.min(dpr, 1.2) : 1;
    this.renderer.setPixelRatio(ratio);
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.bloom.setSize(window.innerWidth, window.innerHeight);

    /* shadow defines live in the shader — force a rebuild once on change */
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        if (m) m.needsUpdate = true;
      });
    });
  }

  updateHeatLight(level: number, time: number): void {
    const flicker = 0.92 + 0.08 * Math.sin(time * 2.3) + 0.04 * Math.sin(time * 7.1);
    this.heatLight.intensity = 7 * level * flicker;
    this.heatLight.visible = level > 0.02;
  }

  render(): void {
    this.controls.update();
    this.composer.render();
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.scene.environment?.dispose();
  }
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import { ACUPOINT_BY_ID } from '@/data/acupoints';
import { SEMANTIC_HOTSPOTS } from '@/data/hotspots';
import { SCENE_THEMES } from '@/data/themes';
import type {
  AnatomicalLayer,
  AnatomyCatalog,
  LayerVisibilityState,
  MeshAnatomicalLayer,
  RegionId,
  ThemeMode,
} from '@/types/anatomy';
import type {
  AnatomyBridge,
  CameraPresetView,
  DepthPickCandidate,
  LayerLoadProgress,
  ProjectedCalloutItem,
} from '@/types/bridge';
import type { PainPoint } from '@/types/session';
import { CameraDirector } from './CameraDirector';
import { LayerMaterialSystem, makeMeshStructureKey } from './LayerMaterialSystem';
import { MarkerOverlay } from './MarkerOverlay';
import { XRayPicker } from './XRayPicker';

type HoverListener = (
  hit: DepthPickCandidate | null,
  screenPos: { x: number; y: number } | null,
) => void;
type DepthPickListener = (
  hits: DepthPickCandidate[],
  screenPos: { x: number; y: number },
) => void;
type ProgressListener = (status: LayerLoadProgress) => void;
type CalloutsListener = (
  items: ProjectedCalloutItem[],
  viewport: { width: number; height: number },
) => void;

const MESH_LAYERS: MeshAnatomicalLayer[] = [
  'skin',
  'muscle',
  'tendon',
  'ligament',
  'bone',
  'nerve',
  'vascular',
  'organ',
];

function isMeshLayer(layer: AnatomicalLayer): layer is MeshAnatomicalLayer {
  return layer !== 'acupoint';
}

export class AnatomyEngine implements AnatomyBridge {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private anatomyRoot = new THREE.Group();
  private director: CameraDirector;
  private materials = new LayerMaterialSystem();
  private overlay = new MarkerOverlay();
  private picker = new XRayPicker();
  private loader = new GLTFLoader();

  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;

  private catalog: AnatomyCatalog | null = null;
  private loadedLayers = new Set<MeshAnatomicalLayer>();
  private loadingLayers = new Set<MeshAnatomicalLayer>();
  private failedLayers = new Set<MeshAnatomicalLayer>();
  private normalizedApplied = false;

  private layerState: LayerVisibilityState;
  private showCallouts = true;
  private peeledKeys = new Set<string>();
  private selectedKeys: string[] = [];
  private painPoints: PainPoint[] = [];

  private hoverListeners = new Set<HoverListener>();
  private depthPickListeners = new Set<DepthPickListener>();
  private progressListeners = new Set<ProgressListener>();
  private calloutListeners = new Set<CalloutsListener>();

  private rafId: number | null = null;
  private resizeObserver: ResizeObserver;
  private pointerDownPos: { x: number; y: number } | null = null;
  private lastHoverTs = 0;
  private lastCalloutTs = 0;
  private calloutsDirty = true;
  private lastCamSignature = '';
  private disposed = false;

  constructor(
    container: HTMLElement,
    initialTheme: ThemeMode,
    initialLayers: LayerVisibilityState,
  ) {
    this.container = container;
    this.layerState = initialLayers;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.anatomyRoot.name = 'AnatomyRoot';
    this.scene.add(this.anatomyRoot);
    this.scene.add(this.overlay.rootGroup);

    // 四光源影棚照明：确保浅色与深色模式下肌肉纹理、神经黄线与骨骼边界都纤毫毕现
    const themeCfg = SCENE_THEMES[initialTheme];
    this.ambientLight = new THREE.AmbientLight(themeCfg.ambientColor, themeCfg.ambientIntensity);
    this.hemiLight = new THREE.HemisphereLight(
      themeCfg.hemiSkyColor,
      themeCfg.hemiGroundColor,
      themeCfg.hemiIntensity,
    );
    this.hemiLight.position.set(0, 3.2, 0);

    this.keyLight = new THREE.DirectionalLight(themeCfg.keyLightColor, themeCfg.keyLightIntensity);
    this.keyLight.position.set(2.2, 3.0, 2.8);

    this.fillLight = new THREE.DirectionalLight(
      themeCfg.fillLightColor,
      themeCfg.fillLightIntensity,
    );
    this.fillLight.position.set(-2.6, 1.4, 2.0);

    this.rimLight = new THREE.DirectionalLight(themeCfg.rimLightColor, themeCfg.rimLightIntensity);
    this.rimLight.position.set(-1.8, 2.4, -2.8);

    this.scene.add(
      this.ambientLight,
      this.hemiLight,
      this.keyLight,
      this.fillLight,
      this.rimLight,
    );

    const floorRing = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.252, 48),
      new THREE.MeshBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
      }),
    );
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = 0.002;
    this.scene.add(floorRing);

    this.director = new CameraDirector(this.renderer.domElement, width / height);
    this.loader.setMeshoptDecoder(MeshoptDecoder);

    this.setTheme(initialTheme);
    this.overlay.setShowAcupoints(initialLayers.acupoint.visible);
    this.bindPointerEvents();

    this.resizeObserver = new ResizeObserver(() => {
      if (this.disposed) return;
      const w = Math.max(1, this.container.clientWidth);
      const h = Math.max(1, this.container.clientHeight);
      this.renderer.setSize(w, h);
      this.director.resize(w, h);
      this.calloutsDirty = true;
    });
    this.resizeObserver.observe(container);

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
    });

    this.startLoop();
    void this.initCatalogAndLoadDefaultLayers();

    (window as unknown as { __anatomyBridge?: AnatomyBridge }).__anatomyBridge = this;
  }

  private async initCatalogAndLoadDefaultLayers(): Promise<void> {
    try {
      await MeshoptDecoder.ready;
      const res = await fetch('/anatomy-data/catalog.json');
      if (!res.ok) {
        throw new Error(`无法加载解剖清单 catalog.json (HTTP ${res.status})`);
      }
      this.catalog = (await res.json()) as AnatomyCatalog;
      this.picker.setCatalog(this.catalog);
      if (this.catalog.materialPalette?.length) {
        this.materials.setMaterialPalette(this.catalog.materialPalette);
      }
      this.applyCatalogAlignment();

      const layersToLoad = MESH_LAYERS.filter((l) => this.layerState[l].visible);
      await Promise.all(layersToLoad.map((l) => this.ensureLayerLoaded(l)));
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载 3D 解剖清单失败';
      this.emitProgress({ layer: 'bone', loaded: 0, total: 1, done: true, error: message });
    }
  }

  private async ensureLayerLoaded(layer: MeshAnatomicalLayer): Promise<void> {
    if (this.disposed || !this.catalog) return;
    if (this.loadedLayers.has(layer) || this.loadingLayers.has(layer)) return;

    const assets = this.catalog.layers[layer] ?? [];
    if (assets.length === 0) {
      this.loadedLayers.add(layer);
      this.emitProgress({ layer, loaded: 1, total: 1, done: true });
      return;
    }

    this.loadingLayers.add(layer);
    this.failedLayers.delete(layer);
    this.emitProgress({ layer, loaded: 0, total: assets.length, done: false });

    let loadedCount = 0;
    let firstError: string | undefined;

    await Promise.all(
      assets.map(async (asset) => {
        try {
          const gltf = await this.loader.loadAsync(asset.url);
          if (this.disposed) return;

          const group = gltf.scene;
          group.name = `layer_${layer}_${asset.system}`;

          group.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              const singleKey =
                !obj.geometry.attributes['_id'] && !obj.geometry.attributes['_ID']
                  ? makeMeshStructureKey(asset.system, obj.name || obj.uuid)
                  : undefined;
              this.materials.registerMesh(obj, layer, asset.system, singleKey);
            }
          });

          this.anatomyRoot.add(group);
          if (!this.normalizedApplied) this.applyCatalogAlignment();
          this.materials.applyLayerVisibility(this.layerState);
          this.materials.setSelectedStructures(this.selectedKeys);

          loadedCount += 1;
          this.emitProgress({
            layer,
            loaded: loadedCount,
            total: assets.length,
            done: loadedCount >= assets.length,
          });
        } catch (err) {
          firstError = err instanceof Error ? err.message : `加载 ${asset.url} 失败`;
          this.failedLayers.add(layer);
        }
      }),
    );

    this.loadingLayers.delete(layer);
    if (firstError) {
      this.emitProgress({
        layer,
        loaded: loadedCount,
        total: assets.length,
        done: true,
        error: firstError,
      });
    } else {
      this.loadedLayers.add(layer);
      this.emitProgress({ layer, loaded: assets.length, total: assets.length, done: true });
    }
  }

  private applyCatalogAlignment(): void {
    if (this.normalizedApplied) return;
    const b = this.catalog?.bounds;
    if (b && b.min.length === 3 && b.max.length === 3) {
      const centerX = (b.min[0] + b.max[0]) * 0.5;
      const minY = b.min[1];
      const centerZ = (b.min[2] + b.max[2]) * 0.5;
      const height = b.max[1] - b.min[1];
      const scale = height >= 1.45 && height <= 1.95 ? 1.0 : 1.72 / Math.max(0.1, height);

      this.anatomyRoot.scale.setScalar(scale);
      this.anatomyRoot.position.set(-centerX * scale, -minY * scale, -centerZ * scale);
      this.anatomyRoot.updateMatrixWorld(true);
      this.normalizedApplied = true;
    }
  }

  private bindPointerEvents(): void {
    const dom = this.renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (this.director.isUserDragging) return;
      const now = performance.now();
      if (now - this.lastHoverTs < 32) return;
      this.lastHoverTs = now;

      const hit = this.picker.pickHover(
        e.clientX,
        e.clientY,
        dom,
        this.director.camera,
        this.materials,
        this.overlay,
      );

      if (hit) {
        dom.style.cursor = 'pointer';
        if (hit.source === 'hotspot' || hit.source === 'acupoint') {
          this.overlay.setHoveredAnchor(hit.structureKey);
          this.materials.setHoveredStructure(null);
        } else {
          this.overlay.setHoveredAnchor(null);
          this.materials.setHoveredStructure(hit.structureKey);
        }
        const screenPos = { x: e.clientX, y: e.clientY };
        this.hoverListeners.forEach((cb) => cb(hit, screenPos));
      } else {
        dom.style.cursor = 'grab';
        this.overlay.setHoveredAnchor(null);
        this.materials.setHoveredStructure(null);
        this.hoverListeners.forEach((cb) => cb(null, null));
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!this.pointerDownPos) return;
      const dx = e.clientX - this.pointerDownPos.x;
      const dy = e.clientY - this.pointerDownPos.y;
      this.pointerDownPos = null;
      if (Math.hypot(dx, dy) > 6) return;

      const hits = this.picker.pickDepth(
        e.clientX,
        e.clientY,
        dom,
        this.director.camera,
        this.materials,
        this.overlay,
        false,
      );
      if (hits.length > 0) {
        const pos = { x: e.clientX, y: e.clientY };
        this.depthPickListeners.forEach((cb) => cb(hits, pos));
      }
    };

    const onPointerLeave = () => {
      this.overlay.setHoveredAnchor(null);
      this.materials.setHoveredStructure(null);
      this.hoverListeners.forEach((cb) => cb(null, null));
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointerleave', onPointerLeave);
  }

  private startLoop(): void {
    const tick = (now: number) => {
      if (this.disposed) return;
      this.rafId = requestAnimationFrame(tick);
      this.director.update(now);
      this.overlay.update(now, this.director.camera);
      this.renderer.render(this.scene, this.director.camera);

      // 仅在相机变化或数据脏时更新 2D 专业引导线投影（节流 45ms，零卡顿）
      if (this.calloutListeners.size > 0 && now - this.lastCalloutTs >= 45) {
        const c = this.director.camera.position;
        const t = this.director.controls.target;
        const sig = `${c.x.toFixed(3)},${c.y.toFixed(3)},${c.z.toFixed(3)}|${t.x.toFixed(3)},${t.y.toFixed(3)},${t.z.toFixed(3)}`;
        if (this.calloutsDirty || sig !== this.lastCamSignature) {
          this.lastCamSignature = sig;
          this.calloutsDirty = false;
          this.lastCalloutTs = now;
          const w = this.container.clientWidth;
          const h = this.container.clientHeight;
          const items = this.overlay.projectCallouts(
            this.director.camera,
            w,
            h,
            this.painPoints,
            this.showCallouts,
          );
          this.calloutListeners.forEach((cb) => cb(items, { width: w, height: h }));
        }
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private emitProgress(status: LayerLoadProgress): void {
    this.progressListeners.forEach((cb) => cb(status));
  }

  // ==================== AnatomyBridge 实现 ====================

  focusRegion(regionId: RegionId, useAltView = false): void {
    this.overlay.setActiveRegion(regionId);
    this.director.focusRegion(regionId, useAltView);
    this.calloutsDirty = true;
  }

  focusStructure(structureKey: string): void {
    const acu = ACUPOINT_BY_ID[structureKey];
    if (acu) {
      this.overlay.setActiveRegion(acu.regionId);
      this.director.focusPoint(acu.position, 0.44);
      this.highlightStructures([structureKey]);
      this.calloutsDirty = true;
      return;
    }
    const hs = SEMANTIC_HOTSPOTS.find((h) => h.structureKey === structureKey);
    if (hs) {
      this.overlay.setActiveRegion(hs.regionId);
      this.director.focusPoint(hs.position, 0.44);
      this.highlightStructures([structureKey]);
      this.calloutsDirty = true;
    }
  }

  highlightStructures(structureKeys: string[]): void {
    this.selectedKeys = structureKeys;
    this.materials.setSelectedStructures(structureKeys);
  }

  clearHighlights(): void {
    this.selectedKeys = [];
    this.materials.setSelectedStructures([]);
    this.materials.setHoveredStructure(null);
  }

  setLayerState(layers: LayerVisibilityState): void {
    this.layerState = layers;
    this.materials.applyLayerVisibility(layers);
    this.overlay.setShowAcupoints(layers.acupoint.visible);
    this.calloutsDirty = true;

    (Object.keys(layers) as AnatomicalLayer[]).forEach((layer) => {
      if (isMeshLayer(layer) && layers[layer].visible && !this.loadedLayers.has(layer)) {
        void this.ensureLayerLoaded(layer);
      }
    });
  }

  setShowHotspots(show: boolean): void {
    this.overlay.setShowHotspots(show);
    this.calloutsDirty = true;
  }

  setShowCallouts(show: boolean): void {
    this.showCallouts = show;
    this.calloutsDirty = true;
  }

  setTheme(theme: ThemeMode): void {
    const cfg = SCENE_THEMES[theme];
    this.ambientLight.color.setHex(cfg.ambientColor);
    this.ambientLight.intensity = cfg.ambientIntensity;
    this.hemiLight.color.setHex(cfg.hemiSkyColor);
    this.hemiLight.groundColor.setHex(cfg.hemiGroundColor);
    this.hemiLight.intensity = cfg.hemiIntensity;
    this.keyLight.color.setHex(cfg.keyLightColor);
    this.keyLight.intensity = cfg.keyLightIntensity;
    this.fillLight.color.setHex(cfg.fillLightColor);
    this.fillLight.intensity = cfg.fillLightIntensity;
    this.rimLight.color.setHex(cfg.rimLightColor);
    this.rimLight.intensity = cfg.rimLightIntensity;

    this.materials.setTheme(theme);
    this.overlay.setTheme(theme);
  }

  setPresetView(view: CameraPresetView): void {
    this.director.setPresetView(view);
    this.calloutsDirty = true;
  }

  syncPainMarkers(points: PainPoint[]): void {
    this.painPoints = points;
    this.selectedKeys = points.map((p) => p.structureKey);
    this.materials.setSelectedStructures(this.selectedKeys);
    this.overlay.syncPainMarkers(points);
    this.calloutsDirty = true;
  }

  peelStructure(structureKey: string): void {
    this.peeledKeys.add(structureKey);
    this.materials.setPeeledStructures([...this.peeledKeys]);
    this.materials.applyLayerVisibility(this.layerState);
  }

  restoreAllPeeled(): void {
    this.peeledKeys.clear();
    this.materials.setPeeledStructures([]);
    this.materials.applyLayerVisibility(this.layerState);
  }

  resetCamera(): void {
    this.overlay.setActiveRegion(null);
    this.director.reset();
    this.calloutsDirty = true;
  }

  retryFailedLayers(): void {
    if (!this.catalog) {
      void this.initCatalogAndLoadDefaultLayers();
      return;
    }
    for (const layer of [...this.failedLayers]) {
      this.failedLayers.delete(layer);
      void this.ensureLayerLoaded(layer);
    }
  }

  async captureSnapshot(options?: { width?: number; height?: number }): Promise<string> {
    const targetW = options?.width ?? 960;
    const targetH = options?.height ?? 640;

    this.renderer.render(this.scene, this.director.camera);
    const srcCanvas = this.renderer.domElement;

    const out = document.createElement('canvas');
    out.width = targetW;
    out.height = targetH;
    const ctx = out.getContext('2d')!;

    const themeAttr = document.documentElement.getAttribute('data-theme');
    const bgHex = themeAttr === 'tech-dark' ? '#131D2E' : '#EAF1F7';
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, targetW, targetH);

    const scale = Math.min(targetW / srcCanvas.width, targetH / srcCanvas.height);
    const dw = srcCanvas.width * scale;
    const dh = srcCanvas.height * scale;
    ctx.drawImage(srcCanvas, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh);
    return out.toDataURL('image/png');
  }

  onHoverChange(cb: HoverListener): () => void {
    this.hoverListeners.add(cb);
    return () => this.hoverListeners.delete(cb);
  }

  onDepthPick(cb: DepthPickListener): () => void {
    this.depthPickListeners.add(cb);
    return () => this.depthPickListeners.delete(cb);
  }

  onLayerLoadProgress(cb: ProgressListener): () => void {
    this.progressListeners.add(cb);
    return () => this.progressListeners.delete(cb);
  }

  onCalloutsUpdate(cb: CalloutsListener): () => void {
    this.calloutListeners.add(cb);
    this.calloutsDirty = true;
    return () => this.calloutListeners.delete(cb);
  }

  dispose(): void {
    this.disposed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    this.director.dispose();
    this.materials.dispose();
    this.overlay.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

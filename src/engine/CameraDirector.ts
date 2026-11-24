import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { REGION_PRESET_MAP } from '@/data/regions';
import type { RegionId } from '@/types/anatomy';
import type { CameraPresetView } from '@/types/bridge';

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 0.92, 2.85);
const DEFAULT_TARGET_POS = new THREE.Vector3(0, 0.88, 0);

interface FlyAnimation {
  startTime: number;
  durationMs: number;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
}

export class CameraDirector {
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private animation: FlyAnimation | null = null;
  private dragging = false;

  constructor(canvas: HTMLCanvasElement, aspect: number) {
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.02, 20);
    this.camera.position.copy(DEFAULT_CAMERA_POS);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.85;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 0.8;
    this.controls.minDistance = 0.22;
    this.controls.maxDistance = 4.2;
    this.controls.maxPolarAngle = Math.PI * 0.96;
    this.controls.minPolarAngle = Math.PI * 0.04;
    this.controls.target.copy(DEFAULT_TARGET_POS);
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.dragging = true;
      this.animation = null; // 用户主动操作立即让渡控制权
    });
    this.controls.addEventListener('end', () => {
      this.dragging = false;
    });
  }

  get isUserDragging(): boolean {
    return this.dragging;
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  flyTo(
    toPos: [number, number, number],
    toTarget: [number, number, number],
    durationMs = 580,
  ): void {
    this.animation = {
      startTime: performance.now(),
      durationMs,
      fromPos: this.camera.position.clone(),
      toPos: new THREE.Vector3(...toPos),
      fromTarget: this.controls.target.clone(),
      toTarget: new THREE.Vector3(...toTarget),
    };
  }

  focusRegion(regionId: RegionId, useAltView = false): void {
    const preset = REGION_PRESET_MAP[regionId];
    if (!preset) return;
    const camPos = useAltView && preset.altCameraPos ? preset.altCameraPos : preset.cameraPos;
    this.flyTo(camPos, preset.targetPos, 620);
  }

  focusPoint(worldPoint: [number, number, number], distance = 0.52): void {
    const target = new THREE.Vector3(...worldPoint);
    const dir = this.camera.position.clone().sub(this.controls.target);
    if (dir.lengthSq() < 0.0001) {
      dir.set(0, 0.08, 1);
    }
    dir.normalize();
    const nextPos = target.clone().addScaledVector(dir, distance);
    this.flyTo([nextPos.x, nextPos.y, nextPos.z], worldPoint, 540);
  }

  setPresetView(view: CameraPresetView): void {
    const target = this.controls.target.clone();
    const dist = Math.max(0.45, Math.min(2.6, this.camera.position.distanceTo(target)));
    const nextPos = target.clone();
    switch (view) {
      case 'front':
        nextPos.z += dist;
        break;
      case 'back':
        nextPos.z -= dist;
        break;
      case 'left':
        nextPos.x += dist;
        break;
      case 'right':
        nextPos.x -= dist;
        break;
    }
    this.flyTo([nextPos.x, nextPos.y, nextPos.z], [target.x, target.y, target.z], 480);
  }

  reset(): void {
    this.flyTo(
      [DEFAULT_CAMERA_POS.x, DEFAULT_CAMERA_POS.y, DEFAULT_CAMERA_POS.z],
      [DEFAULT_TARGET_POS.x, DEFAULT_TARGET_POS.y, DEFAULT_TARGET_POS.z],
      560,
    );
  }

  update(now: number): void {
    if (this.animation) {
      const elapsed = now - this.animation.startTime;
      const t = Math.min(1, elapsed / this.animation.durationMs);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      this.camera.position.lerpVectors(this.animation.fromPos, this.animation.toPos, eased);
      this.controls.target.lerpVectors(
        this.animation.fromTarget,
        this.animation.toTarget,
        eased,
      );
      if (t >= 1) {
        this.animation = null;
      }
    }
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}

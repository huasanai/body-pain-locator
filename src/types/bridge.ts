import type {
  AnatomicalLayer,
  Laterality,
  LayerVisibilityState,
  RegionId,
  ThemeMode,
} from './anatomy';
import type { PainPoint } from './session';

export interface DepthPickCandidate {
  structureKey: string;
  zhClinical: string;
  zhCommon: string;
  enName: string;
  layer: AnatomicalLayer;
  regionId: RegionId;
  laterality: Laterality;
  painHint: string;
  distance: number;
  worldPosition: [number, number, number];
  source: 'mesh' | 'hotspot' | 'acupoint';
}

export interface LayerLoadProgress {
  layer: AnatomicalLayer;
  loaded: number;
  total: number;
  done: boolean;
  error?: string;
}

export interface ProjectedCalloutItem {
  id: string;
  kind: 'pain-primary' | 'pain-radiating' | 'anatomy' | 'acupoint';
  structureKey: string;
  label: string;
  subLabel?: string;
  layer: AnatomicalLayer;
  regionId: RegionId;
  laterality: Laterality;
  enName: string;
  zhCommon: string;
  painHint: string;
  worldPosition: [number, number, number];
  /** 锚点在画布中的 2D 像素坐标 */
  screenX: number;
  screenY: number;
  /** 是否背对当前相机（背面自动淡化或隐藏，防穿模混乱） */
  backFacing: boolean;
  isSelected: boolean;
}

export type CameraPresetView = 'front' | 'back' | 'left' | 'right';

export interface AnatomyBridge {
  focusRegion(regionId: RegionId, useAltView?: boolean): void;
  focusStructure(structureKey: string): void;
  highlightStructures(structureKeys: string[]): void;
  clearHighlights(): void;
  setLayerState(layers: LayerVisibilityState): void;
  setTheme(theme: ThemeMode): void;
  setPresetView(view: CameraPresetView): void;
  syncPainMarkers(points: PainPoint[]): void;
  peelStructure(structureKey: string): void;
  restoreAllPeeled(): void;
  resetCamera(): void;
  retryFailedLayers(): void;
  captureSnapshot(options?: { width?: number; height?: number }): Promise<string>;

  onHoverChange(
    cb: (hit: DepthPickCandidate | null, screenPos: { x: number; y: number } | null) => void,
  ): () => void;
  onDepthPick(
    cb: (hits: DepthPickCandidate[], screenPos: { x: number; y: number }) => void,
  ): () => void;
  onLayerLoadProgress(cb: (status: LayerLoadProgress) => void): () => void;
  onCalloutsUpdate(cb: (items: ProjectedCalloutItem[], viewport: { width: number; height: number }) => void): () => void;
}

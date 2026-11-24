export type AnatomicalLayer =
  | 'skin'
  | 'muscle'
  | 'tendon'
  | 'ligament'
  | 'bone'
  | 'nerve'
  | 'vascular'
  | 'organ'
  | 'acupoint';

/** 拥有真实 3D GLB 网格资源的图层（穴位层由精准 3D 坐标与引线渲染） */
export type MeshAnatomicalLayer = Exclude<AnatomicalLayer, 'acupoint'>;

export type Laterality = 'left' | 'right' | 'midline' | 'bilateral';

export type ThemeMode = 'clinical-light' | 'tech-dark';

export type RegionId =
  | 'head'
  | 'eye'
  | 'neck'
  | 'shoulder'
  | 'scapula'
  | 'chest'
  | 'abdomen'
  | 'upper_limb_hand'
  | 'lower_back'
  | 'knee'
  | 'posterior_thigh_popliteal'
  | 'thigh_calf'
  | 'ankle_foot';

export interface LayerConfig {
  visible: boolean;
  opacity: number;
}

export type LayerVisibilityState = Record<AnatomicalLayer, LayerConfig>;

export interface AnatomyStructureMeta {
  key: string;
  sourceSystem?: string;
  sourceStructureId?: number | string;
  layer: AnatomicalLayer;
  regionId: RegionId;
  laterality: Laterality;
  zhClinical: string;
  zhCommon: string;
  enName: string;
  laName?: string;
  painHint: string;
  commonDepartments: string[];
  anchorPos?: [number, number, number];
}

export interface AcupointMeta {
  /** 标准穴位编码，例如 "acupoint:BL40_l" */
  id: string;
  code: string;         // WHO 国际编码，如 BL40 / GB34 / ST36 / LI4
  zhName: string;       // 如 "委中穴"
  meridian: string;     // 如 "足太阳膀胱经"
  regionId: RegionId;
  laterality: Laterality;
  position: [number, number, number];
  /** 体表法线方向（用于背面遮挡判断） */
  normalDir: [number, number, number];
  locationHint: string; // 通俗取穴位置
  symptomHint: string;  // 常见不适关联
  commonDepartments: string[];
}

export interface RegionPreset {
  id: RegionId;
  label: string;
  shortHint: string;
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
  altCameraPos?: [number, number, number];
  altLabel?: string;
  recommendedLayers: Partial<LayerVisibilityState>;
  featuredHotspotIds: string[];
}

export interface SemanticHotspot {
  id: string;
  structureKey: string;
  regionId: RegionId;
  layer: AnatomicalLayer;
  laterality: Laterality;
  position: [number, number, number];
  /** 大致朝向法线，用于判断在当前视角是否处于模型背面 */
  normalDir?: [number, number, number];
  radius: number;
  alwaysVisibleInRegion?: boolean;
}

export interface CatalogLayerAsset {
  url: string;
  system: string;
  chunkId?: string;
  meshStart?: number;
  meshCount?: number;
  sizeBytes?: number;
}

export interface CatalogStructureEntry {
  id: number | string;
  structureId?: string;
  system: string;
  layer: MeshAnatomicalLayer;
  enName: string;
  laName?: string;
  laterality: Laterality;
  assetUrl?: string;
}

export interface AnatomyCatalog {
  version: string;
  source: string;
  license: string;
  format: 'svitylo-id-chunks' | 'mesh-named-glb';
  bounds?: { min: [number, number, number]; max: [number, number, number] };
  materialPalette?: string[];
  layers: Record<MeshAnatomicalLayer, CatalogLayerAsset[]>;
  structures: Record<string, CatalogStructureEntry>;
}

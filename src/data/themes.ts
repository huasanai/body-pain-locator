import type { AnatomicalLayer, ThemeMode } from '@/types/anatomy';

export interface SceneThemeConfig {
  mode: ThemeMode;
  label: string;
  canvasBgHex: number;
  ambientColor: number;
  ambientIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
  keyLightColor: number;
  keyLightIntensity: number;
  fillLightColor: number;
  fillLightIntensity: number;
  rimLightColor: number;
  rimLightIntensity: number;
  /** 深色模式下适当提亮暗色肌肉/脏器并增加边缘轮廓光，提升部位辨识度 */
  luminanceLift: number;
  fresnelColor: number;
  fresnelStrength: number;
  layerColors: Record<AnatomicalLayer, number>;
  hoverHighlightColor: number;
  hoverBlend: number;
  selectedHighlightColor: number;
  selectedBlend: number;
  hotspotColor: number;
  hotspotSelectedColor: number;
  acupointColor: number;
}

export const SCENE_THEMES: Record<ThemeMode, SceneThemeConfig> = {
  'clinical-light': {
    mode: 'clinical-light',
    label: '医疗清爽',
    canvasBgHex: 0xeaf1f7,
    ambientColor: 0xffffff,
    ambientIntensity: 0.48,
    hemiSkyColor: 0xf8fbff,
    hemiGroundColor: 0xcbd5e1,
    hemiIntensity: 0.88,
    keyLightColor: 0xfffdf9,
    keyLightIntensity: 1.1,
    fillLightColor: 0xe0f2fe,
    fillLightIntensity: 0.45,
    rimLightColor: 0xbae6fd,
    rimLightIntensity: 0.55,
    luminanceLift: 1.04,
    fresnelColor: 0xffffff,
    fresnelStrength: 0.08,
    layerColors: {
      skin: 0xdccbc0,
      muscle: 0xc66962,
      tendon: 0xe7dfd1,
      ligament: 0xd8b46c,
      bone: 0xe8e0d2,
      nerve: 0xeab308,
      vascular: 0xdc2626,
      organ: 0xa84d67,
      acupoint: 0x059669,
    },
    hoverHighlightColor: 0x0284c7,
    hoverBlend: 0.48,
    selectedHighlightColor: 0xe11d48,
    selectedBlend: 0.65,
    hotspotColor: 0x0284c7,
    hotspotSelectedColor: 0xe11d48,
    acupointColor: 0x059669,
  },
  'tech-dark': {
    mode: 'tech-dark',
    label: '深色科技',
    canvasBgHex: 0x131d2e,
    ambientColor: 0xe2e8f0,
    ambientIntensity: 0.68,
    hemiSkyColor: 0xbfdbfe,
    hemiGroundColor: 0x334155,
    hemiIntensity: 0.95,
    keyLightColor: 0xffffff,
    keyLightIntensity: 1.65,
    fillLightColor: 0x93c5fd,
    fillLightIntensity: 0.85,
    rimLightColor: 0x38bdf8,
    rimLightIntensity: 1.4,
    luminanceLift: 1.38,
    fresnelColor: 0x7dd3fc,
    fresnelStrength: 0.28,
    layerColors: {
      skin: 0xcbd5e1,
      muscle: 0xd96b63,
      tendon: 0xf1eadc,
      ligament: 0xf0c975,
      bone: 0xf1ece2,
      nerve: 0xfacc15,
      vascular: 0xf43f5e,
      organ: 0xd96b88,
      acupoint: 0x34d399,
    },
    hoverHighlightColor: 0x38bdf8,
    hoverBlend: 0.56,
    selectedHighlightColor: 0xfb7185,
    selectedBlend: 0.72,
    hotspotColor: 0x38bdf8,
    hotspotSelectedColor: 0xfb7185,
    acupointColor: 0x34d399,
  },
};

export const LAYER_META: Record<
  AnatomicalLayer,
  { label: string; shortLabel: string; description: string; colorVar: string; order: number }
> = {
  skin: {
    label: '体表轮廓',
    shortLabel: '体表',
    description: '100% 时完全遮蔽内部呈实体外观；调低后可透视深层组织',
    colorVar: 'var(--layer-skin)',
    order: 0,
  },
  muscle: {
    label: '肌肉层',
    shortLabel: '肌肉',
    description: '酸胀、发紧、拉伤，按压或发力活动时明显加重',
    colorVar: 'var(--layer-muscle)',
    order: 1,
  },
  tendon: {
    label: '肌腱 / 筋膜附着',
    shortLabel: '肌腱',
    description: '牵拉硬筋扯痛（如跟腱、髌腱、大腿后侧腘绳肌腱）',
    colorVar: 'var(--layer-tendon)',
    order: 2,
  },
  ligament: {
    label: '韧带 / 关节软骨',
    shortLabel: '韧带',
    description: '关节扭伤、弹响、卡顿或受力角度锐痛',
    colorVar: 'var(--layer-ligament)',
    order: 3,
  },
  bone: {
    label: '骨骼系统',
    shortLabel: '骨骼',
    description: '固定局部深压痛、骨面敲击痛或负重刺痛',
    colorVar: 'var(--layer-bone)',
    order: 4,
  },
  nerve: {
    label: '神经系统',
    shortLabel: '神经',
    description: '过电样串痛、放射性麻木（如坐骨神经、颈臂丛、三叉神经）',
    colorVar: 'var(--layer-nerve)',
    order: 5,
  },
  vascular: {
    label: '血管 / 循环',
    shortLabel: '血管',
    description: '搏动性痛、局部肿胀发烫或牵涉供血区域',
    colorVar: 'var(--layer-vascular)',
    order: 6,
  },
  organ: {
    label: '内脏 / 感官',
    shortLabel: '脏器',
    description: '深处闷痛、绞痛、烧灼或胀痛，常与呼吸、进食或体位有关',
    colorVar: 'var(--layer-organ)',
    order: 7,
  },
  acupoint: {
    label: '人体常用穴位',
    shortLabel: '穴位',
    description: '国家标准经络穴位（如委中、风池、肩井、膏肓、足三里等）',
    colorVar: 'var(--layer-acupoint)',
    order: 8,
  },
};

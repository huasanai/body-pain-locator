import * as THREE from 'three';
import { SCENE_THEMES } from '@/data/themes';
import type {
  LayerVisibilityState,
  MeshAnatomicalLayer,
  ThemeMode,
} from '@/types/anatomy';

export interface BoundAnatomyMesh {
  mesh: THREE.Mesh;
  layer: MeshAnatomicalLayer;
  system: string;
  hasIdAttribute: boolean;
  idAttrName: string | null;
  idItemSize: number;
  minStructureId: number;
  maxStructureId: number;
  stateTex: THREE.DataTexture | null;
  stateData: Uint8Array | null;
  uniforms: {
    uHoverColor: { value: THREE.Color };
    uSelectColor: { value: THREE.Color };
    uHoverBlend: { value: number };
    uSelectBlend: { value: number };
    uStateTex: { value: THREE.DataTexture | null };
    uStateTexWidth: { value: number };
    uMinId: { value: number };
    uPaletteTex: { value: THREE.DataTexture | null };
    uPaletteWidth: { value: number };
    uUsePalette: { value: number };
    uLuminanceLift: { value: number };
    uFresnelColor: { value: THREE.Color };
    uFresnelStrength: { value: number };
    uSkinInflate: { value: number };
  };
  singleStructureKey?: string;
}

const RENDER_ORDER_BY_LAYER: Record<MeshAnatomicalLayer, number> = {
  bone: 4,
  organ: 5,
  vascular: 6,
  nerve: 7,
  ligament: 8,
  tendon: 9,
  muscle: 10,
  skin: 18,
};

/**
 * 统一管理 8 大 3D 解剖网格图层：
 * - 体表轮廓在 100% 不透明时完全写入深度缓冲并微胀 2.5mm，彻底杜绝内部骨骼/肌肉穿透露馅；
 * - 深色科技模式启用 Luminance Lift + Fresnel 边缘轮廓光，大幅提升暗部结构对比度；
 * - 支持基于 _ID (VEC2: x=globalMeshId, y=materialIndex) 的 GPU 单体高亮、剥离与真实解剖色板。
 */
export class LayerMaterialSystem {
  private boundMeshes: BoundAnatomyMesh[] = [];
  private theme: ThemeMode = 'clinical-light';
  private hoveredGlobalId: number | null = null;
  private selectedGlobalIds = new Set<number>();
  private peeledGlobalIds = new Set<number>();
  private hoveredSingleKey: string | null = null;
  private selectedSingleKeys = new Set<string>();
  private peeledSingleKeys = new Set<string>();

  private paletteTex: THREE.DataTexture | null = null;
  private paletteWidth = 1;

  setMaterialPalette(hexColors: string[]): void {
    if (!hexColors || hexColors.length === 0) return;
    this.paletteTex?.dispose();
    const width = hexColors.length;
    const data = new Uint8Array(width * 4);
    const tmp = new THREE.Color();
    for (let i = 0; i < width; i++) {
      tmp.set(hexColors[i] ?? '#cccccc');
      data[i * 4] = Math.round(tmp.r * 255);
      data[i * 4 + 1] = Math.round(tmp.g * 255);
      data[i * 4 + 2] = Math.round(tmp.b * 255);
      data[i * 4 + 3] = 255;
    }
    this.paletteTex = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat);
    this.paletteTex.colorSpace = THREE.SRGBColorSpace;
    this.paletteTex.minFilter = THREE.NearestFilter;
    this.paletteTex.magFilter = THREE.NearestFilter;
    this.paletteTex.generateMipmaps = false;
    this.paletteTex.needsUpdate = true;
    this.paletteWidth = width;

    for (const item of this.boundMeshes) {
      item.uniforms.uPaletteTex.value = this.paletteTex;
      item.uniforms.uPaletteWidth.value = this.paletteWidth;
      item.uniforms.uUsePalette.value = this.shouldUsePalette(item.layer, item.idItemSize) ? 1 : 0;
    }
  }

  private shouldUsePalette(layer: MeshAnatomicalLayer, idItemSize: number): boolean {
    if (!this.paletteTex || idItemSize < 2) return false;
    // skin/nerve/tendon 使用统一高辨识主题色，其余使用真实解剖多材质色板
    if (layer === 'skin' || layer === 'nerve' || layer === 'tendon') return false;
    return true;
  }

  registerMesh(
    mesh: THREE.Mesh,
    layer: MeshAnatomicalLayer,
    system: string,
    singleStructureKey?: string,
  ): BoundAnatomyMesh {
    const geom = mesh.geometry;
    const idAttrName = geom.attributes['_id']
      ? '_id'
      : geom.attributes['_ID']
        ? '_ID'
        : null;

    let minId = 0;
    let maxId = 0;
    let idItemSize = 1;
    let stateData: Uint8Array | null = null;
    let stateTex: THREE.DataTexture | null = null;

    if (idAttrName) {
      const attr = geom.attributes[idAttrName]!;
      idItemSize = attr.itemSize;
      minId = Number.POSITIVE_INFINITY;
      maxId = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < attr.count; i++) {
        const v = Math.round(attr.getX(i));
        if (v < minId) minId = v;
        if (v > maxId) maxId = v;
      }
      if (!Number.isFinite(minId)) {
        minId = 0;
        maxId = 0;
      }
      const span = Math.max(4, maxId - minId + 1);
      stateData = new Uint8Array(span * 4);
      for (let i = 0; i < span; i++) {
        stateData[i * 4] = 255;
        stateData[i * 4 + 1] = 0;
        stateData[i * 4 + 2] = 255;
        stateData[i * 4 + 3] = 255;
      }
      stateTex = new THREE.DataTexture(stateData, span, 1, THREE.RGBAFormat);
      stateTex.minFilter = THREE.NearestFilter;
      stateTex.magFilter = THREE.NearestFilter;
      stateTex.generateMipmaps = false;
      stateTex.needsUpdate = true;
    }

    const themeCfg = SCENE_THEMES[this.theme];
    const usePalette = this.shouldUsePalette(layer, idItemSize);

    const uniforms = {
      uHoverColor: { value: new THREE.Color(themeCfg.hoverHighlightColor) },
      uSelectColor: { value: new THREE.Color(themeCfg.selectedHighlightColor) },
      uHoverBlend: { value: themeCfg.hoverBlend },
      uSelectBlend: { value: themeCfg.selectedBlend },
      uStateTex: { value: stateTex },
      uStateTexWidth: { value: stateTex ? stateTex.image.width : 1 },
      uMinId: { value: minId },
      uPaletteTex: { value: this.paletteTex },
      uPaletteWidth: { value: this.paletteWidth },
      uUsePalette: { value: usePalette ? 1 : 0 },
      uLuminanceLift: { value: themeCfg.luminanceLift },
      uFresnelColor: { value: new THREE.Color(themeCfg.fresnelColor) },
      uFresnelStrength: { value: themeCfg.fresnelStrength },
      uSkinInflate: { value: 0.0 },
    };

    const baseColor = themeCfg.layerColors[layer];
    const mat = new THREE.MeshStandardMaterial({
      color: usePalette ? 0xffffff : baseColor,
      roughness:
        layer === 'bone'
          ? 0.5
          : layer === 'skin'
            ? 0.68
            : layer === 'nerve'
              ? 0.36
              : layer === 'muscle'
                ? 0.56
                : 0.45,
      metalness: layer === 'nerve' ? 0.08 : 0.04,
      side: THREE.DoubleSide,
      transparent: layer === 'skin',
      opacity: layer === 'skin' ? 0.14 : 1.0,
      depthWrite: layer !== 'skin',
    });

    if (idAttrName && stateTex) {
      const glslType = idItemSize >= 2 ? 'vec2' : 'float';
      const idExpr = idItemSize >= 2 ? `${idAttrName}.x` : idAttrName;
      const matExpr = idItemSize >= 2 ? `${idAttrName}.y` : '0.0';

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uHoverColor = uniforms.uHoverColor;
        shader.uniforms.uSelectColor = uniforms.uSelectColor;
        shader.uniforms.uHoverBlend = uniforms.uHoverBlend;
        shader.uniforms.uSelectBlend = uniforms.uSelectBlend;
        shader.uniforms.uStateTex = uniforms.uStateTex;
        shader.uniforms.uStateTexWidth = uniforms.uStateTexWidth;
        shader.uniforms.uMinId = uniforms.uMinId;
        shader.uniforms.uPaletteTex = uniforms.uPaletteTex;
        shader.uniforms.uPaletteWidth = uniforms.uPaletteWidth;
        shader.uniforms.uUsePalette = uniforms.uUsePalette;
        shader.uniforms.uLuminanceLift = uniforms.uLuminanceLift;
        shader.uniforms.uFresnelColor = uniforms.uFresnelColor;
        shader.uniforms.uFresnelStrength = uniforms.uFresnelStrength;
        shader.uniforms.uSkinInflate = uniforms.uSkinInflate;

        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
            attribute ${glslType} ${idAttrName};
            uniform float uSkinInflate;
            varying float vAnatomyId;
            varying float vMatIdx;`,
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            vAnatomyId = ${idExpr};
            vMatIdx = ${matExpr};
            if (uSkinInflate > 0.0) {
              transformed += normalize(objectNormal) * uSkinInflate;
            }`,
          );

        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
            uniform vec3 uHoverColor;
            uniform vec3 uSelectColor;
            uniform float uHoverBlend;
            uniform float uSelectBlend;
            uniform sampler2D uStateTex;
            uniform float uStateTexWidth;
            uniform float uMinId;
            uniform sampler2D uPaletteTex;
            uniform float uPaletteWidth;
            uniform float uUsePalette;
            uniform float uLuminanceLift;
            uniform vec3 uFresnelColor;
            uniform float uFresnelStrength;
            varying float vAnatomyId;
            varying float vMatIdx;`,
          )
          .replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            if (uUsePalette > 0.5) {
              float palU = (floor(vMatIdx + 0.5) + 0.5) / max(1.0, uPaletteWidth);
              vec3 palColor = texture2D(uPaletteTex, vec2(clamp(palU, 0.0, 1.0), 0.5)).rgb;
              diffuseColor.rgb = palColor;
            }
            diffuseColor.rgb = clamp(diffuseColor.rgb * uLuminanceLift, 0.0, 1.0);
            float idU = (floor(vAnatomyId + 0.5) - uMinId + 0.5) / max(1.0, uStateTexWidth);
            vec4 st = texture2D(uStateTex, vec2(clamp(idU, 0.0, 1.0), 0.5));
            if (st.r < 0.25) discard;
            if (st.g > 0.75) {
              diffuseColor.rgb = mix(diffuseColor.rgb, uSelectColor, uSelectBlend);
            } else if (st.g > 0.25) {
              diffuseColor.rgb = mix(diffuseColor.rgb, uHoverColor, uHoverBlend);
            }`,
          )
          .replace(
            '#include <dithering_fragment>',
            `if (uFresnelStrength > 0.01) {
              vec3 viewDirF = normalize(vViewPosition);
              float ndv = clamp(abs(dot(normalize(normal), viewDirF)), 0.0, 1.0);
              float fresnel = pow(1.0 - ndv, 2.4) * uFresnelStrength;
              gl_FragColor.rgb += uFresnelColor * fresnel;
            }
            #include <dithering_fragment>`,
          );
      };
      mat.customProgramCacheKey = () => `anatomy-v2-${idAttrName}-${idItemSize}`;
    }

    mesh.material = mat;
    mesh.renderOrder = RENDER_ORDER_BY_LAYER[layer];

    const bound: BoundAnatomyMesh = {
      mesh,
      layer,
      system,
      hasIdAttribute: Boolean(idAttrName),
      idAttrName,
      idItemSize,
      minStructureId: minId,
      maxStructureId: maxId,
      stateTex,
      stateData,
      uniforms,
      singleStructureKey,
    };
    this.boundMeshes.push(bound);
    this.syncSingleMeshState(bound);
    return bound;
  }

  getBoundMeshes(): BoundAnatomyMesh[] {
    return this.boundMeshes;
  }

  applyLayerVisibility(layers: LayerVisibilityState): void {
    for (const item of this.boundMeshes) {
      const cfg = layers[item.layer];
      const isPeeledSingle =
        !item.hasIdAttribute &&
        item.singleStructureKey !== undefined &&
        this.peeledSingleKeys.has(item.singleStructureKey);

      item.mesh.visible = cfg.visible && !isPeeledSingle;
      const mat = item.mesh.material as THREE.MeshStandardMaterial;

      // 关键修复：当不透明度 >= 99% 时（包括体表轮廓 100%），严格关闭 transparent 并开启 depthWrite，
      // 确保体表轮廓在 100% 时完全实心不透明，绝不透出内部骨骼/肌肉！
      const isOpaque = cfg.opacity >= 0.99;
      const isTransparent = !isOpaque;
      if (mat.transparent !== isTransparent) {
        mat.transparent = isTransparent;
        mat.needsUpdate = true;
      }
      mat.opacity = cfg.opacity;
      mat.depthWrite = isOpaque || (cfg.opacity >= 0.9 && item.layer !== 'skin');

      // 当体表轮廓不透明度 >= 94% 时，沿法线轻微外扩 3mm，包裹住极少数贴近体表的骨突/鼻尖，做到 100% 干净实体外观
      if (item.layer === 'skin') {
        item.uniforms.uSkinInflate.value = cfg.opacity >= 0.94 ? 0.0032 : 0.0;
        item.mesh.renderOrder = isOpaque ? 2 : 18;
      }
    }
  }

  setTheme(theme: ThemeMode): void {
    this.theme = theme;
    const cfg = SCENE_THEMES[theme];
    for (const item of this.boundMeshes) {
      const mat = item.mesh.material as THREE.MeshStandardMaterial;
      if (item.uniforms.uUsePalette.value < 0.5) {
        mat.color.setHex(cfg.layerColors[item.layer]);
      }
      item.uniforms.uHoverColor.value.setHex(cfg.hoverHighlightColor);
      item.uniforms.uSelectColor.value.setHex(cfg.selectedHighlightColor);
      item.uniforms.uHoverBlend.value = cfg.hoverBlend;
      item.uniforms.uSelectBlend.value = cfg.selectedBlend;
      item.uniforms.uLuminanceLift.value = cfg.luminanceLift;
      item.uniforms.uFresnelColor.value.setHex(cfg.fresnelColor);
      item.uniforms.uFresnelStrength.value = cfg.fresnelStrength;
      this.syncSingleMeshState(item);
    }
  }

  setHoveredStructure(structureKey: string | null): void {
    this.hoveredGlobalId = null;
    this.hoveredSingleKey = structureKey;
    if (structureKey) {
      const parsed = parseMeshStructureKey(structureKey);
      if (parsed) this.hoveredGlobalId = parsed.id;
    }
    this.refreshAllStates();
  }

  setSelectedStructures(structureKeys: string[]): void {
    this.selectedGlobalIds.clear();
    this.selectedSingleKeys = new Set(structureKeys);
    for (const key of structureKeys) {
      const parsed = parseMeshStructureKey(key);
      if (parsed) this.selectedGlobalIds.add(parsed.id);
    }
    this.refreshAllStates();
  }

  setPeeledStructures(structureKeys: string[]): void {
    this.peeledGlobalIds.clear();
    this.peeledSingleKeys = new Set(structureKeys);
    for (const key of structureKeys) {
      const parsed = parseMeshStructureKey(key);
      if (parsed) this.peeledGlobalIds.add(parsed.id);
    }
    this.refreshAllStates();
  }

  isStructurePeeled(_system: string, id: number): boolean {
    return this.peeledGlobalIds.has(id);
  }

  private refreshAllStates(): void {
    for (const item of this.boundMeshes) {
      this.syncSingleMeshState(item);
    }
  }

  private syncSingleMeshState(item: BoundAnatomyMesh): void {
    if (item.hasIdAttribute && item.stateData && item.stateTex) {
      const len = item.stateTex.image.width;
      const baseId = item.minStructureId;

      for (let i = 0; i < len; i++) {
        const globalId = baseId + i;
        const offset = i * 4;
        const isPeeled = this.peeledGlobalIds.has(globalId);
        const isSelected = this.selectedGlobalIds.has(globalId);
        const isHovered = this.hoveredGlobalId === globalId;

        item.stateData[offset] = isPeeled ? 0 : 255;
        item.stateData[offset + 1] = isSelected ? 255 : isHovered ? 140 : 0;
        item.stateData[offset + 2] = 255;
        item.stateData[offset + 3] = 255;
      }
      item.stateTex.needsUpdate = true;
    } else if (item.singleStructureKey) {
      const cfg = SCENE_THEMES[this.theme];
      const mat = item.mesh.material as THREE.MeshStandardMaterial;
      const isSelected = this.selectedSingleKeys.has(item.singleStructureKey);
      const isHovered = this.hoveredSingleKey === item.singleStructureKey;
      const base = new THREE.Color(cfg.layerColors[item.layer]);
      if (isSelected) {
        base.lerp(new THREE.Color(cfg.selectedHighlightColor), cfg.selectedBlend);
      } else if (isHovered) {
        base.lerp(new THREE.Color(cfg.hoverHighlightColor), cfg.hoverBlend);
      }
      mat.color.copy(base);
    }
  }

  dispose(): void {
    this.paletteTex?.dispose();
    for (const item of this.boundMeshes) {
      item.stateTex?.dispose();
      item.mesh.geometry.dispose();
      if (Array.isArray(item.mesh.material)) {
        item.mesh.material.forEach((m) => m.dispose());
      } else {
        item.mesh.material.dispose();
      }
    }
    this.boundMeshes = [];
  }
}

export function makeMeshStructureKey(system: string, id: number | string): string {
  return `mesh:${system}:${id}`;
}

export function parseMeshStructureKey(
  key: string,
): { system: string; id: number } | null {
  if (!key.startsWith('mesh:')) return null;
  const parts = key.split(':');
  if (parts.length < 3) return null;
  const id = Number(parts[2]);
  if (!Number.isFinite(id)) return null;
  return { system: parts[1]!, id };
}

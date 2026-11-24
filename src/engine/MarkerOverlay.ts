import * as THREE from 'three';
import { STANDARD_ACUPOINTS } from '@/data/acupoints';
import { CURATED_BY_KEY } from '@/data/anatomy-zh';
import { SEMANTIC_HOTSPOTS } from '@/data/hotspots';
import { SCENE_THEMES } from '@/data/themes';
import type { AcupointMeta, RegionId, SemanticHotspot, ThemeMode } from '@/types/anatomy';
import type { ProjectedCalloutItem } from '@/types/bridge';
import type { PainPoint } from '@/types/session';

export interface HotspotMeshUserData {
  kind: 'semantic-hotspot';
  hotspot: SemanticHotspot;
}

export interface AcupointMeshUserData {
  kind: 'acupoint';
  acupoint: AcupointMeta;
}

/**
 * 专业医学解剖图风格锚点系统：
 * - 彻底摒弃巨大圆球，采用 2.5mm–4mm 精细解剖针点 + 细脉冲微环；
 * - 同步管理 3D 语义解剖锚点、WHO 标准经络穴位点、已选痛点及放射弧线；
 * - 每帧将活跃锚点投影到 2D 屏幕坐标供 CalloutOverlay 绘制「点 + 折线引导线 + 清晰标签」。
 */
export class MarkerOverlay {
  readonly rootGroup = new THREE.Group();
  readonly hotspotGroup = new THREE.Group();
  readonly acupointGroup = new THREE.Group();
  readonly painMarkerGroup = new THREE.Group();
  readonly radiationGroup = new THREE.Group();

  private hotspotMeshes = new Map<string, THREE.Mesh>();
  private acupointMeshes = new Map<string, THREE.Mesh>();
  private pulseRings: Array<{ mesh: THREE.Mesh; phase: number }> = [];

  private activeRegion: RegionId | null = null;
  private hoveredAnchorId: string | null = null;
  private selectedStructureKeys = new Set<string>();
  private showHotspots = true;
  private showAcupoints = false;
  private theme: ThemeMode = 'clinical-light';

  // 精致微型针点几何（彻底告别笨重大圆球）
  private pinCoreGeo = new THREE.SphereGeometry(0.0038, 16, 12);
  private pinHitGeo = new THREE.SphereGeometry(0.012, 12, 10);
  private painDotGeo = new THREE.SphereGeometry(0.0052, 18, 14);
  private pulseRingGeo = new THREE.RingGeometry(0.007, 0.0115, 28);

  private tmpVec = new THREE.Vector3();
  private tmpNormal = new THREE.Vector3();
  private tmpToCam = new THREE.Vector3();

  constructor() {
    this.rootGroup.name = 'MarkerOverlayRoot';
    this.hotspotGroup.name = 'SemanticHotspots';
    this.acupointGroup.name = 'StandardAcupoints';
    this.painMarkerGroup.name = 'PainMarkers';
    this.radiationGroup.name = 'RadiationArcs';

    this.rootGroup.add(
      this.hotspotGroup,
      this.acupointGroup,
      this.painMarkerGroup,
      this.radiationGroup,
    );
    this.buildHotspots();
    this.buildAcupoints();
  }

  private buildHotspots(): void {
    const themeCfg = SCENE_THEMES[this.theme];
    for (const hs of SEMANTIC_HOTSPOTS) {
      // 可见核心是极小的精致针点，外包透明碰撞盒方便鼠标精准点中
      const hitMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
      });
      const hitMesh = new THREE.Mesh(this.pinHitGeo, hitMat);
      hitMesh.position.set(...hs.position);

      const dotMat = new THREE.MeshBasicMaterial({
        color: themeCfg.hotspotColor,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      });
      const dotMesh = new THREE.Mesh(this.pinCoreGeo, dotMat);
      dotMesh.renderOrder = 35;
      hitMesh.add(dotMesh);

      const ud: HotspotMeshUserData = { kind: 'semantic-hotspot', hotspot: hs };
      hitMesh.userData = { ...ud, dotMesh };
      this.hotspotMeshes.set(hs.id, hitMesh);
      this.hotspotGroup.add(hitMesh);
    }
    this.refreshAnchorStyles();
  }

  private buildAcupoints(): void {
    const themeCfg = SCENE_THEMES[this.theme];
    for (const acu of STANDARD_ACUPOINTS) {
      const hitMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
      });
      const hitMesh = new THREE.Mesh(this.pinHitGeo, hitMat);
      hitMesh.position.set(...acu.position);

      const dotMat = new THREE.MeshBasicMaterial({
        color: themeCfg.acupointColor,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
      });
      const dotMesh = new THREE.Mesh(this.pinCoreGeo, dotMat);
      dotMesh.scale.setScalar(1.08);
      dotMesh.renderOrder = 38;
      hitMesh.add(dotMesh);

      const ud: AcupointMeshUserData = { kind: 'acupoint', acupoint: acu };
      hitMesh.userData = { ...ud, dotMesh };
      this.acupointMeshes.set(acu.id, hitMesh);
      this.acupointGroup.add(hitMesh);
    }
    this.refreshAnchorStyles();
  }

  getPickableHotspotMeshes(): THREE.Mesh[] {
    if (!this.showHotspots) return [];
    const list: THREE.Mesh[] = [];
    for (const mesh of this.hotspotMeshes.values()) {
      if (mesh.visible) list.push(mesh);
    }
    return list;
  }

  getPickableAcupointMeshes(): THREE.Mesh[] {
    if (!this.showAcupoints) return [];
    const list: THREE.Mesh[] = [];
    for (const mesh of this.acupointMeshes.values()) {
      if (mesh.visible) list.push(mesh);
    }
    return list;
  }

  setShowHotspots(show: boolean): void {
    this.showHotspots = show;
    this.hotspotGroup.visible = show;
    this.refreshAnchorStyles();
  }

  setShowAcupoints(show: boolean): void {
    this.showAcupoints = show;
    this.acupointGroup.visible = show;
    this.refreshAnchorStyles();
  }

  setActiveRegion(regionId: RegionId | null): void {
    this.activeRegion = regionId;
    this.refreshAnchorStyles();
  }

  setHoveredAnchor(anchorId: string | null): void {
    if (this.hoveredAnchorId === anchorId) return;
    this.hoveredAnchorId = anchorId;
    this.refreshAnchorStyles();
  }

  setTheme(theme: ThemeMode): void {
    this.theme = theme;
    this.refreshAnchorStyles();
  }

  private refreshAnchorStyles(): void {
    const themeCfg = SCENE_THEMES[this.theme];

    for (const [id, hitMesh] of this.hotspotMeshes) {
      const { hotspot, dotMesh } = hitMesh.userData as HotspotMeshUserData & {
        dotMesh: THREE.Mesh;
      };
      const isSelected = this.selectedStructureKeys.has(hotspot.structureKey);
      const isHovered = this.hoveredAnchorId === id;
      const inActiveRegion = this.activeRegion === hotspot.regionId;

      // 全身视角下保持画面极度清爽（仅展示已选与悬停）；进入某局部区域时展示该区精细针点
      const visible = this.showHotspots && (isSelected || isHovered || inActiveRegion);
      hitMesh.visible = visible;
      if (!visible) continue;

      const dotMat = dotMesh.material as THREE.MeshBasicMaterial;
      if (isSelected) {
        dotMat.color.setHex(themeCfg.hotspotSelectedColor);
        dotMesh.scale.setScalar(1.35);
      } else if (isHovered) {
        dotMat.color.setHex(themeCfg.hoverHighlightColor);
        dotMesh.scale.setScalar(1.4);
      } else {
        dotMat.color.setHex(themeCfg.hotspotColor);
        dotMesh.scale.setScalar(0.95);
      }
    }

    for (const [id, hitMesh] of this.acupointMeshes) {
      const { acupoint, dotMesh } = hitMesh.userData as AcupointMeshUserData & {
        dotMesh: THREE.Mesh;
      };
      const isSelected = this.selectedStructureKeys.has(acupoint.id);
      const isHovered = this.hoveredAnchorId === id;
      const inActiveRegion = this.activeRegion === acupoint.regionId;

      const visible =
        this.showAcupoints && (isSelected || isHovered || inActiveRegion || this.activeRegion === null);
      hitMesh.visible = visible;
      if (!visible) continue;

      const dotMat = dotMesh.material as THREE.MeshBasicMaterial;
      if (isSelected) {
        dotMat.color.setHex(themeCfg.hotspotSelectedColor);
        dotMesh.scale.setScalar(1.4);
      } else if (isHovered) {
        dotMat.color.setHex(themeCfg.hoverHighlightColor);
        dotMesh.scale.setScalar(1.45);
      } else {
        dotMat.color.setHex(themeCfg.acupointColor);
        dotMesh.scale.setScalar(inActiveRegion ? 1.15 : 0.9);
      }
    }
  }

  syncPainMarkers(points: PainPoint[]): void {
    this.selectedStructureKeys = new Set(points.map((p) => p.structureKey));
    this.clearGroup(this.painMarkerGroup);
    this.clearGroup(this.radiationGroup);
    this.pulseRings = [];

    const primaries: PainPoint[] = [];
    const radiatings: PainPoint[] = [];

    points.forEach((pt, idx) => {
      if (pt.role === 'primary') primaries.push(pt);
      else radiatings.push(pt);

      const colorHex = pt.role === 'primary' ? 0xe11d48 : 0xf59e0b;
      const dotMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        depthTest: false,
      });
      const dot = new THREE.Mesh(this.painDotGeo, dotMat);
      dot.position.set(...pt.worldPosition);
      dot.renderOrder = 55;
      this.painMarkerGroup.add(dot);

      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthTest: false,
      });
      const ring = new THREE.Mesh(this.pulseRingGeo, ringMat);
      ring.position.set(...pt.worldPosition);
      ring.renderOrder = 54;
      this.painMarkerGroup.add(ring);
      this.pulseRings.push({ mesh: ring, phase: idx * 0.9 });
    });

    const anchor = primaries[0];
    if (anchor && radiatings.length > 0) {
      const start = new THREE.Vector3(...anchor.worldPosition);
      for (const rad of radiatings) {
        const end = new THREE.Vector3(...rad.worldPosition);
        const mid = start.clone().lerp(end, 0.5);
        const dist = start.distanceTo(end);
        const outward = mid.clone().setY(0).normalize();
        if (outward.lengthSq() < 0.01) outward.set(0, 0, 1);
        mid.addScaledVector(outward, Math.min(0.12, dist * 0.22));

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.0024, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.85,
          depthTest: false,
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        tube.renderOrder = 48;
        this.radiationGroup.add(tube);
      }
    }

    this.refreshAnchorStyles();
  }

  /**
   * 将当前需要用「专业解剖引导线」展示的痛点、区域精细解剖点与穴位投影到 2D 画布坐标
   */
  projectCallouts(
    camera: THREE.Camera,
    width: number,
    height: number,
    painPoints: PainPoint[],
    showCallouts: boolean,
  ): ProjectedCalloutItem[] {
    if (width <= 0 || height <= 0) return [];
    const items: ProjectedCalloutItem[] = [];
    const seenKeys = new Set<string>();

    const projectOne = (
      pos: [number, number, number],
      normalDir?: [number, number, number],
    ): { x: number; y: number; inFront: boolean; backFacing: boolean } => {
      this.tmpVec.set(pos[0], pos[1], pos[2]);
      this.tmpToCam.copy(camera.position).sub(this.tmpVec).normalize();

      if (normalDir) {
        this.tmpNormal.set(normalDir[0], normalDir[1], normalDir[2]).normalize();
      } else {
        // 默认以从人体中轴指向该点的水平向量作为朝向法线
        this.tmpNormal.set(pos[0], 0, pos[2]);
        if (this.tmpNormal.lengthSq() < 0.0004) this.tmpNormal.set(0, 0, 1);
        this.tmpNormal.normalize();
      }

      const backFacing = this.tmpNormal.dot(this.tmpToCam) < -0.18;
      this.tmpVec.project(camera);
      const inFront = this.tmpVec.z >= -1 && this.tmpVec.z <= 1;
      const x = (this.tmpVec.x * 0.5 + 0.5) * width;
      const y = (-this.tmpVec.y * 0.5 + 0.5) * height;
      return { x, y, inFront, backFacing };
    };

    // 1. 用户已标记的痛点永远优先以专业红/橙引导线呈现（绝不用大圆球遮挡）
    for (const pt of painPoints) {
      const p = projectOne(pt.worldPosition);
      if (!p.inFront) continue;
      seenKeys.add(pt.structureKey);
      items.push({
        id: `pain_${pt.id}`,
        kind: pt.role === 'primary' ? 'pain-primary' : 'pain-radiating',
        structureKey: pt.structureKey,
        label: pt.zhClinical,
        subLabel: pt.role === 'primary' ? '主痛点' : '放射/牵涉痛',
        layer: pt.layer,
        regionId: pt.regionId,
        laterality: pt.laterality,
        enName: pt.enName,
        zhCommon: pt.zhCommon,
        painHint: pt.userNote || pt.zhCommon,
        worldPosition: pt.worldPosition,
        screenX: p.x,
        screenY: p.y,
        backFacing: p.backFacing,
        isSelected: true,
      });
    }

    if (!showCallouts) return items;

    // 2. 当前聚焦区域内的核心精细解剖标注（点击左侧常见部位即展开专业解剖图引线！）
    if (this.activeRegion && this.showHotspots) {
      for (const hs of SEMANTIC_HOTSPOTS) {
        if (hs.regionId !== this.activeRegion) continue;
        if (seenKeys.has(hs.structureKey)) continue;
        // 同名左右对称结构，优先展示主侧（alwaysVisibleInRegion），避免左右挤爆画面
        if (!hs.alwaysVisibleInRegion && hs.laterality === 'right') continue;
        const curated = CURATED_BY_KEY[hs.structureKey];
        if (!curated) continue;
        const p = projectOne(hs.position, hs.normalDir);
        if (!p.inFront || p.backFacing) continue;
        if (p.x < 10 || p.x > width - 10 || p.y < 10 || p.y > height - 10) continue;

        seenKeys.add(hs.structureKey);
        items.push({
          id: hs.id,
          kind: 'anatomy',
          structureKey: curated.key,
          label: curated.zhClinical,
          subLabel: curated.zhCommon,
          layer: curated.layer,
          regionId: curated.regionId,
          laterality: curated.laterality,
          enName: curated.enName,
          zhCommon: curated.zhCommon,
          painHint: curated.painHint,
          worldPosition: hs.position,
          screenX: p.x,
          screenY: p.y,
          backFacing: p.backFacing,
          isSelected: false,
        });
      }
    }

    // 3. 当用户开启「人体常用穴位」层时，用专业翡翠色引导线呈现当前视角正面的标准穴位
    if (this.showAcupoints) {
      const regionAcus = this.activeRegion
        ? STANDARD_ACUPOINTS.filter((a) => a.regionId === this.activeRegion)
        : STANDARD_ACUPOINTS.filter((a) => a.laterality !== 'right');

      for (const acu of regionAcus) {
        if (seenKeys.has(acu.id)) continue;
        const p = projectOne(acu.position, acu.normalDir);
        if (!p.inFront || p.backFacing) continue;
        if (p.x < 10 || p.x > width - 10 || p.y < 10 || p.y > height - 10) continue;

        seenKeys.add(acu.id);
        items.push({
          id: acu.id,
          kind: 'acupoint',
          structureKey: acu.id,
          label: `${acu.zhName} (${acu.code})`,
          subLabel: acu.meridian,
          layer: 'acupoint',
          regionId: acu.regionId,
          laterality: acu.laterality,
          enName: `${acu.code} ${acu.zhName}`,
          zhCommon: acu.locationHint,
          painHint: acu.symptomHint,
          worldPosition: acu.position,
          screenX: p.x,
          screenY: p.y,
          backFacing: p.backFacing,
          isSelected: false,
        });
      }
    }

    return items.slice(0, 14);
  }

  update(now: number, camera: THREE.Camera): void {
    const t = now * 0.003;
    for (const item of this.pulseRings) {
      const cycle = (t + item.phase) % 2.0;
      const p = cycle / 2.0;
      const scale = 0.85 + p * 1.85;
      item.mesh.scale.setScalar(scale);
      item.mesh.quaternion.copy(camera.quaternion);
      const mat = item.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, (1 - p) * 0.88);
    }
  }

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0]!;
      group.remove(child);
      if (child instanceof THREE.Mesh) {
        if (
          child.geometry !== this.painDotGeo &&
          child.geometry !== this.pulseRingGeo &&
          child.geometry !== this.pinCoreGeo &&
          child.geometry !== this.pinHitGeo
        ) {
          child.geometry.dispose();
        }
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  }

  dispose(): void {
    this.clearGroup(this.painMarkerGroup);
    this.clearGroup(this.radiationGroup);
    this.clearGroup(this.hotspotGroup);
    this.clearGroup(this.acupointGroup);
    this.pinCoreGeo.dispose();
    this.pinHitGeo.dispose();
    this.painDotGeo.dispose();
    this.pulseRingGeo.dispose();
  }
}

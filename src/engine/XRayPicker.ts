import * as THREE from 'three';
import { CURATED_BY_KEY, matchCuratedByEnglishName } from '@/data/anatomy-zh';
import type { AnatomicalLayer, AnatomyCatalog } from '@/types/anatomy';
import type { DepthPickCandidate } from '@/types/bridge';
import {
  fallbackTranslateStructure,
  inferLateralityFromName,
  inferRegionFromPosition,
} from '@/utils/translator';
import {
  type BoundAnatomyMesh,
  type LayerMaterialSystem,
  makeMeshStructureKey,
} from './LayerMaterialSystem';
import type { AcupointMeshUserData, HotspotMeshUserData, MarkerOverlay } from './MarkerOverlay';

const MEMBRANE_NOISE_RE = /\b(fascia|aponeurosis|sheath|septum|linea alba|retinaculum)\b/i;

export class XRayPicker {
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private catalog: AnatomyCatalog | null = null;

  setCatalog(catalog: AnatomyCatalog | null): void {
    this.catalog = catalog;
  }

  private setRayFromClient(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    camera: THREE.Camera,
  ): void {
    const rect = canvas.getBoundingClientRect();
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, camera);
  }

  pickHover(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    camera: THREE.Camera,
    materials: LayerMaterialSystem,
    overlay: MarkerOverlay,
  ): DepthPickCandidate | null {
    const candidates = this.pickDepth(clientX, clientY, canvas, camera, materials, overlay, true);
    return candidates[0] ?? null;
  }

  /**
   * 射线全穿透深度拾取（X-Ray Pick）：
   * 支持【肌肉 / 肌腱 / 韧带 / 骨骼 / 神经 / 血管 / 脏器 / 穴位】8 大层级均衡呈现。
   */
  pickDepth(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    camera: THREE.Camera,
    materials: LayerMaterialSystem,
    overlay: MarkerOverlay,
    hoverOnly = false,
  ): DepthPickCandidate[] {
    this.setRayFromClient(clientX, clientY, canvas, camera);

    const rawHits: Array<DepthPickCandidate & { isCurated: boolean; isMembrane: boolean }> = [];
    const seenKeys = new Set<string>();
    const seenClinicalNames = new Set<string>();

    // 1. 优先拾取标准穴位针点（当穴位层开启时）
    const acupointMeshes = overlay.getPickableAcupointMeshes();
    if (acupointMeshes.length > 0) {
      const acuHits = this.raycaster.intersectObjects(acupointMeshes, false);
      for (const hit of acuHits) {
        const ud = hit.object.userData as AcupointMeshUserData;
        if (!ud || ud.kind !== 'acupoint') continue;
        const acu = ud.acupoint;
        if (seenKeys.has(acu.id)) continue;
        seenKeys.add(acu.id);
        rawHits.push({
          structureKey: acu.id,
          zhClinical: `${acu.zhName}（${acu.code} · ${acu.meridian}）`,
          zhCommon: acu.locationHint,
          enName: `${acu.code} ${acu.zhName}`,
          layer: 'acupoint',
          regionId: acu.regionId,
          laterality: acu.laterality,
          painHint: acu.symptomHint,
          distance: Math.max(0.01, hit.distance - 0.025),
          worldPosition: [...acu.position],
          source: 'acupoint',
          isCurated: true,
          isMembrane: false,
        });
        if (hoverOnly) break;
      }
    }

    // 2. 语义精细解剖锚点拾取
    const hotspotMeshes = overlay.getPickableHotspotMeshes();
    if (hotspotMeshes.length > 0) {
      const hsHits = this.raycaster.intersectObjects(hotspotMeshes, false);
      for (const hit of hsHits) {
        const ud = hit.object.userData as HotspotMeshUserData;
        if (!ud || ud.kind !== 'semantic-hotspot') continue;
        const curated = CURATED_BY_KEY[ud.hotspot.structureKey];
        if (!curated || seenKeys.has(curated.key)) continue;
        seenKeys.add(curated.key);
        seenClinicalNames.add(`${curated.layer}:${curated.zhClinical}`);
        rawHits.push({
          structureKey: curated.key,
          zhClinical: curated.zhClinical,
          zhCommon: curated.zhCommon,
          enName: curated.enName,
          layer: curated.layer,
          regionId: curated.regionId,
          laterality: curated.laterality,
          painHint: curated.painHint,
          distance: Math.max(0.01, hit.distance - 0.02),
          worldPosition: [...ud.hotspot.position],
          source: 'hotspot',
          isCurated: true,
          isMembrane: false,
        });
        if (hoverOnly && rawHits.length > 0) break;
      }
    }

    // 3. 真实 3D 解剖网格穿透拾取
    const boundList = materials.getBoundMeshes().filter((b) => {
      if (hoverOnly) {
        // 悬停预览优先非体表；仅当体表 100% 不透明遮盖且开启时允许悬停体表分区
        if (b.layer === 'skin') {
          const mat = b.mesh.material as THREE.MeshStandardMaterial;
          return b.mesh.visible && mat.opacity >= 0.95;
        }
        return b.mesh.visible;
      }
      // 点击深度钻取：穿透全部已加载解剖层（不含半透明 skin，实体 skin 可作为表层参照）
      if (b.layer === 'skin') {
        const mat = b.mesh.material as THREE.MeshStandardMaterial;
        return b.mesh.visible && mat.opacity >= 0.95;
      }
      return true;
    });

    const meshMap = new Map<THREE.Object3D, BoundAnatomyMesh>();
    const pickTargets: THREE.Object3D[] = [];
    for (const b of boundList) {
      meshMap.set(b.mesh, b);
      pickTargets.push(b.mesh);
    }

    if (pickTargets.length > 0) {
      const meshHits = this.raycaster.intersectObjects(pickTargets, false);
      for (const hit of meshHits) {
        const bound = meshMap.get(hit.object);
        if (!bound) continue;

        let structureKey: string;
        let enName = bound.mesh.name || `${bound.system} structure`;

        if (bound.hasIdAttribute && bound.idAttrName && hit.face) {
          const idAttr = bound.mesh.geometry.attributes[bound.idAttrName];
          const rawId = idAttr ? Math.round(idAttr.getX(hit.face.a)) : 0;
          if (materials.isStructurePeeled(bound.system, rawId)) continue;
          structureKey = makeMeshStructureKey(bound.system, rawId);

          const catEntry =
            this.catalog?.structures[String(rawId)] ??
            this.catalog?.structures[`${bound.system}:${rawId}`];
          if (catEntry?.enName) {
            enName = catEntry.enName;
          }
        } else {
          structureKey =
            bound.singleStructureKey ?? makeMeshStructureKey(bound.system, bound.mesh.uuid);
        }

        if (seenKeys.has(structureKey)) continue;

        const worldPos: [number, number, number] = [
          Number(hit.point.x.toFixed(4)),
          Number(hit.point.y.toFixed(4)),
          Number(hit.point.z.toFixed(4)),
        ];

        const curated = matchCuratedByEnglishName(enName, bound.layer);
        const laterality = curated?.laterality ?? inferLateralityFromName(enName, worldPos[0]);
        const regionId = curated?.regionId ?? inferRegionFromPosition(worldPos);
        const isMembrane = !curated && MEMBRANE_NOISE_RE.test(enName);

        seenKeys.add(structureKey);

        if (curated) {
          const dedupName = `${bound.layer}:${curated.zhClinical}`;
          if (seenClinicalNames.has(dedupName)) continue;
          seenClinicalNames.add(dedupName);
          rawHits.push({
            structureKey,
            zhClinical: curated.zhClinical,
            zhCommon: curated.zhCommon,
            enName,
            layer: bound.layer,
            regionId: curated.regionId,
            laterality,
            painHint: curated.painHint,
            distance: hit.distance,
            worldPosition: worldPos,
            source: 'mesh',
            isCurated: true,
            isMembrane: false,
          });
        } else {
          const fallback = fallbackTranslateStructure(enName, bound.layer, laterality);
          rawHits.push({
            structureKey,
            zhClinical: fallback.zhClinical,
            zhCommon: fallback.zhCommon,
            enName,
            layer: bound.layer,
            regionId,
            laterality,
            painHint: fallback.painHint,
            distance: hit.distance,
            worldPosition: worldPos,
            source: 'mesh',
            isCurated: false,
            isMembrane,
          });
        }

        if (hoverOnly && !isMembrane && rawHits.length >= 1) break;
        if (rawHits.length >= 48) break;
      }
    }

    if (hoverOnly) {
      const preferred = rawHits.find((h) => !h.isMembrane) ?? rawHits[0];
      return preferred ? [stripInternal(preferred)] : [];
    }

    // 跨全部 9 层均衡筛选：每层最多 2 项，确保点击一次即可同时选到肌肉、肌腱、韧带、骨骼、神经、血管、脏器与穴位！
    rawHits.sort((a, b) => {
      if (a.isMembrane !== b.isMembrane) return a.isMembrane ? 1 : -1;
      return a.distance - b.distance;
    });

    const perLayerCount: Record<AnatomicalLayer, number> = {
      skin: 0,
      muscle: 0,
      tendon: 0,
      ligament: 0,
      bone: 0,
      nerve: 0,
      vascular: 0,
      organ: 0,
      acupoint: 0,
    };
    const balanced: DepthPickCandidate[] = [];

    for (const h of rawHits) {
      const cap = h.layer === 'skin' ? 1 : 2;
      if (perLayerCount[h.layer] >= cap) continue;
      perLayerCount[h.layer] += 1;
      balanced.push(stripInternal(h));
      if (balanced.length >= 10) break;
    }

    balanced.sort((a, b) => a.distance - b.distance);
    return balanced;
  }
}

function stripInternal(
  item: DepthPickCandidate & { isCurated: boolean; isMembrane: boolean },
): DepthPickCandidate {
  const { isCurated: _c, isMembrane: _m, ...rest } = item;
  return rest;
}

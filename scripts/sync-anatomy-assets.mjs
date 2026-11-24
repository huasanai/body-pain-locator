import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PKG_DIR = path.join(ROOT, 'node_modules', '@authorod', 'svitylo-3d-anatomy-data');
const OUT_DIR = path.join(ROOT, 'public', 'anatomy-data');
const DECODER_OUT_DIR = path.join(ROOT, 'public', 'decoders');

function findReleaseDir() {
  const releasesDir = path.join(PKG_DIR, 'releases');
  if (!fs.existsSync(releasesDir)) {
    throw new Error(`未找到开源 3D 解剖数据包 (${releasesDir})。请先执行 npm install。`);
  }
  const versions = fs
    .readdirSync(releasesDir)
    .filter((d) => fs.statSync(path.join(releasesDir, d)).isDirectory())
    .sort();
  if (versions.length === 0) {
    throw new Error(`releases 目录为空: ${releasesDir}`);
  }
  const latest = versions[versions.length - 1];
  return { version: latest, dir: path.join(releasesDir, latest) };
}

/**
 * 将源数据集的 8 大医学系统精准映射到我们的 8 个 3D 网格图层：
 * - regions -> skin (体表轮廓与体表分区)
 * - muscular -> muscle (骨骼肌群)
 * - insertions -> tendon (肌腱与骨面附着点)
 * - joints -> ligament (韧带 / 关节囊 / 半月板)
 * - skeletal -> bone (骨骼系统)
 * - nervous (除 sense_organs) -> nerve (脑 / 脊髓 / 脊神经 / 外周坐骨与四肢神经)
 * - cardiovascular -> vascular (心脏与全身动静脉)
 * - visceral + nervous.sense_organs -> organ (消化/呼吸/泌尿脏器 + 眼球感官)
 */
function mapSystemToLayer(system, chunkId) {
  if (system === 'regions') return 'skin';
  if (system === 'muscular') return 'muscle';
  if (system === 'insertions') return 'tendon';
  if (system === 'joints') return 'ligament';
  if (system === 'skeletal') return 'bone';
  if (system === 'nervous') {
    return chunkId === 'nervous.sense_organs' ? 'organ' : 'nerve';
  }
  if (system === 'cardiovascular') return 'vascular';
  if (system === 'visceral') return 'organ';
  return null;
}

function main() {
  const { version, dir: releaseDir } = findReleaseDir();
  console.log(`[sync-assets] 使用 @authorod/svitylo-3d-anatomy-data v${version}（全系统精细同步）`);

  const manifest = JSON.parse(fs.readFileSync(path.join(releaseDir, 'manifest.json'), 'utf8'));
  const enRaw = JSON.parse(fs.readFileSync(path.join(releaseDir, 'names', 'en.json'), 'utf8'));
  const laRaw = JSON.parse(fs.readFileSync(path.join(releaseDir, 'names', 'la.json'), 'utf8'));
  const enEntries = enRaw.entries ?? {};
  const laEntries = laRaw.entries ?? {};

  const selectedChunks = manifest.chunks.filter(
    (chunk) => mapSystemToLayer(chunk.system, chunk.id) !== null,
  );

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(DECODER_OUT_DIR, { recursive: true });

  const layers = {
    skin: [],
    muscle: [],
    tendon: [],
    ligament: [],
    bone: [],
    nerve: [],
    vascular: [],
    organ: [],
  };

  let totalBytes = 0;
  const includedMeshRanges = [];

  for (const chunk of selectedChunks) {
    const layer = mapSystemToLayer(chunk.system, chunk.id);
    if (!layer) continue;
    const relPath = chunk.files?.economy?.path;
    if (!relPath) continue;

    const srcFile = path.join(releaseDir, relPath);
    const dstFile = path.join(OUT_DIR, relPath);
    fs.mkdirSync(path.dirname(dstFile), { recursive: true });
    fs.copyFileSync(srcFile, dstFile);

    const sizeBytes = fs.statSync(dstFile).size;
    totalBytes += sizeBytes;

    layers[layer].push({
      url: `/anatomy-data/${relPath}`,
      system: chunk.system,
      chunkId: chunk.id,
      meshStart: chunk.meshStart,
      meshCount: chunk.meshCount,
      sizeBytes,
    });

    includedMeshRanges.push({
      start: chunk.meshStart,
      end: chunk.meshStart + chunk.meshCount,
      layer,
      system: chunk.system,
    });
  }

  const structures = {};
  for (const s of manifest.structures) {
    if (!Array.isArray(s.meshes) || s.meshes.length === 0) continue;
    const rawEn = enEntries[s.id]?.name ?? s.source?.object ?? s.id;
    const rawLa = laEntries[s.id]?.name;
    const side = s.side === 'left' || s.side === 'right' ? s.side : 'midline';
    const hasSideInName = /\b(left|right)\b/i.test(rawEn);
    const enName =
      side !== 'midline' && !hasSideInName
        ? `${side === 'left' ? 'Left' : 'Right'} ${rawEn}`
        : rawEn;

    for (const meshId of s.meshes) {
      const range = includedMeshRanges.find((r) => meshId >= r.start && meshId < r.end);
      if (!range) continue;
      structures[String(meshId)] = {
        id: meshId,
        structureId: s.id,
        system: range.system,
        layer: range.layer,
        enName,
        laName: rawLa,
        laterality: side,
      };
    }
  }

  const materialPalette = Array.isArray(manifest.materials)
    ? manifest.materials.map((m) => m.color || '#cccccc')
    : [];

  const catalog = {
    version,
    source: 'Svitylo 3D Anatomy Data (Z-Anatomy / BodyParts3D / Human Reference Atlas)',
    license: 'CC BY-SA 4.0 / CC BY 4.0',
    format: 'svitylo-id-chunks',
    bounds: manifest.bounds,
    materialPalette,
    layers,
    structures,
  };

  fs.writeFileSync(path.join(OUT_DIR, 'catalog.json'), JSON.stringify(catalog));

  for (const docName of ['ATTRIBUTION.md', 'LICENSES.md']) {
    const srcDoc = path.join(releaseDir, docName);
    if (fs.existsSync(srcDoc)) {
      fs.copyFileSync(srcDoc, path.join(OUT_DIR, docName));
    }
  }

  const srcAttribution = fs.existsSync(path.join(releaseDir, 'ATTRIBUTION.md'))
    ? fs.readFileSync(path.join(releaseDir, 'ATTRIBUTION.md'), 'utf8')
    : '';
  const rootAttribution = `# 开源数据与第三方许可署名（Attribution）

本项目（Body Pain Locator）的 3D 人体解剖模型资产来源于开源医学解剖数据包 **\`@authorod/svitylo-3d-anatomy-data\` (v${version})**，遵守其原始 Creative Commons 署名与相同方式共享协议（CC BY 4.0 / CC BY-SA 4.0）。

- **BodyParts3D**, © The Database Center for Life Science (DBCLS), licensed under CC BY 4.0.
- **Z-Anatomy**, licensed under CC BY-SA 4.0.
- **Human Reference Atlas**, licensed under CC BY 4.0.
- **Brain for Blender**, Anderson M. Winkler, CC BY-SA 3.0 / 4.0.

---

## 原始数据包完整署名附注

${srcAttribution}
`;
  fs.writeFileSync(path.join(ROOT, 'ATTRIBUTION.md'), rootAttribution);

  const decoderSrc = path.join(ROOT, 'node_modules', 'meshoptimizer', 'meshopt_decoder.module.js');
  if (fs.existsSync(decoderSrc)) {
    fs.copyFileSync(decoderSrc, path.join(DECODER_OUT_DIR, 'meshopt_decoder.module.js'));
  }

  console.log(
    `[sync-assets] 完成！同步 ${selectedChunks.length} 个 GLB 分块，总计 ${(totalBytes / 1024 / 1024).toFixed(2)} MB，索引 ${Object.keys(structures).length} 个真实 3D 解剖结构。`,
  );
  for (const [layerName, list] of Object.entries(layers)) {
    const mb = list.reduce((sum, x) => sum + (x.sizeBytes || 0), 0) / 1024 / 1024;
    console.log(`  - ${layerName}: ${list.length} 个文件 (${mb.toFixed(2)} MB)`);
  }
}

main();

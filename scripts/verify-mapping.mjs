import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function extractKeys(filePath, pattern) {
  const content = fs.readFileSync(filePath, 'utf8');
  const keys = new Set();
  let m;
  while ((m = pattern.exec(content)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

function main() {
  const errors = [];

  // 1. 检查 catalog.json 与全部引用的 GLB 文件
  const catalogPath = path.join(ROOT, 'public', 'anatomy-data', 'catalog.json');
  if (!fs.existsSync(catalogPath)) {
    errors.push(`缺少 ${catalogPath}，请先运行 npm run sync-assets`);
  } else {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    let fileCount = 0;
    for (const [layer, assets] of Object.entries(catalog.layers || {})) {
      if (!Array.isArray(assets) || assets.length === 0) {
        errors.push(`图层 ${layer} 未配置任何 GLB 资产`);
        continue;
      }
      for (const asset of assets) {
        const absPath = path.join(ROOT, 'public', asset.url.replace(/^\//, ''));
        if (!fs.existsSync(absPath)) {
          errors.push(`缺失 GLB 文件: ${absPath}`);
        } else if (fs.statSync(absPath).size < 100) {
          errors.push(`GLB 文件异常过小: ${absPath}`);
        } else {
          fileCount += 1;
        }
      }
    }
    const structCount = Object.keys(catalog.structures || {}).length;
    if (structCount < 500) {
      errors.push(`索引的 3D 结构数异常偏少: ${structCount}`);
    }
    console.log(`[verify-mapping] 3D 资产检查: ${fileCount} 个 GLB 文件完整，${structCount} 个结构已索引。`);
  }

  // 2. 检查解码器本地化文件与署名文件
  const decoderPath = path.join(ROOT, 'public', 'decoders', 'meshopt_decoder.module.js');
  if (!fs.existsSync(decoderPath)) {
    errors.push(`缺少本地化解码器: ${decoderPath}`);
  }
  const attrPath = path.join(ROOT, 'ATTRIBUTION.md');
  if (!fs.existsSync(attrPath)) {
    errors.push(`缺少开源署名文件: ${attrPath}`);
  }

  // 3. 交叉校验 regions.ts -> hotspots.ts -> anatomy-zh.ts 零断链
  const curatedKeys = extractKeys(
    path.join(ROOT, 'src', 'data', 'anatomy-zh.ts'),
    /key:\s*'([^']+)'/g,
  );
  const hotspotIds = extractKeys(
    path.join(ROOT, 'src', 'data', 'hotspots.ts'),
    /id:\s*'([^']+)'/g,
  );
  const hotspotStructKeys = extractKeys(
    path.join(ROOT, 'src', 'data', 'hotspots.ts'),
    /structureKey:\s*'([^']+)'/g,
  );
  const regionFeaturedIds = extractKeys(
    path.join(ROOT, 'src', 'data', 'regions.ts'),
    /'(hotspot:[^']+)'/g,
  );
  const acupointIds = extractKeys(
    path.join(ROOT, 'src', 'data', 'acupoints.ts'),
    /id:\s*'(acupoint:[^']+)'/g,
  );

  for (const sk of hotspotStructKeys) {
    if (!curatedKeys.has(sk)) {
      errors.push(`hotspots.ts 引用的 structureKey 未在 anatomy-zh.ts 中定义: ${sk}`);
    }
  }
  for (const fid of regionFeaturedIds) {
    if (!hotspotIds.has(fid)) {
      errors.push(`regions.ts 引用的 featuredHotspotId 未在 hotspots.ts 中定义: ${fid}`);
    }
  }

  console.log(
    `[verify-mapping] 词典与热点校验: ${curatedKeys.size} 条人工精校词条, ${hotspotIds.size} 个 3D 解剖锚点, ${acupointIds.size} 个标准经络穴位, ${regionFeaturedIds.size} 个高频区域焦点。`,
  );

  if (errors.length > 0) {
    console.error('[verify-mapping] 发现以下校验失败:');
    for (const e of errors) console.error('  ✗', e);
    process.exit(1);
  }

  console.log('[verify-mapping] 全部映射与本地资产校验通过！');
}

main();

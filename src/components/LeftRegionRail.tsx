import { Eye, EyeOff, Layers, MapPin, RotateCw } from 'lucide-react';
import { REGION_PRESETS } from '@/data/regions';
import { LAYER_META } from '@/data/themes';
import { useSessionStore } from '@/store/useSessionStore';
import type { AnatomicalLayer, RegionId } from '@/types/anatomy';
import type { AnatomyBridge } from '@/types/bridge';

interface LeftRegionRailProps {
  bridge: AnatomyBridge | null;
}

const LAYER_ORDER: AnatomicalLayer[] = [
  'skin',
  'muscle',
  'tendon',
  'ligament',
  'bone',
  'nerve',
  'vascular',
  'organ',
  'acupoint',
];

export function LeftRegionRail({ bridge }: LeftRegionRailProps) {
  const activeRegion = useSessionStore((s) => s.activeRegion);
  const altViewActive = useSessionStore((s) => s.altViewActive);
  const layers = useSessionStore((s) => s.layers);
  const peeledKeys = useSessionStore((s) => s.peeledKeys);
  const selectRegion = useSessionStore((s) => s.selectRegion);
  const setLayerVisible = useSessionStore((s) => s.setLayerVisible);
  const setLayerOpacity = useSessionStore((s) => s.setLayerOpacity);
  const restoreAllPeeled = useSessionStore((s) => s.restoreAllPeeled);

  const handleRegionClick = (regionId: RegionId) => {
    selectRegion(regionId, false);
    bridge?.focusRegion(regionId, false);
  };

  const handleFlipRegion = (regionId: RegionId) => {
    selectRegion(regionId, true);
    const nextAlt = activeRegion === regionId ? !altViewActive : true;
    bridge?.focusRegion(regionId, nextAlt);
  };

  const activePreset = REGION_PRESETS.find((r) => r.id === activeRegion);

  return (
    <aside
      className="order-2 flex h-auto w-full flex-col border-t lg:order-1 lg:h-full lg:w-[264px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-t-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* 13 大高频不适部位快捷定位 */}
      <div className="border-b p-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="mb-2 flex items-center justify-between">
          <span
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--text-secondary)' }}
          >
            <MapPin className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
            常见不适快捷定位
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            点击飞向+展开引线
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-2">
          {REGION_PRESETS.map((region) => {
            const isActive = activeRegion === region.id;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => handleRegionClick(region.id)}
                className="flex flex-col items-start rounded-lg border px-2 py-1.5 text-left transition"
                style={{
                  borderColor: isActive ? 'var(--accent)' : 'var(--border-subtle)',
                  backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--bg-surface-2)',
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                <span className="text-[11.5px] font-semibold leading-snug">{region.label}</span>
                <span
                  className="mt-0.5 line-clamp-1 text-[10px]"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  {region.shortHint.split('/')[0]?.trim()}
                </span>
              </button>
            );
          })}
        </div>

        {activePreset?.altCameraPos && (
          <button
            type="button"
            onClick={() => handleFlipRegion(activePreset.id)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition hover:opacity-90"
            style={{
              borderColor: 'var(--accent)',
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent)',
            }}
          >
            <RotateCw className="h-3.5 w-3.5" />
            {altViewActive
              ? `切回「${activePreset.label}」主视角`
              : activePreset.altLabel ?? '翻转背面视角'}
          </button>
        )}
      </div>

      {/* 精细 9 层组织层次透视 */}
      <div className="flex-1 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Layers className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
            组织层次透视（9类）
          </span>
          {peeledKeys.length > 0 && (
            <button
              type="button"
              onClick={() => {
                restoreAllPeeled();
                bridge?.restoreAllPeeled();
              }}
              className="text-[11px] font-medium underline"
              style={{ color: 'var(--accent)' }}
            >
              还原剥离({peeledKeys.length})
            </button>
          )}
        </div>

        <div className="space-y-2">
          {LAYER_ORDER.map((layer) => {
            const meta = LAYER_META[layer];
            const cfg = layers[layer];
            const isAcupoint = layer === 'acupoint';
            const pct = Math.round(cfg.opacity * 100);
            return (
              <div
                key={layer}
                className="rounded-lg border px-2.5 py-2"
                style={{
                  borderColor: cfg.visible ? 'var(--border-strong)' : 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-2)',
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setLayerVisible(layer, !cfg.visible)}
                    className="flex min-w-0 items-center gap-2 text-left"
                    title={meta.description}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.colorVar }}
                    />
                    <span
                      className="truncate text-xs font-medium"
                      style={{
                        color: cfg.visible ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {meta.label}
                    </span>
                  </button>

                  <div className="flex items-center gap-1">
                    {layer === 'skin' && cfg.visible && pct >= 99 && (
                      <span
                        className="rounded px-1 py-0.5 text-[9px] font-semibold"
                        style={{
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent)',
                        }}
                      >
                        实心
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setLayerVisible(layer, !cfg.visible)}
                      className="rounded p-1 transition hover:opacity-80"
                      style={{
                        color: cfg.visible ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                      title={cfg.visible ? '隐藏该层' : '显示该层'}
                    >
                      {cfg.visible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {cfg.visible && !isAcupoint && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      不透明
                    </span>
                    <input
                      type="range"
                      min={8}
                      max={100}
                      value={pct}
                      onChange={(e) => setLayerOpacity(layer, Number(e.target.value) / 100)}
                      className="h-1 flex-1 cursor-pointer accent-sky-600"
                    />
                    <span
                      className="w-8 text-right text-[10px] tabular-nums"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {pct}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

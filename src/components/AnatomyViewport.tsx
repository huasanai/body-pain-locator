import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Tag } from 'lucide-react';
import { AnatomyEngine } from '@/engine/AnatomyEngine';
import { useSessionStore } from '@/store/useSessionStore';
import type {
  AnatomyBridge,
  CameraPresetView,
  ProjectedCalloutItem,
} from '@/types/bridge';
import { CalloutOverlay } from './CalloutOverlay';

interface AnatomyViewportProps {
  onBridgeReady: (bridge: AnatomyBridge | null) => void;
}

const VIEW_BUTTONS: Array<{ view: CameraPresetView; label: string }> = [
  { view: 'front', label: '正面' },
  { view: 'back', label: '背面' },
  { view: 'left', label: '左侧' },
  { view: 'right', label: '右侧' },
];

export function AnatomyViewport({ onBridgeReady }: AnatomyViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<AnatomyEngine | null>(null);

  const [callouts, setCallouts] = useState<ProjectedCalloutItem[]>([]);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const theme = useSessionStore((s) => s.theme);
  const layers = useSessionStore((s) => s.layers);
  const showHotspots = useSessionStore((s) => s.showHotspots);
  const showCallouts = useSessionStore((s) => s.showCallouts);
  const setShowCallouts = useSessionStore((s) => s.setShowCallouts);
  const painPoints = useSessionStore((s) => s.session.painPoints);
  const layerProgress = useSessionStore((s) => s.layerProgress);
  const setHover = useSessionStore((s) => s.setHover);
  const setDepthPick = useSessionStore((s) => s.setDepthPick);
  const setLayerProgress = useSessionStore((s) => s.setLayerProgress);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const state = useSessionStore.getState();
    const engine = new AnatomyEngine(el, state.theme, state.layers);
    engineRef.current = engine;
    onBridgeReady(engine);

    const unsubHover = engine.onHoverChange((hit, pos) => {
      setHover(hit && pos ? { candidate: hit, screenPos: pos } : null);
    });
    const unsubPick = engine.onDepthPick((hits, pos) => {
      setDepthPick({ candidates: hits, screenPos: pos });
    });
    const unsubProgress = engine.onLayerLoadProgress((status) => {
      setLayerProgress(status);
    });
    const unsubCallouts = engine.onCalloutsUpdate((items, vp) => {
      setCallouts(items);
      setViewportSize(vp);
    });

    engine.syncPainMarkers(state.session.painPoints);
    engine.setShowHotspots(state.showHotspots);
    engine.setShowCallouts(state.showCallouts);

    return () => {
      unsubHover();
      unsubPick();
      unsubProgress();
      unsubCallouts();
      onBridgeReady(null);
      engine.dispose();
      engineRef.current = null;
    };
  }, [onBridgeReady, setDepthPick, setHover, setLayerProgress]);

  useEffect(() => {
    engineRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    engineRef.current?.setLayerState(layers);
  }, [layers]);

  useEffect(() => {
    engineRef.current?.setShowHotspots(showHotspots);
  }, [showHotspots]);

  useEffect(() => {
    engineRef.current?.setShowCallouts(showCallouts);
  }, [showCallouts]);

  useEffect(() => {
    engineRef.current?.syncPainMarkers(painPoints);
  }, [painPoints]);

  const progressValues = Object.values(layerProgress);
  const isLoading = progressValues.some((p) => p && !p.done);
  const loadError = progressValues.find((p) => p?.error)?.error;

  const totalAssets = progressValues.reduce((sum, p) => sum + (p?.total ?? 0), 0);
  const loadedAssets = progressValues.reduce((sum, p) => sum + (p?.loaded ?? 0), 0);
  const pct = totalAssets > 0 ? Math.min(100, Math.round((loadedAssets / totalAssets) * 100)) : 0;

  return (
    <section className="canvas-stage-bg relative order-1 flex h-[54vh] min-h-[360px] shrink-0 flex-col overflow-hidden lg:order-2 lg:h-full lg:flex-1">
      <div ref={containerRef} className="h-full w-full touch-none" />

      {/* 专业解剖图「点 + 折线引导线 + 防重叠标签」叠加层 */}
      <CalloutOverlay items={callouts} viewport={viewportSize} />

      {/* 顶部加载进度条 */}
      {isLoading && (
        <div
          className="pointer-events-none absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-strong)',
            color: 'var(--text-primary)',
          }}
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: 'var(--accent)' }} />
          <span>正在加载 3D 解剖图层… {pct > 0 ? `${pct}%` : ''}</span>
        </div>
      )}

      {/* 加载异常兜底与重试 */}
      {loadError && (
        <div
          className="absolute left-1/2 top-14 z-20 flex max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-xs shadow-lg"
          style={{
            backgroundColor: 'var(--danger-soft)',
            borderColor: 'var(--danger-border)',
            color: 'var(--danger)',
          }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{loadError}</span>
          <button
            type="button"
            onClick={() => engineRef.current?.retryFailedLayers()}
            className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white"
          >
            <RefreshCw className="h-3 w-3" />
            重试
          </button>
        </div>
      )}

      {/* 左下角交互提示 */}
      <div
        className="pointer-events-none absolute bottom-3 left-3 z-20 hidden rounded-xl border px-3 py-1.5 text-[11px] backdrop-blur-md xl:block"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        拖拽旋转 · 滚轮缩放 · 点击任意位置或引导标签标定痛点
      </div>

      {/* 右下角视角与引导线快切 */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowCallouts(!showCallouts)}
          className="flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium backdrop-blur-md transition hover:opacity-85"
          style={{
            backgroundColor: showCallouts ? 'var(--accent-soft)' : 'var(--bg-elevated)',
            borderColor: showCallouts ? 'var(--accent)' : 'var(--border-subtle)',
            color: showCallouts ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          title="显示或隐藏专业解剖引线标注"
        >
          <Tag className="h-3.5 w-3.5" />
          <span>解剖引线</span>
        </button>

        <div
          className="flex items-center gap-0.5 rounded-xl border p-1 backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {VIEW_BUTTONS.map((btn) => (
            <button
              key={btn.view}
              type="button"
              onClick={() => engineRef.current?.setPresetView(btn.view)}
              className="rounded-lg px-2 py-1 text-[11px] font-medium transition hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

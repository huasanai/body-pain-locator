import { Check, Plus } from 'lucide-react';
import { LAYER_META } from '@/data/themes';
import { useSessionStore } from '@/store/useSessionStore';
import type { DepthPickCandidate, ProjectedCalloutItem } from '@/types/bridge';

interface CalloutOverlayProps {
  items: ProjectedCalloutItem[];
  viewport: { width: number; height: number };
}

interface PlacedCallout {
  item: ProjectedCalloutItem;
  side: 'left' | 'right';
  labelY: number;
  dockX: number;
  elbowX: number;
}

const MIN_VERTICAL_GAP = 40;

function layoutCallouts(
  items: ProjectedCalloutItem[],
  width: number,
  height: number,
): PlacedCallout[] {
  if (width < 320 || height < 240 || items.length === 0) return [];

  const isCompact = width < 580;
  const sideMargin = isCompact ? 10 : 18;
  const labelWidth = isCompact ? 124 : 168;
  const topBound = 54;
  const bottomBound = Math.max(topBound + 80, height - 66);

  const leftItems: ProjectedCalloutItem[] = [];
  const rightItems: ProjectedCalloutItem[] = [];

  for (const item of items) {
    const dx = item.screenX - width * 0.5;
    if (Math.abs(dx) < 10) {
      // 中轴线标注（如印堂、膻中、中脘、关元）左右均衡分流，避免全挤在右侧
      if (leftItems.length <= rightItems.length) leftItems.push(item);
      else rightItems.push(item);
    } else if (dx < 0) {
      leftItems.push(item);
    } else {
      rightItems.push(item);
    }
  }

  const placeSide = (
    list: ProjectedCalloutItem[],
    side: 'left' | 'right',
  ): PlacedCallout[] => {
    const sorted = [...list].sort((a, b) => a.screenY - b.screenY);
    const maxPerSide = Math.max(2, Math.floor((bottomBound - topBound) / MIN_VERTICAL_GAP));
    const trimmed = sorted.slice(0, maxPerSide);

    const ys = trimmed.map((it) => Math.max(topBound, Math.min(bottomBound, it.screenY)));

    // 向下推开重叠项
    for (let i = 1; i < ys.length; i++) {
      if (ys[i]! - ys[i - 1]! < MIN_VERTICAL_GAP) {
        ys[i] = ys[i - 1]! + MIN_VERTICAL_GAP;
      }
    }
    // 若超出底界则整体向上回拉防溢出
    const lastIdx = ys.length - 1;
    if (lastIdx >= 0 && ys[lastIdx]! > bottomBound) {
      const overflow = ys[lastIdx]! - bottomBound;
      ys[lastIdx] = bottomBound;
      for (let i = lastIdx - 1; i >= 0; i--) {
        ys[i] = Math.max(topBound, Math.min(ys[i]!, ys[i + 1]! - MIN_VERTICAL_GAP));
      }
      if (overflow > 0 && ys[0]! < topBound) {
        ys[0] = topBound;
      }
    }

    const dockX = side === 'left' ? sideMargin + labelWidth : width - sideMargin - labelWidth;

    return trimmed.map((item, i) => {
      const labelY = ys[i]!;
      const dy = Math.abs(labelY - item.screenY);
      const elbowOffset = Math.min(26, Math.max(12, dy * 0.45));
      const elbowX =
        side === 'left'
          ? Math.max(dockX + 8, Math.min(item.screenX - 10, dockX + elbowOffset))
          : Math.min(dockX - 8, Math.max(item.screenX + 10, dockX - elbowOffset));
      return { item, side, labelY, dockX, elbowX };
    });
  };

  return [...placeSide(leftItems, 'left'), ...placeSide(rightItems, 'right')];
}

function getStrokeColor(item: ProjectedCalloutItem): string {
  if (item.kind === 'pain-primary') return '#e11d48';
  if (item.kind === 'pain-radiating') return '#f59e0b';
  if (item.kind === 'acupoint') return '#10b981';
  return LAYER_META[item.layer]?.colorVar ?? '#0284c7';
}

export function CalloutOverlay({ items, viewport }: CalloutOverlayProps) {
  const addPainPointFromCandidate = useSessionStore((s) => s.addPainPointFromCandidate);

  const placed = layoutCallouts(items, viewport.width, viewport.height);
  if (placed.length === 0) return null;

  const isCompact = viewport.width < 580;
  const labelWidth = isCompact ? 124 : 168;

  const handleClickCallout = (item: ProjectedCalloutItem) => {
    if (item.isSelected) return;
    const candidate: DepthPickCandidate = {
      structureKey: item.structureKey,
      zhClinical: item.label,
      zhCommon: item.zhCommon,
      enName: item.enName,
      layer: item.layer,
      regionId: item.regionId,
      laterality: item.laterality,
      painHint: item.painHint,
      distance: 0.1,
      worldPosition: item.worldPosition,
      source: item.kind === 'acupoint' ? 'acupoint' : 'hotspot',
    };
    addPainPointFromCandidate(candidate);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none">
      {/* SVG 专业解剖图引导折线与精细锚点 */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      >
        {placed.map(({ item, labelY, dockX, elbowX }) => {
          const stroke = getStrokeColor(item);
          const isPain = item.kind === 'pain-primary' || item.kind === 'pain-radiating';
          const opacity = item.backFacing ? 0.35 : isPain ? 0.96 : 0.78;
          const points = `${item.screenX.toFixed(1)},${item.screenY.toFixed(1)} ${elbowX.toFixed(1)},${labelY.toFixed(1)} ${dockX.toFixed(1)},${labelY.toFixed(1)}`;

          return (
            <g key={`line_${item.id}`} opacity={opacity}>
              {/* 细白/深描边底线，确保深浅背景下线条都清晰锐利 */}
              <polyline
                points={points}
                fill="none"
                stroke="var(--bg-app)"
                strokeWidth={isPain ? 3.2 : 2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.75}
              />
              <polyline
                points={points}
                fill="none"
                stroke={stroke}
                strokeWidth={isPain ? 1.8 : 1.25}
                strokeDasharray={item.backFacing ? '3 3' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* 锚点微环 + 3.2px 精准针点 */}
              <circle
                cx={item.screenX}
                cy={item.screenY}
                r={isPain ? 5.2 : 3.6}
                fill="var(--bg-surface)"
                stroke={stroke}
                strokeWidth={isPain ? 1.8 : 1.3}
              />
              <circle
                cx={item.screenX}
                cy={item.screenY}
                r={isPain ? 2.4 : 1.6}
                fill={stroke}
              />
            </g>
          );
        })}
      </svg>

      {/* 左右两侧整齐停靠的专业标注文字卡片 */}
      {placed.map(({ item, side, labelY, dockX }) => {
        const stroke = getStrokeColor(item);
        const isPain = item.kind === 'pain-primary' || item.kind === 'pain-radiating';
        const leftPx = side === 'left' ? dockX - labelWidth : dockX;

        return (
          <button
            key={`lbl_${item.id}`}
            type="button"
            onClick={() => handleClickCallout(item)}
            title={
              item.isSelected
                ? `${item.label}（已标记）`
                : `${item.label} — ${item.zhCommon}（点击直接标为痛点）`
            }
            className="pointer-events-auto absolute flex items-center justify-between gap-1.5 rounded-lg border px-2 py-1 text-left backdrop-blur-md transition hover:scale-[1.02]"
            style={{
              left: leftPx,
              top: labelY - 16,
              width: labelWidth,
              opacity: item.backFacing ? 0.5 : 1,
              backgroundColor: 'var(--bg-elevated)',
              borderColor: isPain ? stroke : 'var(--border-strong)',
              borderLeftWidth: side === 'right' ? 3 : 1,
              borderRightWidth: side === 'left' ? 3 : 1,
              borderLeftColor: side === 'right' ? stroke : undefined,
              borderRightColor: side === 'left' ? stroke : undefined,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}
          >
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-[11px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.label}
              </div>
              {item.subLabel && (
                <div
                  className="truncate text-[9.5px] leading-tight"
                  style={{ color: isPain ? stroke : 'var(--text-muted)' }}
                >
                  {item.subLabel}
                </div>
              )}
            </div>
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: item.isSelected ? stroke : 'var(--accent-soft)',
                color: item.isSelected ? '#ffffff' : 'var(--accent)',
              }}
            >
              {item.isSelected ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <Plus className="h-2.5 w-2.5" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

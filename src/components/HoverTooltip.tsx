import { LAYER_META } from '@/data/themes';
import { useSessionStore } from '@/store/useSessionStore';
import { formatLateralityZh } from '@/utils/translator';

export function HoverTooltip() {
  const hover = useSessionStore((s) => s.hover);
  const depthPick = useSessionStore((s) => s.depthPick);

  if (!hover || depthPick) return null;

  const { candidate, screenPos } = hover;
  const layerMeta = LAYER_META[candidate.layer];

  const left = Math.min(window.innerWidth - 270, screenPos.x + 16);
  const top = Math.max(60, screenPos.y - 16);

  return (
    <div
      className="pointer-events-none fixed z-40 max-w-[260px] rounded-xl border px-3 py-2 backdrop-blur-md"
      style={{
        left,
        top,
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-strong)',
        boxShadow: 'var(--shadow-popover)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: layerMeta.colorVar }}
        />
        <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
          {layerMeta.shortLabel} · {formatLateralityZh(candidate.laterality)}
        </span>
      </div>
      <div className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
        {candidate.zhClinical}
      </div>
      <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
        通俗：{candidate.zhCommon}
      </div>
      <div className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
        点击可展开同位置【肌肉/肌腱/韧带/骨/神经/脏器/穴位】深度列表
      </div>
    </div>
  );
}

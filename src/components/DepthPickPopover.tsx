import { CheckCircle2, EyeOff, Plus, X } from 'lucide-react';
import { LAYER_META } from '@/data/themes';
import { useSessionStore } from '@/store/useSessionStore';
import type { AnatomyBridge } from '@/types/bridge';
import { formatLateralityZh } from '@/utils/translator';

interface DepthPickPopoverProps {
  bridge: AnatomyBridge | null;
}

export function DepthPickPopover({ bridge }: DepthPickPopoverProps) {
  const depthPick = useSessionStore((s) => s.depthPick);
  const setDepthPick = useSessionStore((s) => s.setDepthPick);
  const addPainPointFromCandidate = useSessionStore((s) => s.addPainPointFromCandidate);
  const togglePeeledKey = useSessionStore((s) => s.togglePeeledKey);
  const painPoints = useSessionStore((s) => s.session.painPoints);

  if (!depthPick || depthPick.candidates.length === 0) return null;

  const selectedKeys = new Set(painPoints.map((p) => p.structureKey));

  const popoverW = 330;
  const popoverMaxH = 380;
  const left = Math.max(12, Math.min(window.innerWidth - popoverW - 12, depthPick.screenPos.x + 12));
  const top = Math.max(64, Math.min(window.innerHeight - popoverMaxH - 16, depthPick.screenPos.y - 24));

  return (
    <div
      className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border backdrop-blur-md"
      style={{
        left,
        top,
        width: popoverW,
        maxHeight: popoverMaxH,
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-strong)',
        boxShadow: 'var(--shadow-popover)',
      }}
    >
      <div
        className="flex items-center justify-between border-b px-3.5 py-2.5"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            射线穿透深度选择（由浅入深）
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            选择最符合你疼感深浅的那一层结构
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDepthPick(null)}
          className="rounded-lg p-1 transition hover:opacity-75"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="divide-y overflow-y-auto" style={{ borderColor: 'var(--border-subtle)' }}>
        {depthPick.candidates.map((cand, idx) => {
          const layerMeta = LAYER_META[cand.layer];
          const isAdded = selectedKeys.has(cand.structureKey);
          return (
            <div
              key={`${cand.structureKey}_${idx}`}
              className="flex items-start gap-2.5 p-3 transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: layerMeta.colorVar }}
                  >
                    {layerMeta.shortLabel}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {formatLateralityZh(cand.laterality)}
                  </span>
                  {(cand.source === 'hotspot' || cand.source === 'acupoint') && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px]"
                      style={{
                        backgroundColor:
                          cand.source === 'acupoint' ? 'var(--success-soft)' : 'var(--accent-soft)',
                        color: cand.source === 'acupoint' ? 'var(--success)' : 'var(--accent)',
                      }}
                    >
                      {cand.source === 'acupoint' ? '标准穴位' : '精细锚点'}
                    </span>
                  )}
                </div>

                <div className="mt-1 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {cand.zhClinical}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  通俗：{cand.zhCommon}
                </div>
                <div className="mt-0.5 text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {cand.painHint}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => addPainPointFromCandidate(cand)}
                  disabled={isAdded}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition"
                  style={{
                    backgroundColor: isAdded ? 'var(--success-soft)' : 'var(--accent)',
                    color: isAdded ? 'var(--success)' : 'var(--accent-contrast)',
                  }}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      已标
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      标这里
                    </>
                  )}
                </button>

                {cand.source === 'mesh' && cand.layer === 'muscle' && (
                  <button
                    type="button"
                    onClick={() => {
                      togglePeeledKey(cand.structureKey);
                      bridge?.peelStructure(cand.structureKey);
                      setDepthPick(null);
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[10px] transition hover:opacity-80"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}
                    title="临时隐藏挡住视线的这块表层肌肉"
                  >
                    <EyeOff className="h-3 w-3" />
                    剥离
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

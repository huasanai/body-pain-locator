import {
  Building2,
  ClipboardCopy,
  FileImage,
  MapPinned,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  ASSOCIATED_SYMPTOMS,
  COURSE_OPTIONS,
  DURATION_OPTIONS,
  ONSET_OPTIONS,
  PAIN_QUALITIES,
  RELIEVER_OPTIONS,
  TIMING_PATTERNS,
  TRIGGER_OPTIONS,
  describeSeverity,
} from '@/data/opqrst';
import { REGION_PRESET_MAP } from '@/data/regions';
import { LAYER_META } from '@/data/themes';
import { useSessionStore } from '@/store/useSessionStore';
import type { AnatomyBridge } from '@/types/bridge';
import { formatLateralityZh } from '@/utils/translator';
import { RedFlagBanner } from './RedFlagBanner';

interface RightSymptomPanelProps {
  bridge: AnatomyBridge | null;
}

export function RightSymptomPanel({ bridge }: RightSymptomPanelProps) {
  const session = useSessionStore((s) => s.session);
  const removePainPoint = useSessionStore((s) => s.removePainPoint);
  const updatePainPointRole = useSessionStore((s) => s.updatePainPointRole);
  const updatePainPointNote = useSessionStore((s) => s.updatePainPointNote);
  const updateAssessment = useSessionStore((s) => s.updateAssessment);
  const toggleAssessmentArrayItem = useSessionStore((s) => s.toggleAssessmentArrayItem);
  const openExportModal = useSessionStore((s) => s.openExportModal);

  const { painPoints, assessment, redFlags, triage } = session;
  const sev = describeSeverity(assessment.severity);

  return (
    <aside
      className="order-3 flex h-auto w-full flex-col border-t lg:h-full lg:w-[390px] lg:shrink-0 lg:border-l lg:border-t-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* 高危红旗提醒 */}
        <RedFlagBanner alerts={redFlags} />

        {/* 1. 已标记不适位置 */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              <MapPinned className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
              1. 已标记位置 ({painPoints.length})
            </h2>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              支持标主痛点 + 放射痛
            </span>
          </div>

          {painPoints.length === 0 ? (
            <div
              className="rounded-xl border border-dashed p-3.5 text-center text-xs leading-relaxed"
              style={{
                borderColor: 'var(--border-strong)',
                backgroundColor: 'var(--bg-surface-2)',
                color: 'var(--text-muted)',
              }}
            >
              在左侧选择常见不适，或直接点击 3D 人体模型，即可弹出【肌肉 / 韧带 / 骨骼 / 脏器】深度列表并标记痛点。
            </div>
          ) : (
            <div className="space-y-2">
              {painPoints.map((pt) => {
                const layerMeta = LAYER_META[pt.layer];
                const regionLabel = REGION_PRESET_MAP[pt.regionId]?.label ?? pt.regionId;
                return (
                  <div
                    key={pt.id}
                    className="rounded-xl border p-3"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface-2)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => bridge?.focusStructure(pt.structureKey)}
                        className="text-left"
                        title="点击在 3D 视图中定位到该处"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: layerMeta.colorVar }}
                          >
                            {layerMeta.shortLabel}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {formatLateralityZh(pt.laterality)} · {regionLabel}
                          </span>
                        </div>
                        <div className="mt-1 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                          {pt.zhClinical}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          通俗：{pt.zhCommon}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {pt.enName}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => removePainPoint(pt.id)}
                        className="rounded p-1 transition hover:opacity-75"
                        style={{ color: 'var(--text-muted)' }}
                        title="移除该标记"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex rounded-lg border p-0.5 text-[10px]" style={{ borderColor: 'var(--border-subtle)' }}>
                        <button
                          type="button"
                          onClick={() => updatePainPointRole(pt.id, 'primary')}
                          className="rounded px-2 py-0.5 font-medium transition"
                          style={{
                            backgroundColor: pt.role === 'primary' ? '#E11D48' : 'transparent',
                            color: pt.role === 'primary' ? '#FFFFFF' : 'var(--text-muted)',
                          }}
                        >
                          主痛点
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePainPointRole(pt.id, 'radiating')}
                          className="rounded px-2 py-0.5 font-medium transition"
                          style={{
                            backgroundColor: pt.role === 'radiating' ? '#D97706' : 'transparent',
                            color: pt.role === 'radiating' ? '#FFFFFF' : 'var(--text-muted)',
                          }}
                        >
                          放射/牵涉痛
                        </button>
                      </div>

                      <input
                        type="text"
                        value={pt.userNote ?? ''}
                        onChange={(e) => updatePainPointNote(pt.id, e.target.value)}
                        placeholder="补充细节（如一按就痛）"
                        className="min-w-0 flex-1 rounded-lg border px-2 py-1 text-[11px] outline-none"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. 疼痛性质 */}
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            2. 怎么疼？（可多选）
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {PAIN_QUALITIES.map((q) => {
              const active = assessment.qualities.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  title={q.hint}
                  onClick={() => toggleAssessmentArrayItem('qualities', q.id)}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-2)',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. 疼痛程度 0-10 */}
        <section
          className="rounded-xl border p-3"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-2)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              3. 严重程度（0–10分）
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums"
              style={{
                backgroundColor:
                  assessment.severity >= 7
                    ? 'var(--danger-soft)'
                    : assessment.severity >= 4
                      ? 'var(--warning-soft)'
                      : 'var(--accent-soft)',
                color:
                  assessment.severity >= 7
                    ? 'var(--danger)'
                    : assessment.severity >= 4
                      ? 'var(--warning)'
                      : 'var(--accent)',
              }}
            >
              {assessment.severity} 分 · {sev.level}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={assessment.severity}
            onChange={(e) => updateAssessment({ severity: Number(e.target.value) })}
            className="mt-2.5 w-full cursor-pointer accent-sky-600"
          />
          <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {sev.hint}
          </p>
        </section>

        {/* 4. 起病、时长与演变 */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            4. 什么时候开始 & 变化规律
          </h2>

          <div className="grid grid-cols-3 gap-1.5">
            {ONSET_OPTIONS.map((o) => {
              const active = assessment.onsetType === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => updateAssessment({ onsetType: o.id })}
                  className="rounded-lg border py-1.5 text-[11px] font-medium transition"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-2)',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DURATION_OPTIONS.map((d) => {
              const active = assessment.duration === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => updateAssessment({ duration: d.id })}
                  className="rounded-full border px-2.5 py-1 text-[11px] transition"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-2)',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {COURSE_OPTIONS.map((c) => {
              const active = assessment.course === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => updateAssessment({ course: c.id })}
                  className="rounded-lg border py-1.5 text-[11px] font-medium transition"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-2)',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {TIMING_PATTERNS.map((tp) => {
              const active = assessment.timingPattern.includes(tp.id);
              return (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => toggleAssessmentArrayItem('timingPattern', tp.id)}
                  className="rounded-full border px-2.5 py-1 text-[11px] transition"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-2)',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {tp.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. 诱发与缓解 */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            5. 什么会加重 / 缓解？
          </h2>
          <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            加重或诱发因素：
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TRIGGER_OPTIONS.map((t) => {
              const active = assessment.triggers.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleAssessmentArrayItem('triggers', t.id)}
                  className="rounded-full border px-2.5 py-1 text-[11px] transition"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-2)',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="pt-1 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            缓解因素：
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RELIEVER_OPTIONS.map((r) => {
              const active = assessment.relievers.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleAssessmentArrayItem('relievers', r.id)}
                  className="rounded-full border px-2.5 py-1 text-[11px] transition"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-2)',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 6. 伴随症状 */}
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            6. 有无伴随症状？
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {ASSOCIATED_SYMPTOMS.map((a) => {
              const active = assessment.associatedSymptoms.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAssessmentArrayItem('associatedSymptoms', a.id)}
                  className="rounded-full border px-2.5 py-1 text-[11px] transition"
                  style={{
                    borderColor: active ? 'var(--danger)' : 'var(--border-subtle)',
                    backgroundColor: active ? 'var(--danger-soft)' : 'var(--bg-surface-2)',
                    color: active ? 'var(--danger)' : 'var(--text-secondary)',
                  }}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 7. 补充备注 */}
        <section>
          <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            7. 其他补充（外伤 / 既往史 / 用药）
          </h2>
          <textarea
            rows={2}
            value={assessment.freeText}
            onChange={(e) => updateAssessment({ freeText: e.target.value })}
            placeholder="例如：昨天打球踩空崴了一下；平时有胃炎；昨晚吃过布洛芬略缓解…"
            className="w-full rounded-xl border p-2.5 text-xs outline-none"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-2)',
              color: 'var(--text-primary)',
            }}
          />
        </section>

        {/* 本地基础挂号科室参考 */}
        {triage.departments.length > 0 && (
          <section
            className="rounded-xl border p-3"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-2)',
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              <Building2 className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
              常见挂号科室参考（本地规则）
            </div>
            <div className="mt-2 space-y-1.5">
              {triage.departments.map((d) => (
                <div key={d.department} className="text-[11px] leading-snug">
                  <span
                    className="mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor:
                        d.priority === 'emergency'
                          ? 'var(--danger-soft)'
                          : d.priority === 'primary'
                            ? 'var(--accent-soft)'
                            : 'var(--bg-surface)',
                      color:
                        d.priority === 'emergency'
                          ? 'var(--danger)'
                          : d.priority === 'primary'
                            ? 'var(--accent)'
                            : 'var(--text-secondary)',
                    }}
                  >
                    {d.department}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{d.rationale}</span>
                </div>
              ))}
            </div>
            <div
              className="mt-2 flex items-center gap-1 text-[10px]"
              style={{ color: 'var(--text-muted)' }}
            >
              <Sparkles className="h-3 w-3 shrink-0" />
              <span>后续版本可直连 AI 实时分析与附近医院推荐，此处仅作初步参考，不构成诊断。</span>
            </div>
          </section>
        )}
      </div>

      {/* 底部导出操作栏 */}
      <div
        className="grid shrink-0 grid-cols-2 gap-2 border-t p-3"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <button
          type="button"
          onClick={() => openExportModal('doctor')}
          className="flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition hover:opacity-85"
          style={{
            borderColor: 'var(--accent)',
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent)',
          }}
        >
          <FileImage className="h-4 w-4" />
          给医生看（速览卡）
        </button>

        <button
          type="button"
          onClick={() => openExportModal('ai')}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition hover:opacity-90"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-contrast)',
          }}
        >
          <ClipboardCopy className="h-4 w-4" />
          给 AI 问诊（Prompt）
        </button>
      </div>
    </aside>
  );
}

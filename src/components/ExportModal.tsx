import { useEffect, useState } from 'react';
import { Check, Copy, Download, Printer, X } from 'lucide-react';
import { defaultAdvisorAdapter } from '@/adapters/clipboardAdvisor';
import {
  ASSOCIATED_SYMPTOMS,
  COURSE_OPTIONS,
  DURATION_OPTIONS,
  ONSET_OPTIONS,
  PAIN_QUALITIES,
  RELIEVER_OPTIONS,
  TRIGGER_OPTIONS,
  describeSeverity,
  mapOptionLabels,
} from '@/data/opqrst';
import { REGION_PRESET_MAP } from '@/data/regions';
import { LAYER_META } from '@/data/themes';
import { useSessionStore } from '@/store/useSessionStore';
import type { AnatomyBridge } from '@/types/bridge';
import { exportDoctorCardPng } from '@/utils/exportDoctorCard';
import { formatLateralityZh } from '@/utils/translator';

interface ExportModalProps {
  bridge: AnatomyBridge | null;
}

export function ExportModal({ bridge }: ExportModalProps) {
  const tab = useSessionStore((s) => s.exportModalTab);
  const openExportModal = useSessionStore((s) => s.openExportModal);
  const closeExportModal = useSessionStore((s) => s.closeExportModal);
  const session = useSessionStore((s) => s.session);

  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!tab) return;
    let cancelled = false;
    setCopied(false);
    if (bridge) {
      void bridge.captureSnapshot({ width: 960, height: 600 }).then((img) => {
        if (!cancelled) setSnapshot(img);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [tab, bridge]);

  if (!tab) return null;

  const promptText = defaultAdvisorAdapter.buildPrompt(session);
  const { painPoints, assessment, redFlags, triage } = session;
  const sev = describeSeverity(assessment.severity);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = promptText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadPng = async () => {
    setDownloading(true);
    try {
      const pngUrl = await exportDoctorCardPng(session, snapshot);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `就诊不适定位卡_${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        {/* 弹窗头部 */}
        <div
          className="no-print flex items-center justify-between border-b px-5 py-3.5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openExportModal('doctor')}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              style={{
                backgroundColor: tab === 'doctor' ? 'var(--accent)' : 'var(--bg-surface-2)',
                color: tab === 'doctor' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
              }}
            >
              给医生看 · 就诊速览卡
            </button>
            <button
              type="button"
              onClick={() => openExportModal('ai')}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              style={{
                backgroundColor: tab === 'ai' ? 'var(--accent)' : 'var(--bg-surface-2)',
                color: tab === 'ai' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
              }}
            >
              给 AI 问诊 · 结构化 Prompt
            </button>
          </div>
          <button
            type="button"
            onClick={closeExportModal}
            className="rounded-lg p-1.5 transition hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'doctor' ? (
            <div id="doctor-card-printable" className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    就诊不适定位速览卡
                  </h2>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    生成时间：{new Date(session.updatedAt).toLocaleString('zh-CN')} · 仅辅助表达症状，非医疗诊断
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  疼痛评分 {assessment.severity}/10（{sev.level}）
                </span>
              </div>

              {redFlags.length > 0 && (
                <div
                  className="rounded-xl border p-3 text-xs"
                  style={{
                    backgroundColor: 'var(--danger-soft)',
                    borderColor: 'var(--danger-border)',
                    color: 'var(--danger)',
                  }}
                >
                  <strong>高危急症提示：</strong>
                  {redFlags.map((r) => `${r.title}（${r.actionAdvice}）`).join('；')}
                </div>
              )}

              {snapshot && (
                <div
                  className="overflow-hidden rounded-xl border"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <img
                    src={snapshot}
                    alt="3D 疼痛标注视角截图"
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              )}

              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  精准解剖定位
                </h3>
                {painPoints.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    尚未在 3D 模型上选择具体位置（建议关闭弹窗后先点选疼痛部位）。
                  </p>
                ) : (
                  <div className="space-y-2">
                    {painPoints.map((pt) => (
                      <div
                        key={pt.id}
                        className="rounded-xl border p-3 text-xs"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface-2)',
                        }}
                      >
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          [{pt.role === 'primary' ? '主痛点' : '放射/牵涉痛'}]{' '}
                          {formatLateralityZh(pt.laterality)} · {pt.zhClinical}
                        </div>
                        <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          区域：{REGION_PRESET_MAP[pt.regionId]?.label} ｜ 层级：
                          {LAYER_META[pt.layer]?.label} ｜ 通俗：{pt.zhCommon}（{pt.enName}）
                        </div>
                        {pt.userNote && (
                          <div className="mt-1 text-[11px]" style={{ color: 'var(--accent)' }}>
                            个人补充：{pt.userNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 rounded-xl border p-3.5 text-xs sm:grid-cols-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>疼痛性质：</span>
                  {mapOptionLabels(assessment.qualities, PAIN_QUALITIES).join('、') || '未勾选'}
                </div>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>起病与时长：</span>
                  {ONSET_OPTIONS.find((o) => o.id === assessment.onsetType)?.label} ·{' '}
                  {DURATION_OPTIONS.find((d) => d.id === assessment.duration)?.label} ·{' '}
                  {COURSE_OPTIONS.find((c) => c.id === assessment.course)?.label}
                </div>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>加重因素：</span>
                  {mapOptionLabels(assessment.triggers, TRIGGER_OPTIONS).join('、') || '未说明'}
                </div>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>缓解因素：</span>
                  {mapOptionLabels(assessment.relievers, RELIEVER_OPTIONS).join('、') || '未说明'}
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>伴随症状：</span>
                  {mapOptionLabels(assessment.associatedSymptoms, ASSOCIATED_SYMPTOMS).join('、') || '暂无明显伴随'}
                </div>
                {assessment.freeText.trim() && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>其他补充：</span>
                    {assessment.freeText.trim()}
                  </div>
                )}
              </div>

              {triage.departments.length > 0 && (
                <div className="text-xs">
                  <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>本地挂号科室参考：</span>
                  <span style={{ color: 'var(--accent)' }}>
                    {triage.departments.map((d) => d.department).join(' / ')}
                  </span>
                </div>
              )}

              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {triage.disclaimer}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                已根据你在 3D 模型标注的精准医学名词、组织层级与 OPQRST 疼痛特征生成高信噪比提问模板，直接复制发送给任意 AI 助手即可获得清晰分析与挂号科室建议：
              </p>
              <pre
                className="max-h-[52vh] overflow-y-auto whitespace-pre-wrap rounded-xl border p-4 font-sans text-xs leading-relaxed"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)',
                }}
              >
                {promptText}
              </pre>
            </div>
          )}
        </div>

        {/* 弹窗底部操作 */}
        <div
          className="no-print flex items-center justify-end gap-2.5 border-t px-5 py-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {tab === 'doctor' ? (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition hover:opacity-85"
                style={{
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                <Printer className="h-3.5 w-3.5" />
                打印 A4 就诊单
              </button>
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadPng}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition hover:opacity-90"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
              >
                <Download className="h-3.5 w-3.5" />
                {downloading ? '正在生成长图…' : '下载 PNG 存手机'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: copied ? 'var(--success)' : 'var(--accent)',
                color: '#FFFFFF',
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? '已复制到剪贴板，去粘贴给 AI 吧！' : '一键复制全部内容'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

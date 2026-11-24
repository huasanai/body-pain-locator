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
  mapOptionLabels,
} from '@/data/opqrst';
import { REGION_PRESET_MAP } from '@/data/regions';
import { LAYER_META } from '@/data/themes';
import type { SymptomSession } from '@/types/session';
import { formatLateralityZh } from '@/utils/translator';

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let current = '';
  for (const ch of text) {
    if (ch === '\n') {
      lines.push(current);
      current = '';
      continue;
    }
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 纯原生 Canvas 生成高清晰度【给医生看】就诊速览卡 PNG（零外部依赖，适合存手机或发微信）
 */
export async function exportDoctorCardPng(
  session: SymptomSession,
  snapshotDataUrl: string | null,
): Promise<string> {
  const width = 1080;
  const padding = 52;
  const contentWidth = width - padding * 2;

  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d')!;
  const fontBody = '24px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
  const fontSmall = '20px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';

  const { painPoints, assessment, redFlags, triage } = session;
  const sev = describeSeverity(assessment.severity);

  const onset = ONSET_OPTIONS.find((o) => o.id === assessment.onsetType)?.label ?? '未说明';
  const duration = DURATION_OPTIONS.find((o) => o.id === assessment.duration)?.label ?? '未说明';
  const course = COURSE_OPTIONS.find((o) => o.id === assessment.course)?.label ?? '未说明';

  const opqrstRows: Array<[string, string]> = [
    ['疼痛性质', mapOptionLabels(assessment.qualities, PAIN_QUALITIES).join('、') || '未勾选'],
    ['严重程度', `${assessment.severity} / 10（${sev.level}）`],
    ['起病与时长', `${onset} · 持续${duration} · ${course}`],
    ['时间规律', mapOptionLabels(assessment.timingPattern, TIMING_PATTERNS).join('、') || '无明显规律'],
    ['诱发/加重', mapOptionLabels(assessment.triggers, TRIGGER_OPTIONS).join('、') || '未填写'],
    ['缓解因素', mapOptionLabels(assessment.relievers, RELIEVER_OPTIONS).join('、') || '未填写'],
    ['伴随症状', mapOptionLabels(assessment.associatedSymptoms, ASSOCIATED_SYMPTOMS).join('、') || '暂无明显伴随'],
  ];
  if (assessment.freeText.trim()) {
    opqrstRows.push(['个人补充', assessment.freeText.trim()]);
  }

  // 动态计算高度
  let estHeight = 170;
  if (redFlags.length > 0) estHeight += 76 + redFlags.length * 64;
  if (snapshotDataUrl) estHeight += 480;
  estHeight += 70 + Math.max(1, painPoints.length) * 98;
  mctx.font = fontBody;
  estHeight += 72;
  for (const [, val] of opqrstRows) {
    const lines = wrapLines(mctx, val, contentWidth - 190);
    estHeight += Math.max(1, lines.length) * 34 + 22;
  }
  if (triage.departments.length > 0) {
    estHeight += 70 + triage.departments.length * 52;
  }
  estHeight += 120;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.max(1200, estHeight);
  const ctx = canvas.getContext('2d')!;

  // 背景
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 顶部栏
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(0, 0, width, 128);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.fillText('就诊不适定位速览卡', padding, 62);
  ctx.font = '20px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.fillStyle = '#E0F2FE';
  const timeText = new Date(session.updatedAt).toLocaleString('zh-CN');
  ctx.fillText(`生成时间：${timeText}  ｜  3D 解剖定位辅助表达（非医疗诊断）`, padding, 102);

  let y = 166;

  // 红旗警示
  if (redFlags.length > 0) {
    const boxH = 44 + redFlags.length * 58;
    ctx.fillStyle = '#FEF2F2';
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padding, y, contentWidth, boxH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#B91C1C';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    ctx.fillText('⚠ 高危急症提示（请优先告知医生或急诊评估）', padding + 20, y + 36);
    ctx.font = fontSmall;
    let ry = y + 70;
    for (const rf of redFlags) {
      ctx.fillText(`• ${rf.title}：${rf.actionAdvice.slice(0, 42)}`, padding + 20, ry);
      ry += 54;
    }
    y += boxH + 28;
  }

  // 3D 标记截图
  if (snapshotDataUrl) {
    try {
      const img = await loadImage(snapshotDataUrl);
      const boxH = 440;
      ctx.fillStyle = '#F1F5F9';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(padding, y, contentWidth, boxH, 14);
      ctx.fill();
      ctx.stroke();

      const scale = Math.min((contentWidth - 20) / img.width, (boxH - 20) / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, padding + (contentWidth - dw) / 2, y + (boxH - dh) / 2, dw, dh);
      y += boxH + 34;
    } catch {
      // 跳过失败图片
    }
  }

  // 一、定位部位
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.fillText('一、3D 标注不适部位', padding, y);
  y += 20;

  if (painPoints.length === 0) {
    y += 38;
    ctx.fillStyle = '#64748B';
    ctx.font = fontBody;
    ctx.fillText('暂未标注具体 3D 解剖部位', padding, y);
    y += 32;
  } else {
    for (const pt of painPoints) {
      y += 14;
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(padding, y, contentWidth, 82, 10);
      ctx.fill();
      ctx.stroke();

      const roleTag = pt.role === 'primary' ? '主痛点' : '放射痛';
      const side = formatLateralityZh(pt.laterality);
      const region = REGION_PRESET_MAP[pt.regionId]?.label ?? pt.regionId;
      const layer = LAYER_META[pt.layer]?.shortLabel ?? pt.layer;

      ctx.fillStyle = pt.role === 'primary' ? '#E11D48' : '#0284C7';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
      ctx.fillText(`[${roleTag}] ${side} · ${pt.zhClinical}`, padding + 18, y + 34);

      ctx.fillStyle = '#475569';
      ctx.font = fontSmall;
      ctx.fillText(
        `区域：${region} ｜ 层级：${layer} ｜ 通俗：${pt.zhCommon} (${pt.enName})`,
        padding + 18,
        y + 66,
      );
      y += 88;
    }
  }

  y += 38;
  // 二、OPQRST 症状摘要
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.fillText('二、疼痛与感受详情（OPQRST）', padding, y);
  y += 28;

  for (const [label, value] of opqrstRows) {
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`${label}：`, padding, y + 26);

    ctx.font = fontBody;
    ctx.fillStyle = '#0F172A';
    const lines = wrapLines(ctx, value, contentWidth - 170);
    lines.forEach((line, idx) => {
      ctx.fillText(line, padding + 160, y + 26 + idx * 34);
    });
    y += Math.max(1, lines.length) * 34 + 18;
    ctx.strokeStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.moveTo(padding, y - 6);
    ctx.lineTo(width - padding, y - 6);
    ctx.stroke();
  }

  // 三、参考科室
  if (triage.departments.length > 0) {
    y += 28;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    ctx.fillText('三、本地挂号科室参考', padding, y);
    y += 36;
    ctx.font = fontSmall;
    for (const d of triage.departments) {
      ctx.fillStyle = d.priority === 'emergency' ? '#DC2626' : '#0369A1';
      ctx.fillText(`• ${d.department}：${d.rationale}`, padding, y);
      y += 42;
    }
  }

  // 页脚免责声明
  ctx.fillStyle = '#94A3B8';
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.fillText(triage.disclaimer, padding, canvas.height - 38);

  return canvas.toDataURL('image/png');
}

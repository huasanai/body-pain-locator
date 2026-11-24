import { evaluateDepartmentHints } from '@/data/departments';
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
import type { AdvisorAdapter } from '@/types/adapters';
import type { SymptomSession, TriageSummary } from '@/types/session';
import { formatLateralityZh } from '@/utils/translator';

export class ClipboardAdvisorAdapter implements AdvisorAdapter {
  readonly mode = 'offline-prompt' as const;

  evaluateLocalTriage(session: SymptomSession): TriageSummary {
    return evaluateDepartmentHints(session.painPoints, session.assessment, session.redFlags);
  }

  buildPrompt(session: SymptomSession): string {
    const { painPoints, assessment, redFlags, triage } = session;
    const severityMeta = describeSeverity(assessment.severity);

    const onsetLabel =
      ONSET_OPTIONS.find((o) => o.id === assessment.onsetType)?.label ?? '未说明';
    const durationLabel =
      DURATION_OPTIONS.find((o) => o.id === assessment.duration)?.label ?? '未说明';
    const courseLabel =
      COURSE_OPTIONS.find((o) => o.id === assessment.course)?.label ?? '未说明';

    const qualitiesText =
      assessment.qualities.length > 0
        ? mapOptionLabels(assessment.qualities, PAIN_QUALITIES).join('、')
        : '未具体勾选';
    const timingText =
      assessment.timingPattern.length > 0
        ? mapOptionLabels(assessment.timingPattern, TIMING_PATTERNS).join('、')
        : '无明显规律';
    const triggersText =
      assessment.triggers.length > 0
        ? mapOptionLabels(assessment.triggers, TRIGGER_OPTIONS).join('、')
        : '未说明';
    const relieversText =
      assessment.relievers.length > 0
        ? mapOptionLabels(assessment.relievers, RELIEVER_OPTIONS).join('、')
        : '未说明';
    const assocText =
      assessment.associatedSymptoms.length > 0
        ? mapOptionLabels(assessment.associatedSymptoms, ASSOCIATED_SYMPTOMS).join('、')
        : '暂无明显伴随症状';

    const pointLines =
      painPoints.length > 0
        ? painPoints
            .map((p, idx) => {
              const roleLabel = p.role === 'primary' ? '主痛点' : '放射/牵涉痛';
              const regionLabel = REGION_PRESET_MAP[p.regionId]?.label ?? p.regionId;
              const layerLabel = LAYER_META[p.layer]?.label ?? p.layer;
              const sideLabel = formatLateralityZh(p.laterality);
              const note = p.userNote?.trim() ? `\n  - 个人补充：${p.userNote.trim()}` : '';
              return `${idx + 1}. [${roleLabel}] ${sideLabel} · ${regionLabel} · **${p.zhClinical}**（通俗位置：${p.zhCommon} / 英文：${p.enName}）｜体感层级：${layerLabel}${note}`;
            })
            .join('\n')
        : '（尚未在 3D 模型上标记具体解剖位置）';

    const redFlagSection =
      redFlags.length > 0
        ? `\n### ⚠️ 本地初步触发的高危警示\n${redFlags
            .map((r) => `- **${r.title}**：${r.reason}`)
            .join('\n')}\n`
        : '';

    const deptHint =
      triage.departments.length > 0
        ? `\n- 本地初步科室参考：${triage.departments.map((d) => d.department).join(' / ')}`
        : '';

    const freeTextLine = assessment.freeText.trim()
      ? `\n- 其他补充（外伤史/既往史/用药等）：${assessment.freeText.trim()}`
      : '';

    return `我正在整理身体不适信息，请你作为专业、严谨且通俗易懂的健康科普与导诊助手，结合以下通过 3D 解剖模型定位出的信息帮我分析（请明确说明你的回复仅作参考，不构成医疗诊断）：

### 1. 精准不适位置（3D 解剖定位）
${pointLines}

### 2. 疼痛与不适特征（临床 OPQRST 要素）
- 疼痛/不适性质：${qualitiesText}
- 严重程度：${assessment.severity} / 10（${severityMeta.level} — ${severityMeta.hint}）
- 起病与持续时间：${onsetLabel}，持续「${durationLabel}」，演变趋势「${courseLabel}」
- 时间节律：${timingText}
- 诱发/加重因素：${triggersText}
- 缓解因素：${relieversText}
- 伴随症状：${assocText}${deptHint}${freeTextLine}
${redFlagSection}
### 3. 请帮我重点解答以下 4 个问题
1. **急症排查**：根据以上位置和症状，是否存在需要我立刻去医院急诊的危险信号？
2. **可能原因方向**：结合具体解剖层级（肌肉/韧带/骨骼/脏器），最可能相关的 2–3 个方向分别是什么？如何通过简单观察做区分？
3. **就医挂号建议**：如果需要去医院检查，我最优先应该挂什么科？备选科室是什么？可能需要做哪些常见检查？
4. **进一步追问**：为了判断得更准确，你还希望我补充哪 2–3 个关键信息？`;
  }
}

export const defaultAdvisorAdapter = new ClipboardAdvisorAdapter();

import type { OnsetType, PainCourse } from '@/types/session';

export interface OptionItem {
  id: string;
  label: string;
  hint?: string;
}

export const PAIN_QUALITIES: OptionItem[] = [
  { id: 'sharp', label: '刺痛 / 针扎样', hint: '像针扎或刀割一下的尖锐痛' },
  { id: 'dull', label: '钝痛 / 隐隐作痛', hint: '说不清准确一点的闷沉痛' },
  { id: 'distending', label: '胀痛 / 发涨', hint: '里面鼓胀、撑着难受' },
  { id: 'aching', label: '酸痛 / 发沉发紧', hint: '像运动过度或久坐后的僵酸感' },
  { id: 'throbbing', label: '跳痛 / 搏动痛', hint: '跟着心跳一跳一跳地疼' },
  { id: 'burning', label: '烧灼痛 / 火辣感', hint: '像被烫到、发辣或反酸烧心' },
  { id: 'colicky', label: '绞痛 / 拧着痛', hint: '一阵阵抽紧、拧绞般剧痛' },
  { id: 'crushing', label: '压榨感 / 发闷', hint: '像胸口压了大石头或喘不上气' },
  { id: 'electric', label: '电击样 / 串痛', hint: '像过电一样沿一条线窜过去' },
  { id: 'numbness', label: '麻木 / 蚁走感', hint: '发麻、发木、感觉迟钝' },
  { id: 'pulling', label: '牵拉 / 扯着痛', hint: '一动就像筋被拉扯到' },
];

export const ONSET_OPTIONS: Array<{ id: OnsetType; label: string }> = [
  { id: 'sudden', label: '突然发作' },
  { id: 'gradual', label: '慢慢加重' },
  { id: 'unsure', label: '记不清' },
];

export const DURATION_OPTIONS: OptionItem[] = [
  { id: 'within_hours', label: '几小时内' },
  { id: '1_3_days', label: '1–3 天' },
  { id: '4_14_days', label: '4–14 天' },
  { id: '2_4_weeks', label: '2–4 周' },
  { id: 'over_month', label: '1 个月以上 / 反复发作' },
];

export const COURSE_OPTIONS: Array<{ id: PainCourse; label: string }> = [
  { id: 'constant', label: '持续存在' },
  { id: 'intermittent', label: '一阵一阵' },
  { id: 'worsening', label: '越来越重' },
  { id: 'improving', label: '逐渐减轻' },
];

export const TIMING_PATTERNS: OptionItem[] = [
  { id: 'morning_stiffness', label: '晨起僵硬/更痛' },
  { id: 'night_waking', label: '夜间加重/痛醒' },
  { id: 'after_activity', label: '劳累或活动后明显' },
  { id: 'after_meal', label: '饭后/吃油腻后加重' },
  { id: 'empty_stomach', label: '空腹/饥饿时更痛' },
];

export const TRIGGER_OPTIONS: OptionItem[] = [
  { id: 'pressure', label: '按压痛处加重' },
  { id: 'movement', label: '特定动作/发力/负重加重' },
  { id: 'posture', label: '久坐/低头/弯腰加重' },
  { id: 'breathing', label: '深呼吸/咳嗽/打喷嚏加重' },
  { id: 'swallowing', label: '吞咽或进食时加重' },
  { id: 'stairs', label: '上下楼/下蹲加重' },
  { id: 'cold_wind', label: '受凉/吹风后加重' },
  { id: 'injury', label: '明确扭伤/撞击/拉伤后出现' },
];

export const RELIEVER_OPTIONS: OptionItem[] = [
  { id: 'rest', label: '休息/不动减轻' },
  { id: 'heat', label: '热敷/泡澡缓解' },
  { id: 'ice', label: '冷敷/冰敷缓解' },
  { id: 'posture_change', label: '换姿势/躺下缓解' },
  { id: 'massage', label: '轻揉/拉伸缓解' },
  { id: 'eating', label: '吃点东西/喝温水缓解' },
  { id: 'painkiller', label: '吃止痛药后缓解' },
  { id: 'nothing', label: '怎么调整都不缓解' },
];

export const ASSOCIATED_SYMPTOMS: OptionItem[] = [
  { id: 'fever', label: '发热 / 寒战' },
  { id: 'nausea_vomit', label: '恶心 / 呕吐' },
  { id: 'dyspnea', label: '胸闷 / 呼吸困难' },
  { id: 'cold_sweat', label: '出冷汗 / 心慌' },
  { id: 'dizziness_vision', label: '头晕 / 视物模糊或重影' },
  { id: 'limb_weakness', label: '肢体麻木 / 明显无力' },
  { id: 'swelling_redness', label: '局部肿胀 / 发红发烫' },
  { id: 'joint_lock', label: '关节弹响 / 卡顿打软腿' },
  { id: 'bowel_bladder', label: '大小便异常 / 排尿痛' },
  { id: 'radiating_pain', label: '向其他部位放射/牵扯' },
];

export function describeSeverity(score: number): { level: string; hint: string } {
  if (score <= 0) return { level: '无明显疼痛', hint: '以发紧、异物感或轻度不适为主' };
  if (score <= 3) return { level: '轻度不适', hint: '能察觉，但基本不影响正常生活和睡眠' };
  if (score <= 6) return { level: '中度疼痛', hint: '明显干扰注意力、日常活动或入睡' };
  if (score <= 8) return { level: '重度疼痛', hint: '难以忍受，明显影响行动或夜间痛醒' };
  return { level: '极重度剧痛', hint: '剧烈难忍，建议尽快寻求医疗帮助' };
}

export function mapOptionLabels(ids: string[], list: OptionItem[]): string[] {
  const byId = new Map(list.map((o) => [o.id, o.label]));
  return ids.map((id) => byId.get(id) ?? id);
}

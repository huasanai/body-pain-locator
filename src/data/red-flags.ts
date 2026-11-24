import type { RedFlagAlert, SymptomSession } from '@/types/session';

export function evaluateRedFlags(
  painPoints: SymptomSession['painPoints'],
  assessment: SymptomSession['assessment'],
): RedFlagAlert[] {
  const alerts: RedFlagAlert[] = [];
  const regions = new Set(painPoints.map((p) => p.regionId));
  const qualities = new Set(assessment.qualities);
  const assoc = new Set(assessment.associatedSymptoms);
  const hasAnyPoint = painPoints.length > 0;

  // 1. 急性心源性 / 胸腔急症
  const hasChestOrUpperBack =
    regions.has('chest') ||
    painPoints.some(
      (p) =>
        (p.regionId === 'scapula' || p.regionId === 'shoulder') && p.laterality === 'left',
    );
  if (
    hasChestOrUpperBack &&
    (qualities.has('crushing') ||
      assoc.has('dyspnea') ||
      assoc.has('cold_sweat') ||
      (regions.has('chest') && assessment.severity >= 7))
  ) {
    alerts.push({
      id: 'rf_acs_chest',
      level: 'emergency',
      title: '警惕急性心脏或胸腔急症信号',
      reason: '胸口或左侧肩背出现压榨/发闷感，或伴随呼吸困难、出冷汗、心慌或重度疼痛。',
      actionAdvice: '请立即停止活动并原地休息，切勿自行驾车，优先拨打急救电话（120）或前往就近医院急诊科。',
    });
  }

  // 2. 雷击样头痛 / 脑膜刺激征 / 急性神经异常
  if (
    regions.has('head') &&
    ((assessment.onsetType === 'sudden' && assessment.severity >= 7) ||
      (assoc.has('fever') && regions.has('neck')) ||
      assoc.has('limb_weakness') ||
      assoc.has('dizziness_vision'))
  ) {
    alerts.push({
      id: 'rf_thunderclap_head',
      level: 'emergency',
      title: '警惕高危神经系统头痛信号',
      reason: '突发剧烈头痛，或头痛同时伴随发热颈部僵痛、视物模糊、肢体麻木无力。',
      actionAdvice: '此类症状需优先排除脑血管意外或中枢感染，请尽快前往急诊科或神经内科急诊评估。',
    });
  }

  // 3. 急腹症（阑尾炎 / 胆囊炎 / 穿孔等）
  if (
    regions.has('abdomen') &&
    (assessment.severity >= 7 ||
      (assessment.onsetType === 'sudden' && assessment.severity >= 5) ||
      (assoc.has('fever') && assoc.has('nausea_vomit')))
  ) {
    alerts.push({
      id: 'rf_acute_abdomen',
      level: 'urgent',
      title: '警惕急腹症可能',
      reason: '腹部突发明显疼痛、重度腹痛，或伴随发热、恶心呕吐。',
      actionAdvice: '就诊前请暂禁食水、避免自行服用强效止痛药以免掩盖体征，建议尽快前往急诊或普外科。',
    });
  }

  // 4. 马尾神经受压警示
  if (
    regions.has('lower_back') &&
    (assoc.has('bowel_bladder') || assoc.has('limb_weakness'))
  ) {
    alerts.push({
      id: 'rf_cauda_equina',
      level: 'emergency',
      title: '警惕脊髓 / 马尾神经受压风险',
      reason: '下腰部疼痛伴随大小便异常、会阴区麻木或下肢明显麻木无力。',
      actionAdvice: '这属于脊柱急症红旗信号，建议立即前往急诊骨科或神经外科检查。',
    });
  }

  // 5. 单侧小腿肿痛警惕下肢深静脉血栓 (DVT)
  if ((regions.has('thigh_calf') || regions.has('posterior_thigh_popliteal')) && assoc.has('swelling_redness')) {
    alerts.push({
      id: 'rf_dvt_calf',
      level: 'urgent',
      title: '下肢肿胀疼痛请注意排查血管问题',
      reason: '大腿或小腿出现明显局部肿胀、发红或发烫。',
      actionAdvice: '切勿用力按摩揉搓小腿，建议尽快前往血管外科或急诊排查下肢深静脉血栓或感染。',
    });
  }

  // 6. 眼部急症（急性青光眼/视网膜急症）
  if (
    regions.has('eye') &&
    (assoc.has('dizziness_vision') ||
      (assessment.severity >= 6 && assoc.has('nausea_vomit')))
  ) {
    alerts.push({
      id: 'rf_eye_vision',
      level: 'emergency',
      title: '警惕眼科急症（视力变化或眼压骤升）',
      reason: '眼痛伴随视物模糊/重影，或剧烈眼胀头痛伴恶心呕吐。',
      actionAdvice: '请尽快前往医院眼科急诊测眼压及眼底检查，避免延误视力保护窗口期。',
    });
  }

  // 7. 通用极重度疼痛提示
  if (hasAnyPoint && assessment.severity >= 8 && alerts.length === 0) {
    alerts.push({
      id: 'rf_high_severity_general',
      level: 'urgent',
      title: '当前疼痛程度较重（≥8分）',
      reason: '剧烈疼痛持续存在，往往提示较明显的急性损伤或器质性病变。',
      actionAdvice: '建议尽快线下就医明确病因，可将本页生成的《就诊定位速览卡》直接出示给医生。',
    });
  }

  return alerts;
}

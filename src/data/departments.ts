import type { AnatomicalLayer, RegionId } from '@/types/anatomy';
import type {
  DepartmentRecommendation,
  OpqrstAssessment,
  PainPoint,
  RedFlagAlert,
  TriageSummary,
  UrgencyLevel,
} from '@/types/session';

const REGION_DEFAULT_DEPTS: Record<RegionId, { primary: string; secondary: string[] }> = {
  head: { primary: '神经内科', secondary: ['疼痛科', '耳鼻喉科（鼻窦相关）'] },
  eye: { primary: '眼科', secondary: ['神经内科（伴偏头痛）'] },
  neck: { primary: '骨科（脊柱外科）', secondary: ['康复医学科', '疼痛科'] },
  shoulder: { primary: '运动医学科 / 骨科', secondary: ['康复医学科'] },
  scapula: { primary: '康复医学科 / 骨科', secondary: ['疼痛科'] },
  chest: { primary: '心内科 / 呼吸内科', secondary: ['胸外科', '消化内科（反流烧心）'] },
  abdomen: { primary: '消化内科', secondary: ['普外科', '泌尿外科 / 妇科'] },
  upper_limb_hand: { primary: '手外科 / 骨科', secondary: ['风湿免疫科（多关节肿痛）'] },
  lower_back: { primary: '骨科（脊柱外科）', secondary: ['康复医学科', '泌尿外科（后腰肾区）'] },
  knee: { primary: '运动医学科 / 骨科（关节外科）', secondary: ['康复医学科'] },
  posterior_thigh_popliteal: {
    primary: '运动医学科 / 骨科',
    secondary: ['康复医学科', '骨科（脊柱外科 · 若伴坐骨神经串麻）'],
  },
  thigh_calf: { primary: '骨科 / 运动医学科', secondary: ['血管外科（单侧肿胀发烫）'] },
  ankle_foot: { primary: '足踝外科 / 骨科', secondary: ['运动医学科', '风湿免疫科（痛风红肿）'] },
};

const DISCLAIMER =
  '本工具仅用于辅助您准确描述身体不适位置与感受，不构成医疗诊断、处方或分诊结论；如有急重症状请及时线下就医。';

function layerHint(layer: AnatomicalLayer): string {
  switch (layer) {
    case 'muscle':
      return '倾向肌肉劳损或拉伤';
    case 'tendon':
      return '倾向肌腱/筋膜附着点牵拉伤或腱炎';
    case 'ligament':
      return '倾向韧带、关节囊或半月板问题';
    case 'bone':
      return '倾向骨骼、关节面或脊柱结构';
    case 'nerve':
      return '倾向神经卡压、牵拉或放射痛';
    case 'vascular':
      return '倾向血管搏动或局部循环相关不适';
    case 'organ':
      return '倾向深层脏器或内脏牵涉不适';
    case 'acupoint':
      return '对应经络穴位压痛或牵涉反应点';
    case 'skin':
      return '倾向体表浅层区域定位';
  }
}

export function evaluateDepartmentHints(
  painPoints: PainPoint[],
  assessment: OpqrstAssessment,
  redFlags: RedFlagAlert[],
): TriageSummary {
  const departments: DepartmentRecommendation[] = [];
  const seen = new Set<string>();

  const pushDept = (rec: DepartmentRecommendation) => {
    if (seen.has(rec.department)) return;
    seen.add(rec.department);
    departments.push(rec);
  };

  let urgencyLevel: UrgencyLevel = 'routine';
  if (redFlags.some((r) => r.level === 'emergency')) {
    urgencyLevel = 'emergency';
    pushDept({
      department: '急诊科',
      priority: 'emergency',
      rationale: '已触发高危急症红旗提醒，建议优先急诊评估排除危险情况。',
    });
  } else if (redFlags.some((r) => r.level === 'urgent') || assessment.severity >= 7) {
    urgencyLevel = 'urgent';
  } else if (assessment.severity >= 4 || assessment.course === 'worsening') {
    urgencyLevel = 'soon';
  }

  // 根据痛点区域与组织层级生成科室建议
  for (const pt of painPoints) {
    const def = REGION_DEFAULT_DEPTS[pt.regionId];
    if (!def) continue;

    // 针对特定“区域+层级”的精细微调
    if (pt.regionId === 'chest' && (pt.layer === 'muscle' || pt.layer === 'bone')) {
      pushDept({
        department: '胸外科 / 骨科',
        priority: 'primary',
        rationale: `胸壁${layerHint(pt.layer)}，按压或动作相关时常先排查肋软骨/胸壁肌群。`,
      });
      pushDept({
        department: '心内科',
        priority: 'secondary',
        rationale: '胸痛仍建议结合心电图排除心源性问题。',
      });
      continue;
    }

    if (pt.regionId === 'abdomen' && pt.structureKey.includes('rlq')) {
      pushDept({
        department: '普外科 / 急诊外科',
        priority: 'primary',
        rationale: '右下腹（回盲部/阑尾区）疼痛常需优先排查急性阑尾炎等外科情况。',
      });
    }

    if (pt.regionId === 'lower_back' && pt.structureKey.includes('kidney')) {
      pushDept({
        department: '泌尿外科 / 肾内科',
        priority: 'primary',
        rationale: '后腰肋脊角/肾区叩痛或绞痛优先排查泌尿系结石或肾脏感染。',
      });
    }

    pushDept({
      department: def.primary,
      priority: 'primary',
      rationale: `针对「${pt.zhClinical}」（${layerHint(pt.layer)}）的常见首诊科室。`,
    });

    for (const sec of def.secondary.slice(0, 1)) {
      pushDept({
        department: sec,
        priority: 'secondary',
        rationale: '可根据伴随症状或初诊检查结果作为备选科室。',
      });
    }
  }

  return {
    source: 'local-rules',
    urgencyLevel,
    departments: departments.slice(0, 4),
    possibleDirections: [],
    followUpQuestions: [],
    disclaimer: DISCLAIMER,
  };
}

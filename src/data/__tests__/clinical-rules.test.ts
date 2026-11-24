import { describe, expect, it } from 'vitest';
import { defaultAdvisorAdapter } from '@/adapters/clipboardAdvisor';
import { evaluateDepartmentHints } from '@/data/departments';
import { evaluateRedFlags } from '@/data/red-flags';
import type { OpqrstAssessment, PainPoint, SymptomSession } from '@/types/session';

const baseAssessment: OpqrstAssessment = {
  qualities: ['aching'],
  severity: 4,
  onsetType: 'gradual',
  duration: '1_3_days',
  course: 'intermittent',
  timingPattern: [],
  triggers: ['movement'],
  relievers: ['rest'],
  associatedSymptoms: [],
  freeText: '',
};

const makePoint = (overrides: Partial<PainPoint>): PainPoint => ({
  id: 'p1',
  role: 'primary',
  structureKey: 'hotspot:knee_patella_l',
  zhClinical: '左侧髌骨',
  zhCommon: '左膝盖骨正前方',
  enName: 'Left patella',
  layer: 'bone',
  regionId: 'knee',
  laterality: 'left',
  worldPosition: [0.1, 0.5, 0.05],
  source: 'hotspot',
  ...overrides,
});

describe('Clinical red-flag & department rules', () => {
  it('triggers emergency alert for crushing chest pain with cold sweat', () => {
    const chestPoint = makePoint({
      structureKey: 'hotspot:chest_precordial',
      zhClinical: '心前区 / 心脏',
      regionId: 'chest',
      layer: 'organ',
    });
    const assessment: OpqrstAssessment = {
      ...baseAssessment,
      qualities: ['crushing'],
      severity: 7,
      associatedSymptoms: ['cold_sweat', 'dyspnea'],
    };

    const flags = evaluateRedFlags([chestPoint], assessment);
    expect(flags.some((f) => f.id === 'rf_acs_chest' && f.level === 'emergency')).toBe(true);

    const triage = evaluateDepartmentHints([chestPoint], assessment, flags);
    expect(triage.urgencyLevel).toBe('emergency');
    expect(triage.departments[0]?.department).toBe('急诊科');
  });

  it('triggers cauda equina alert for lower back pain with bowel/bladder symptoms', () => {
    const backPoint = makePoint({
      structureKey: 'hotspot:lumbar_center',
      zhClinical: '腰椎正中',
      regionId: 'lower_back',
      layer: 'bone',
    });
    const flags = evaluateRedFlags([backPoint], {
      ...baseAssessment,
      associatedSymptoms: ['bowel_bladder'],
    });
    expect(flags.some((f) => f.id === 'rf_cauda_equina')).toBe(true);
  });

  it('recommends sports medicine / orthopedics for routine knee pain without red flags', () => {
    const kneePoint = makePoint({});
    const flags = evaluateRedFlags([kneePoint], baseAssessment);
    expect(flags).toHaveLength(0);

    const triage = evaluateDepartmentHints([kneePoint], baseAssessment, flags);
    expect(triage.urgencyLevel).toBe('soon');
    expect(triage.departments.some((d) => d.department.includes('运动医学科'))).toBe(true);
  });

  it('builds structured AI prompt containing Chinese clinical, common, English names & OPQRST', () => {
    const anklePoint = makePoint({
      structureKey: 'hotspot:ankle_atfl_l',
      zhClinical: '左侧距腓前韧带',
      zhCommon: '左脚外踝前下（最容易崴脚扭伤处）',
      enName: 'Left anterior talofibular ligament (ATFL)',
      layer: 'ligament',
      regionId: 'ankle_foot',
    });
    const session: SymptomSession = {
      schemaVersion: 1,
      sessionId: 'test_1',
      updatedAt: new Date().toISOString(),
      modelProfile: 'standard-adult',
      painPoints: [anklePoint],
      assessment: {
        ...baseAssessment,
        qualities: ['sharp', 'pulling'],
        severity: 6,
      },
      redFlags: [],
      triage: evaluateDepartmentHints([anklePoint], baseAssessment, []),
    };

    const prompt = defaultAdvisorAdapter.buildPrompt(session);
    expect(prompt).toContain('左侧距腓前韧带');
    expect(prompt).toContain('Anterior talofibular ligament'.toLowerCase().slice(0, 0) + 'Left anterior talofibular ligament');
    expect(prompt).toContain('6 / 10');
    expect(prompt).toContain('刺痛');
    expect(prompt).toContain('韧带 / 关节');
  });
});

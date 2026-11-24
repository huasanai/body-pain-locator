import type { AnatomicalLayer, Laterality, RegionId } from './anatomy';

export type PainRole = 'primary' | 'radiating';

export interface PainPoint {
  id: string;
  role: PainRole;
  structureKey: string;
  zhClinical: string;
  zhCommon: string;
  enName: string;
  layer: AnatomicalLayer;
  regionId: RegionId;
  laterality: Laterality;
  worldPosition: [number, number, number];
  source: 'mesh' | 'hotspot' | 'acupoint';
  userNote?: string;
}

export type OnsetType = 'sudden' | 'gradual' | 'unsure';
export type PainCourse = 'constant' | 'intermittent' | 'worsening' | 'improving';

export interface OpqrstAssessment {
  qualities: string[];
  severity: number;
  onsetType: OnsetType;
  duration: string;
  course: PainCourse;
  timingPattern: string[];
  triggers: string[];
  relievers: string[];
  associatedSymptoms: string[];
  freeText: string;
}

export interface RedFlagAlert {
  id: string;
  level: 'emergency' | 'urgent';
  title: string;
  reason: string;
  actionAdvice: string;
}

export interface DepartmentRecommendation {
  department: string;
  priority: 'primary' | 'secondary' | 'emergency';
  rationale: string;
}

export type UrgencyLevel = 'routine' | 'soon' | 'urgent' | 'emergency';

export interface TriageSummary {
  source: 'local-rules' | 'ai-live';
  urgencyLevel: UrgencyLevel;
  departments: DepartmentRecommendation[];
  possibleDirections: string[];
  followUpQuestions: string[];
  disclaimer: string;
}

/** 阶段 4 预留：基于地理位置的医院推荐项 */
export interface NearbyHospital {
  id: string;
  name: string;
  level?: string;
  matchedDepartments: string[];
  distanceMeters: number;
  address: string;
  coordinates: { lat: number; lng: number };
  navigationUrl: string;
}

export interface SymptomSession {
  schemaVersion: 1;
  sessionId: string;
  updatedAt: string;
  modelProfile: 'standard-adult';
  painPoints: PainPoint[];
  assessment: OpqrstAssessment;
  redFlags: RedFlagAlert[];
  triage: TriageSummary;
  nearbyHospitals?: NearbyHospital[];
}

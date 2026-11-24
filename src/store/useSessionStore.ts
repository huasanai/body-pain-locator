import { create } from 'zustand';
import { defaultAdvisorAdapter } from '@/adapters/clipboardAdvisor';
import { defaultStorageAdapter } from '@/adapters/localStorageAdapter';
import { evaluateRedFlags } from '@/data/red-flags';
import { REGION_PRESET_MAP } from '@/data/regions';
import type {
  AnatomicalLayer,
  LayerVisibilityState,
  RegionId,
  ThemeMode,
} from '@/types/anatomy';
import type { DepthPickCandidate, LayerLoadProgress } from '@/types/bridge';
import type { OpqrstAssessment, PainPoint, PainRole, SymptomSession } from '@/types/session';

const DEFAULT_LAYERS: LayerVisibilityState = {
  skin: { visible: true, opacity: 0.14 },
  muscle: { visible: true, opacity: 0.88 },
  tendon: { visible: true, opacity: 1.0 },
  ligament: { visible: true, opacity: 1.0 },
  bone: { visible: true, opacity: 1.0 },
  nerve: { visible: false, opacity: 1.0 },
  vascular: { visible: false, opacity: 0.92 },
  organ: { visible: false, opacity: 0.96 },
  acupoint: { visible: false, opacity: 1.0 },
};

const DEFAULT_ASSESSMENT: OpqrstAssessment = {
  qualities: [],
  severity: 4,
  onsetType: 'gradual',
  duration: '1_3_days',
  course: 'intermittent',
  timingPattern: [],
  triggers: [],
  relievers: [],
  associatedSymptoms: [],
  freeText: '',
};

function createSessionId(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function buildDerivedSession(
  sessionId: string,
  painPoints: PainPoint[],
  assessment: OpqrstAssessment,
): SymptomSession {
  const redFlags = evaluateRedFlags(painPoints, assessment);
  const draft: SymptomSession = {
    schemaVersion: 1,
    sessionId,
    updatedAt: new Date().toISOString(),
    modelProfile: 'standard-adult',
    painPoints,
    assessment,
    redFlags,
    triage: {
      source: 'local-rules',
      urgencyLevel: 'routine',
      departments: [],
      possibleDirections: [],
      followUpQuestions: [],
      disclaimer: '',
    },
  };
  draft.triage = defaultAdvisorAdapter.evaluateLocalTriage(draft);
  return draft;
}

const THEME_KEY = 'bpl_theme_mode';

function loadInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'clinical-light' || saved === 'tech-dark') return saved;
  } catch {
    // ignore
  }
  return 'clinical-light';
}

export interface HoverState {
  candidate: DepthPickCandidate;
  screenPos: { x: number; y: number };
}

export interface DepthPickState {
  candidates: DepthPickCandidate[];
  screenPos: { x: number; y: number };
}

interface SessionStore {
  theme: ThemeMode;
  activeRegion: RegionId | null;
  altViewActive: boolean;
  layers: LayerVisibilityState;
  showHotspots: boolean;
  showCallouts: boolean;
  peeledKeys: string[];
  layerProgress: Partial<Record<AnatomicalLayer, LayerLoadProgress>>;

  hover: HoverState | null;
  depthPick: DepthPickState | null;

  session: SymptomSession;
  exportModalTab: 'doctor' | 'ai' | null;
  attributionOpen: boolean;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  selectRegion: (regionId: RegionId, toggleAlt?: boolean) => void;
  clearActiveRegion: () => void;
  setLayerVisible: (layer: AnatomicalLayer, visible: boolean) => void;
  setLayerOpacity: (layer: AnatomicalLayer, opacity: number) => void;
  setShowHotspots: (show: boolean) => void;
  setShowCallouts: (show: boolean) => void;
  resetLayers: () => void;

  setHover: (hover: HoverState | null) => void;
  setDepthPick: (pick: DepthPickState | null) => void;
  setLayerProgress: (progress: LayerLoadProgress) => void;

  addPainPointFromCandidate: (candidate: DepthPickCandidate, role?: PainRole) => void;
  removePainPoint: (id: string) => void;
  updatePainPointRole: (id: string, role: PainRole) => void;
  updatePainPointNote: (id: string, note: string) => void;
  togglePeeledKey: (structureKey: string) => void;
  restoreAllPeeled: () => void;

  updateAssessment: (patch: Partial<OpqrstAssessment>) => void;
  toggleAssessmentArrayItem: (
    field: 'qualities' | 'timingPattern' | 'triggers' | 'relievers' | 'associatedSymptoms',
    id: string,
  ) => void;

  openExportModal: (tab: 'doctor' | 'ai') => void;
  closeExportModal: () => void;
  setAttributionOpen: (open: boolean) => void;
  resetSession: () => void;
}

const persisted = defaultStorageAdapter.loadLatestSession();
const initialSession = persisted
  ? buildDerivedSession(persisted.sessionId, persisted.painPoints, persisted.assessment)
  : buildDerivedSession(createSessionId(), [], DEFAULT_ASSESSMENT);

export const useSessionStore = create<SessionStore>((set, get) => ({
  theme: loadInitialTheme(),
  activeRegion: null,
  altViewActive: false,
  layers: DEFAULT_LAYERS,
  showHotspots: true,
  showCallouts: true,
  peeledKeys: [],
  layerProgress: {},

  hover: null,
  depthPick: null,

  session: initialSession,
  exportModalTab: null,
  attributionOpen: false,

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'clinical-light' ? 'tech-dark' : 'clinical-light';
    get().setTheme(next);
  },

  selectRegion: (regionId, toggleAlt = false) => {
    const preset = REGION_PRESET_MAP[regionId];
    const current = get();
    const isSame = current.activeRegion === regionId;
    const altViewActive =
      toggleAlt && preset.altCameraPos
        ? isSame
          ? !current.altViewActive
          : true
        : false;

    const mergedLayers: LayerVisibilityState = {
      skin: { ...current.layers.skin, ...preset.recommendedLayers.skin },
      muscle: { ...current.layers.muscle, ...preset.recommendedLayers.muscle },
      tendon: { ...current.layers.tendon, ...preset.recommendedLayers.tendon },
      ligament: { ...current.layers.ligament, ...preset.recommendedLayers.ligament },
      bone: { ...current.layers.bone, ...preset.recommendedLayers.bone },
      nerve: { ...current.layers.nerve, ...preset.recommendedLayers.nerve },
      vascular: { ...current.layers.vascular, ...preset.recommendedLayers.vascular },
      organ: { ...current.layers.organ, ...preset.recommendedLayers.organ },
      acupoint: { ...current.layers.acupoint, ...preset.recommendedLayers.acupoint },
    };

    set({
      activeRegion: regionId,
      altViewActive,
      layers: mergedLayers,
      depthPick: null,
    });
  },

  clearActiveRegion: () => set({ activeRegion: null, altViewActive: false }),

  setLayerVisible: (layer, visible) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: { ...state.layers[layer], visible },
      },
    })),

  setLayerOpacity: (layer, opacity) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: { ...state.layers[layer], opacity: Math.max(0.05, Math.min(1, opacity)) },
      },
    })),

  setShowHotspots: (showHotspots) => set({ showHotspots }),
  setShowCallouts: (showCallouts) => set({ showCallouts }),

  resetLayers: () => set({ layers: DEFAULT_LAYERS, peeledKeys: [] }),

  setHover: (hover) => set({ hover }),
  setDepthPick: (depthPick) => set({ depthPick }),

  setLayerProgress: (progress) =>
    set((state) => ({
      layerProgress: {
        ...state.layerProgress,
        [progress.layer]: progress,
      },
    })),

  addPainPointFromCandidate: (candidate, role) => {
    const { session } = get();
    const existing = session.painPoints.find((p) => p.structureKey === candidate.structureKey);
    if (existing) {
      set({ depthPick: null });
      return;
    }

    const assignedRole: PainRole =
      role ?? (session.painPoints.length === 0 ? 'primary' : 'radiating');

    const newPoint: PainPoint = {
      id: `pt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      role: assignedRole,
      structureKey: candidate.structureKey,
      zhClinical: candidate.zhClinical,
      zhCommon: candidate.zhCommon,
      enName: candidate.enName,
      layer: candidate.layer,
      regionId: candidate.regionId,
      laterality: candidate.laterality,
      worldPosition: candidate.worldPosition,
      source: candidate.source,
    };

    const nextSession = buildDerivedSession(
      session.sessionId,
      [...session.painPoints, newPoint],
      session.assessment,
    );
    defaultStorageAdapter.saveSession(nextSession);
    set({ session: nextSession, depthPick: null });
  },

  removePainPoint: (id) => {
    const { session } = get();
    const nextPoints = session.painPoints.filter((p) => p.id !== id);
    const nextSession = buildDerivedSession(session.sessionId, nextPoints, session.assessment);
    defaultStorageAdapter.saveSession(nextSession);
    set({ session: nextSession });
  },

  updatePainPointRole: (id, role) => {
    const { session } = get();
    const nextPoints = session.painPoints.map((p) => (p.id === id ? { ...p, role } : p));
    const nextSession = buildDerivedSession(session.sessionId, nextPoints, session.assessment);
    defaultStorageAdapter.saveSession(nextSession);
    set({ session: nextSession });
  },

  updatePainPointNote: (id, userNote) => {
    const { session } = get();
    const nextPoints = session.painPoints.map((p) => (p.id === id ? { ...p, userNote } : p));
    const nextSession = buildDerivedSession(session.sessionId, nextPoints, session.assessment);
    defaultStorageAdapter.saveSession(nextSession);
    set({ session: nextSession });
  },

  togglePeeledKey: (structureKey) =>
    set((state) => ({
      peeledKeys: state.peeledKeys.includes(structureKey)
        ? state.peeledKeys.filter((k) => k !== structureKey)
        : [...state.peeledKeys, structureKey],
    })),

  restoreAllPeeled: () => set({ peeledKeys: [] }),

  updateAssessment: (patch) => {
    const { session } = get();
    const nextAssessment: OpqrstAssessment = { ...session.assessment, ...patch };
    const nextSession = buildDerivedSession(session.sessionId, session.painPoints, nextAssessment);
    defaultStorageAdapter.saveSession(nextSession);
    set({ session: nextSession });
  },

  toggleAssessmentArrayItem: (field, id) => {
    const { session } = get();
    const list = session.assessment[field];
    const nextList = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    get().updateAssessment({ [field]: nextList });
  },

  openExportModal: (tab) => set({ exportModalTab: tab }),
  closeExportModal: () => set({ exportModalTab: null }),
  setAttributionOpen: (attributionOpen) => set({ attributionOpen }),

  resetSession: () => {
    defaultStorageAdapter.clearAll();
    const fresh = buildDerivedSession(createSessionId(), [], DEFAULT_ASSESSMENT);
    set({
      session: fresh,
      depthPick: null,
      peeledKeys: [],
    });
  },
}));

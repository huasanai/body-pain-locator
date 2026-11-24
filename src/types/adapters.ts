import type { RegionId } from './anatomy';
import type { NearbyHospital, SymptomSession, TriageSummary } from './session';

export type Suggested3DCommand =
  | { type: 'focusRegion'; regionId: RegionId; useAltView?: boolean }
  | { type: 'highlightStructures'; structureKeys: string[] };

export interface AdvisorResult {
  promptText: string;
  triage: TriageSummary;
  suggested3DCommands?: Suggested3DCommand[];
}

export interface AdvisorAdapter {
  readonly mode: 'offline-prompt' | 'live-ai';
  buildPrompt(session: SymptomSession): string;
  evaluateLocalTriage(session: SymptomSession): TriageSummary;
  streamConsult?(
    session: SymptomSession,
    userMessage: string,
    onChunk: (text: string) => void,
  ): Promise<AdvisorResult>;
}

export interface HospitalLocatorAdapter {
  readonly enabled: boolean;
  searchNearby(params: {
    departments: string[];
    urgency: TriageSummary['urgencyLevel'];
    coords?: { lat: number; lng: number };
    cityName?: string;
  }): Promise<NearbyHospital[]>;
}

export interface StorageAdapter {
  saveSession(session: SymptomSession): void;
  loadLatestSession(): SymptomSession | null;
  listHistory(): SymptomSession[];
  clearAll(): void;
}

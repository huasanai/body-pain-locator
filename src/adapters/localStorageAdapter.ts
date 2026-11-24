import type { StorageAdapter } from '@/types/adapters';
import type { SymptomSession } from '@/types/session';

const LATEST_KEY = 'bpl_latest_session_v1';
const HISTORY_KEY = 'bpl_session_history_v1';

export class LocalStorageAdapter implements StorageAdapter {
  saveSession(session: SymptomSession): void {
    try {
      localStorage.setItem(LATEST_KEY, JSON.stringify(session));
      const history = this.listHistory().filter((s) => s.sessionId !== session.sessionId);
      history.unshift(session);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 15)));
    } catch {
      // 忽略隐私模式或配额受限错误
    }
  }

  loadLatestSession(): SymptomSession | null {
    try {
      const raw = localStorage.getItem(LATEST_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SymptomSession;
      if (parsed && parsed.schemaVersion === 1) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  listHistory(): SymptomSession[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SymptomSession[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  clearAll(): void {
    try {
      localStorage.removeItem(LATEST_KEY);
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  }
}

export const defaultStorageAdapter = new LocalStorageAdapter();

import type { SessionDescriptor } from '../data/trainingPlan';

export interface SessionRecord {
  completed: boolean;
  pace: string;
  totalTime: string;
  intervalTimes: string[];
  notes: string;
  strokeRate?: number;
  completedDate?: string;
}

export interface StoredData {
  version: 1;
  sessions: Record<string, SessionRecord>;
  optionalVisible: Record<number, boolean>;
  customSessions: Record<number, SessionDescriptor[]>;
  extraWeeks: SessionDescriptor[];
}

const STORAGE_KEY = 'petePlanData';

export function createEmptySession(): SessionRecord {
  return { completed: false, pace: '', totalTime: '', intervalTimes: [], notes: '' };
}

export function createDefault(): StoredData {
  return { version: 1, sessions: {}, optionalVisible: {}, customSessions: {}, extraWeeks: [] };
}

export function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefault();
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return createDefault();
    if (!parsed.customSessions) parsed.customSessions = {};
    if (!parsed.extraWeeks) parsed.extraWeeks = [];
    return parsed as StoredData;
  } catch {
    return createDefault();
  }
}

export function saveData(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function sessionKey(week: number, day: number): string {
  return `${week}-${day}`;
}

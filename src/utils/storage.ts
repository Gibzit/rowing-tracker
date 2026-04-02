import type { SessionDescriptor } from '../data/trainingPlan';
import type { UnlockedAchievement } from './achievements';

export interface SessionRecord {
  completed: boolean;
  pace: string;
  totalTime: string;
  intervalTimes: string[];
  notes: string;
  strokeRate?: number;
  completedDate?: string;
  rpe?: number;        // 1-10, rate of perceived exertion
  dragFactor?: number; // 1-10, machine power level setting
}

export interface PlanSnapshot {
  savedAt: string;
  sessions: SessionDescriptor[];
  changeDescription: string;
}

export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  sessions: SessionDescriptor[];
  history: PlanSnapshot[];
}

/** Session records + optionalVisible for a single plan (used for inactive plans) */
export interface PlanSessionData {
  sessions: Record<string, SessionRecord>;
  optionalVisible: Record<number, boolean>;
}

export interface StoredData {
  version: 1;
  /** Active plan's session records, keyed by "week-day" */
  sessions: Record<string, SessionRecord>;
  optionalVisible: Record<number, boolean>;
  /** @deprecated Absorbed into plan.sessions after migration */
  customSessions: Record<number, SessionDescriptor[]>;
  /** @deprecated Absorbed into plan.sessions after migration */
  extraWeeks: SessionDescriptor[];
  onboardingComplete?: boolean;
  achievements?: UnlockedAchievement[];
  restDays?: string[];
  /** Active plan ID */
  activePlanId?: string;
  /** All saved plans (plan definitions with session descriptors) */
  plans?: TrainingPlan[];
  /** Session records for inactive plans, keyed by planId */
  planSessions?: Record<string, PlanSessionData>;
  defaultDragFactor?: number; // 1-10, user's default power level
}

const STORAGE_KEY = 'petePlanData';

export function createEmptySession(): SessionRecord {
  return { completed: false, pace: '', totalTime: '', intervalTimes: [], notes: '' };
}

export function createDefault(): StoredData {
  return {
    version: 1,
    sessions: {},
    optionalVisible: {},
    customSessions: {},
    extraWeeks: [],
  };
}

export function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefault();
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return createDefault();
    if (!parsed.customSessions) parsed.customSessions = {};
    if (!parsed.extraWeeks) parsed.extraWeeks = [];
    if (!parsed.onboardingComplete && Object.keys(parsed.sessions || {}).length > 0) {
      parsed.onboardingComplete = true;
    }
    if (!parsed.achievements) parsed.achievements = [];
    if (!parsed.restDays) parsed.restDays = [];
    if (!parsed.planSessions) parsed.planSessions = {};
    if (!parsed.plans) parsed.plans = [];
    // Guard: if plans exist but activePlanId is missing, default to first plan
    if (!parsed.activePlanId && parsed.plans.length > 0) {
      parsed.activePlanId = parsed.plans[0].id;
    } else if (!parsed.activePlanId) {
      parsed.activePlanId = undefined;
    }
    return parsed as StoredData;
  } catch {
    return createDefault();
  }
}

export function saveData(data: StoredData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded. Some data may not be saved.');
    }
    return false;
  }
}

export function sessionKey(week: number, day: number): string {
  return `${week}-${day}`;
}

/** Generate a short unique ID for plans */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

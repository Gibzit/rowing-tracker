import { TRAINING_PLAN, type SessionDescriptor } from '../data/trainingPlan';
import type { StoredData } from './storage';

export function getCombinedPlan(data: StoredData): SessionDescriptor[] {
  const custom = Object.values(data.customSessions || {}).flat();
  return [...TRAINING_PLAN, ...custom, ...(data.extraWeeks || [])];
}

export function getWeekSessions(
  data: StoredData,
  weekNumber: number
): SessionDescriptor[] {
  const base = TRAINING_PLAN.filter((s) => s.weekNumber === weekNumber);
  const custom = data.customSessions?.[weekNumber] || [];
  const extra = (data.extraWeeks || []).filter((s) => s.weekNumber === weekNumber);
  return [...base, ...custom, ...extra];
}

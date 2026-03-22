import { TRAINING_PLAN, type SessionDescriptor } from '../data/trainingPlan';
import type { StoredData, TrainingPlan } from './storage';

/** Get the active TrainingPlan if the plan system is active, or undefined */
export function getActivePlan(data: StoredData): TrainingPlan | undefined {
  if (data.plans && data.plans.length > 0 && data.activePlanId) {
    return data.plans.find((p) => p.id === data.activePlanId);
  }
  return undefined;
}

export function getCombinedPlan(data: StoredData): SessionDescriptor[] {
  // If plan system is active, use the active plan's sessions
  const plan = getActivePlan(data);
  if (plan) return plan.sessions;

  // Fallback: legacy behavior
  const custom = Object.values(data.customSessions || {}).flat();
  return [...TRAINING_PLAN, ...custom, ...(data.extraWeeks || [])];
}

export function getWeekSessions(
  data: StoredData,
  weekNumber: number
): SessionDescriptor[] {
  // If plan system is active, filter from the active plan
  const plan = getActivePlan(data);
  if (plan) {
    return plan.sessions.filter((s) => s.weekNumber === weekNumber);
  }

  // Fallback: legacy behavior
  const base = TRAINING_PLAN.filter((s) => s.weekNumber === weekNumber);
  const custom = data.customSessions?.[weekNumber] || [];
  const extra = (data.extraWeeks || []).filter((s) => s.weekNumber === weekNumber);
  return [...base, ...custom, ...extra];
}

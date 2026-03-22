import type { SessionDescriptor } from '../data/trainingPlan';
import type { TrainingPlan, PlanSnapshot } from './storage';
import { generateId } from './storage';

const MAX_SNAPSHOTS = 20;

function pushSnapshot(
  plan: TrainingPlan,
  changeDescription: string
): PlanSnapshot[] {
  const snapshot: PlanSnapshot = {
    savedAt: new Date().toISOString(),
    sessions: plan.sessions.map((s) => ({ ...s })),
    changeDescription,
  };
  return [...plan.history, snapshot].slice(-MAX_SNAPSHOTS);
}

/** Create a new plan by copying from a template */
export function createPlanFromTemplate(
  template: TrainingPlan,
  name: string
): TrainingPlan {
  return {
    id: generateId(),
    name,
    description: template.description,
    createdAt: new Date().toISOString(),
    sessions: template.sessions.map((s) => ({ ...s })),
    history: [],
  };
}

/** Create a blank plan with N weeks, each having 3 empty core + 2 optional sessions */
export function createBlankPlan(name: string, weekCount: number): TrainingPlan {
  const sessions: SessionDescriptor[] = [];
  for (let w = 1; w <= weekCount; w++) {
    sessions.push(
      { weekNumber: w, dayNumber: 1, label: 'Session 1', description: '', isOptional: false },
      { weekNumber: w, dayNumber: 2, label: 'Session 2', description: '', isOptional: false },
      { weekNumber: w, dayNumber: 3, label: 'Session 3', description: '', isOptional: false },
      { weekNumber: w, dayNumber: 4, label: 'Session 4', description: '', isOptional: true },
      { weekNumber: w, dayNumber: 5, label: 'Session 5', description: '', isOptional: true },
    );
  }
  return {
    id: generateId(),
    name,
    description: '',
    createdAt: new Date().toISOString(),
    sessions,
    history: [],
  };
}

/** Edit a single session's fields within a plan (creates snapshot first) */
export function editPlanSession(
  plan: TrainingPlan,
  weekNumber: number,
  dayNumber: number,
  patch: Partial<Pick<SessionDescriptor, 'label' | 'description' | 'isOptional'>>
): TrainingPlan {
  const history = pushSnapshot(plan, `Edited W${weekNumber} D${dayNumber}`);
  const sessions = plan.sessions.map((s) =>
    s.weekNumber === weekNumber && s.dayNumber === dayNumber
      ? { ...s, ...patch }
      : s
  );
  return { ...plan, sessions, history };
}

/** Delete a session from a plan (creates snapshot first) */
export function deletePlanSession(
  plan: TrainingPlan,
  weekNumber: number,
  dayNumber: number
): TrainingPlan {
  const history = pushSnapshot(plan, `Deleted W${weekNumber} D${dayNumber}`);
  const sessions = plan.sessions.filter(
    (s) => !(s.weekNumber === weekNumber && s.dayNumber === dayNumber)
  );
  return { ...plan, sessions, history };
}

/** Add a new session to a plan (creates snapshot first) */
export function addPlanSession(
  plan: TrainingPlan,
  session: SessionDescriptor
): TrainingPlan {
  const history = pushSnapshot(plan, `Added session W${session.weekNumber} D${session.dayNumber}`);
  return { ...plan, sessions: [...plan.sessions, session], history };
}

/** Add a new week to a plan with the given sessions */
export function addWeekToPlan(
  plan: TrainingPlan,
  weekSessions: SessionDescriptor[]
): TrainingPlan {
  const weekNum = weekSessions[0]?.weekNumber;
  const history = pushSnapshot(plan, `Added week ${weekNum}`);
  return { ...plan, sessions: [...plan.sessions, ...weekSessions], history };
}

/** Rename a plan (no snapshot needed) */
export function renamePlan(plan: TrainingPlan, name: string): TrainingPlan {
  return { ...plan, name };
}

/** Restore a snapshot (creates a snapshot of current state first, then restores) */
export function restorePlanSnapshot(
  plan: TrainingPlan,
  snapshotIndex: number
): TrainingPlan {
  const snapshot = plan.history[snapshotIndex];
  if (!snapshot) return plan;

  const history = pushSnapshot(plan, 'Restored snapshot');
  const sessions = snapshot.sessions.map((s) => ({ ...s }));
  return { ...plan, sessions, history };
}

/** Get the highest week number in a plan */
export function getPlanTotalWeeks(plan: TrainingPlan): number {
  if (plan.sessions.length === 0) return 0;
  return Math.max(...plan.sessions.map((s) => s.weekNumber));
}

/** Get the next available dayNumber for a given week in a plan */
export function getNextDayNumber(plan: TrainingPlan, weekNumber: number): number {
  const weekSessions = plan.sessions.filter((s) => s.weekNumber === weekNumber);
  if (weekSessions.length === 0) return 1;
  return Math.max(...weekSessions.map((s) => s.dayNumber)) + 1;
}

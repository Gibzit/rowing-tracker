import type { SessionRecord } from './storage';
import { sessionKey } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { paceToSeconds, secondsToPace, categorizeWorkout } from './paceUtils';
import type { WorkoutCategory } from './paceUtils';

export interface PersonalBest {
  category: WorkoutCategory;
  categoryLabel: string;
  paceSeconds: number;
  paceFormatted: string;
  workoutLabel: string; // the specific workout where the PB was set
  weekNumber: number;
  dayNumber: number;
  completedDate?: string;
  avgPaceSeconds?: number;
  avgPaceFormatted?: string;
  improvementPct?: number; // negative = faster (better)
  sessionCount: number;
}

const CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  distance: 'Distance',
  interval: 'Interval',
  time: 'Time',
};

export function computePersonalBests(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): PersonalBest[] {
  const bestByCategory = new Map<WorkoutCategory, PersonalBest>();
  const allPacesByCategory = new Map<WorkoutCategory, number[]>();

  for (const desc of plan) {
    const key = sessionKey(desc.weekNumber, desc.dayNumber);
    const record = sessions[key];
    if (!record?.pace) continue;

    const paceSeconds = paceToSeconds(record.pace);
    if (paceSeconds === null) continue;

    const category = categorizeWorkout(desc.label);

    // Track all paces for this category
    if (!allPacesByCategory.has(category)) {
      allPacesByCategory.set(category, []);
    }
    allPacesByCategory.get(category)!.push(paceSeconds);

    const existing = bestByCategory.get(category);
    if (!existing || paceSeconds < existing.paceSeconds) {
      bestByCategory.set(category, {
        category,
        categoryLabel: CATEGORY_LABELS[category],
        paceSeconds,
        paceFormatted: secondsToPace(paceSeconds),
        workoutLabel: desc.label,
        weekNumber: desc.weekNumber,
        dayNumber: desc.dayNumber,
        completedDate: record.completedDate,
        sessionCount: 0, // filled below
      });
    }
  }

  // Enrich with averages and improvement
  for (const [category, pb] of bestByCategory) {
    const allPaces = allPacesByCategory.get(category) || [];
    pb.sessionCount = allPaces.length;
    if (allPaces.length > 0) {
      const avg = allPaces.reduce((a, b) => a + b, 0) / allPaces.length;
      pb.avgPaceSeconds = avg;
      pb.avgPaceFormatted = secondsToPace(avg);
      if (avg > 0) {
        // How much faster PB is vs average (negative = faster = better)
        pb.improvementPct = Math.round(((pb.paceSeconds - avg) / avg) * 100);
      }
    }
  }

  // Sort: distance, interval, time
  const order: WorkoutCategory[] = ['distance', 'interval', 'time'];
  return order
    .filter((cat) => bestByCategory.has(cat))
    .map((cat) => bestByCategory.get(cat)!);
}

export function isNewPB(
  label: string,
  newPaceSeconds: number,
  currentBests: PersonalBest[]
): boolean {
  const category = categorizeWorkout(label);
  const existing = currentBests.find((pb) => pb.category === category);
  if (!existing) return true;
  return newPaceSeconds < existing.paceSeconds;
}

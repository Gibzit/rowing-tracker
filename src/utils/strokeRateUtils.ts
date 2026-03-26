import type { SessionRecord } from './storage';
import { sessionKey } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import type { WorkoutCategory } from './paceUtils';
import { categorizeWorkout } from './paceUtils';

export interface StrokeRateDataPoint {
  weekNumber: number;
  dayNumber: number;
  label: string;
  strokeRate: number;
  category: WorkoutCategory;
  completedDate?: string;
}

export function extractStrokeRateData(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): StrokeRateDataPoint[] {
  const points: StrokeRateDataPoint[] = [];

  for (const desc of plan) {
    const key = sessionKey(desc.weekNumber, desc.dayNumber);
    const record = sessions[key];
    if (!record?.strokeRate || !record.completed) continue;

    points.push({
      weekNumber: desc.weekNumber,
      dayNumber: desc.dayNumber,
      label: desc.label,
      strokeRate: record.strokeRate,
      category: categorizeWorkout(desc.label),
      completedDate: record.completedDate,
    });
  }

  // Sort by completion date (earliest first), fall back to plan order for undated
  points.sort((a, b) => {
    if (a.completedDate && b.completedDate) return a.completedDate.localeCompare(b.completedDate);
    if (a.completedDate && !b.completedDate) return -1;
    if (!a.completedDate && b.completedDate) return 1;
    return 0;
  });

  return points;
}

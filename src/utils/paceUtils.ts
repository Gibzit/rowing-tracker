import type { SessionRecord } from './storage';
import { sessionKey } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';

export type WorkoutCategory = 'distance' | 'interval' | 'time';

export interface PaceDataPoint {
  weekNumber: number;
  dayNumber: number;
  label: string;
  paceSeconds: number;
  category: WorkoutCategory;
  completedDate?: string;
}

export function paceToSeconds(pace: string): number | null {
  const match = pace.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  if (seconds >= 60) return null;
  return minutes * 60 + seconds;
}

export function secondsToPace(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function categorizeWorkout(label: string): WorkoutCategory {
  if (/\d+\s*[x\u00d7]\s*\d+/i.test(label)) return 'interval';
  if (/\d+\s*min/i.test(label)) return 'time';
  return 'distance';
}

export function extractPaceData(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): PaceDataPoint[] {
  const points: PaceDataPoint[] = [];

  for (const desc of plan) {
    const key = sessionKey(desc.weekNumber, desc.dayNumber);
    const record = sessions[key];
    if (!record?.pace) continue;

    const paceSeconds = paceToSeconds(record.pace);
    if (paceSeconds === null) continue;

    points.push({
      weekNumber: desc.weekNumber,
      dayNumber: desc.dayNumber,
      label: desc.label,
      paceSeconds,
      category: categorizeWorkout(desc.label),
      completedDate: record.completedDate,
    });
  }

  // Sort by completion date (earliest first), fall back to plan order for undated
  points.sort((a, b) => {
    if (a.completedDate && b.completedDate) return a.completedDate.localeCompare(b.completedDate);
    if (a.completedDate && !b.completedDate) return -1;
    if (!a.completedDate && b.completedDate) return 1;
    return 0; // preserve plan order for undated
  });

  return points;
}

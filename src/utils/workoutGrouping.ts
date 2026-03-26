import type { SessionRecord } from './storage';
import { sessionKey } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { paceToSeconds, secondsToPace } from './paceUtils';

export interface WorkoutEntry {
  weekNumber: number;
  dayNumber: number;
  paceSeconds: number;
  paceFormatted: string;
}

export interface GroupedWorkout {
  label: string;
  entries: WorkoutEntry[];
  bestPaceSeconds: number;
}

export function normalizeLabel(label: string): string {
  return label.replace(/\s+/g, '').toLowerCase();
}

export function groupWorkouts(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): GroupedWorkout[] {
  const groups = new Map<string, { label: string; entries: WorkoutEntry[] }>();

  for (const desc of plan) {
    const key = sessionKey(desc.weekNumber, desc.dayNumber);
    const record = sessions[key];
    if (!record?.pace) continue;

    const paceSeconds = paceToSeconds(record.pace);
    if (paceSeconds === null) continue;

    const normalized = normalizeLabel(desc.label);
    if (!groups.has(normalized)) {
      groups.set(normalized, { label: desc.label, entries: [] });
    }
    groups.get(normalized)!.entries.push({
      weekNumber: desc.weekNumber,
      dayNumber: desc.dayNumber,
      paceSeconds,
      paceFormatted: secondsToPace(paceSeconds),
    });
  }

  return Array.from(groups.values())
    .filter((g) => g.entries.length >= 2)
    .map((g) => ({
      ...g,
      bestPaceSeconds: Math.min(...g.entries.map((e) => e.paceSeconds)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

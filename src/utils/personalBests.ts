import type { SessionRecord } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { paceToSeconds, secondsToPace } from './paceUtils';

export interface PersonalBest {
  label: string;
  paceSeconds: number;
  paceFormatted: string;
  weekNumber: number;
  dayNumber: number;
}

export function computePersonalBests(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): PersonalBest[] {
  const bestByLabel = new Map<string, PersonalBest>();

  for (const desc of plan) {
    const key = `${desc.weekNumber}-${desc.dayNumber}`;
    const record = sessions[key];
    if (!record?.pace) continue;

    const paceSeconds = paceToSeconds(record.pace);
    if (paceSeconds === null) continue;

    const existing = bestByLabel.get(desc.label);
    if (!existing || paceSeconds < existing.paceSeconds) {
      bestByLabel.set(desc.label, {
        label: desc.label,
        paceSeconds,
        paceFormatted: secondsToPace(paceSeconds),
        weekNumber: desc.weekNumber,
        dayNumber: desc.dayNumber,
      });
    }
  }

  return Array.from(bestByLabel.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function isNewPB(
  label: string,
  newPaceSeconds: number,
  currentBests: PersonalBest[]
): boolean {
  const existing = currentBests.find((pb) => pb.label === label);
  if (!existing) return true;
  return newPaceSeconds < existing.paceSeconds;
}

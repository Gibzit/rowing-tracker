import type { SessionRecord } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { paceToSeconds, secondsToPace } from './paceUtils';

export interface PersonalBest {
  label: string;
  paceSeconds: number;
  paceFormatted: string;
  weekNumber: number;
  dayNumber: number;
  completedDate?: string;
  avgPaceSeconds?: number;
  avgPaceFormatted?: string;
  improvementPct?: number; // negative = faster (better)
  sessionCount: number;
}

export function computePersonalBests(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): PersonalBest[] {
  const bestByLabel = new Map<string, PersonalBest>();
  // Track all paces per label for average calculation
  const allPacesByLabel = new Map<string, number[]>();

  for (const desc of plan) {
    const key = `${desc.weekNumber}-${desc.dayNumber}`;
    const record = sessions[key];
    if (!record?.pace) continue;

    const paceSeconds = paceToSeconds(record.pace);
    if (paceSeconds === null) continue;

    // Track all paces
    if (!allPacesByLabel.has(desc.label)) {
      allPacesByLabel.set(desc.label, []);
    }
    allPacesByLabel.get(desc.label)!.push(paceSeconds);

    const existing = bestByLabel.get(desc.label);
    if (!existing || paceSeconds < existing.paceSeconds) {
      bestByLabel.set(desc.label, {
        label: desc.label,
        paceSeconds,
        paceFormatted: secondsToPace(paceSeconds),
        weekNumber: desc.weekNumber,
        dayNumber: desc.dayNumber,
        completedDate: record.completedDate,
        sessionCount: 0, // filled below
      });
    }
  }

  // Enrich with averages and improvement
  for (const [label, pb] of bestByLabel) {
    const allPaces = allPacesByLabel.get(label) || [];
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

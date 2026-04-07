import type { SessionRecord } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { parseDistance, parseTime } from './pacePredictor';
import { paceToSeconds } from './paceUtils';

export interface WeekVolume {
  weekNumber: number;
  totalMeters: number;
  totalMinutes: number;
}

export function computeWeeklyVolume(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): WeekVolume[] {
  const weekMap = new Map<number, { meters: number; minutes: number }>();

  for (const desc of plan) {
    const key = `${desc.weekNumber}-${desc.dayNumber}`;
    const record = sessions[key];
    if (!record?.completed) continue;

    const existing = weekMap.get(desc.weekNumber) ?? { meters: 0, minutes: 0 };

    let meters = 0;
    const parsedDist = parseDistance(desc.label);
    if (parsedDist !== null) {
      meters = parsedDist;
    } else if (record.pace && record.totalTime) {
      const paceSeconds = paceToSeconds(record.pace);
      const totalTimeSec = parseTime(record.totalTime);
      if (paceSeconds && paceSeconds > 0 && totalTimeSec && totalTimeSec > 0) {
        meters = Math.round((totalTimeSec / paceSeconds) * 500);
      }
    }

    let minutes = 0;
    if (record.totalTime) {
      const totalTimeSec = parseTime(record.totalTime);
      if (totalTimeSec !== null && totalTimeSec > 0) {
        minutes = totalTimeSec / 60;
      }
    }

    existing.meters += meters;
    existing.minutes += minutes;
    weekMap.set(desc.weekNumber, existing);
  }

  return Array.from(weekMap.entries())
    .map(([weekNumber, { meters, minutes }]) => ({
      weekNumber,
      totalMeters: meters,
      totalMinutes: minutes,
    }))
    .sort((a, b) => a.weekNumber - b.weekNumber);
}

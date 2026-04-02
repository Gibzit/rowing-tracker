import type { SessionRecord } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { paceToSeconds } from './paceUtils';

export interface RacePrediction {
  totalSeconds: number;
  pacePerFiveHundred: number;
  isActual: boolean;
  sourceLabel: string;
  sourcePace: string;
  sourceRpe?: number;
  sourceDragFactor?: number;
}

export interface Predictions {
  twoK: RacePrediction | null;
  fiveK: RacePrediction | null;
}

export function parseDistance(label: string): number | null {
  const intervalMatch = label.match(/(\d+)\s*x\s*(\d+)m/i);
  if (intervalMatch) {
    return parseInt(intervalMatch[1], 10) * parseInt(intervalMatch[2], 10);
  }
  const distMatch = label.match(/^(\d+)m$/i);
  if (distMatch) {
    return parseInt(distMatch[1], 10);
  }
  return null;
}

function parseTime(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

export function predictTime(
  knownTimeSeconds: number,
  knownDistanceMeters: number,
  targetDistanceMeters: number
): number {
  if (knownDistanceMeters === targetDistanceMeters) return knownTimeSeconds;
  return knownTimeSeconds * Math.pow(targetDistanceMeters / knownDistanceMeters, 1.06);
}

export function computePredictions(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): Predictions {
  let best2k: RacePrediction | null = null;
  let best5k: RacePrediction | null = null;

  for (const desc of plan) {
    const key = `${desc.weekNumber}-${desc.dayNumber}`;
    const record = sessions[key];
    if (!record?.completed || !record.pace) continue;

    const paceSeconds = paceToSeconds(record.pace);
    if (paceSeconds === null) continue;

    let distance = parseDistance(desc.label);

    if (distance === null) {
      const totalTimeSec = record.totalTime ? parseTime(record.totalTime) : null;
      if (totalTimeSec && totalTimeSec > 0) {
        distance = Math.round((totalTimeSec / paceSeconds) * 500);
      } else {
        continue;
      }
    }

    if (distance <= 0) continue;

    let totalTimeSec: number;
    const parsedTotalTime = record.totalTime ? parseTime(record.totalTime) : null;
    if (parsedTotalTime && parsedTotalTime > 0) {
      totalTimeSec = parsedTotalTime;
    } else {
      totalTimeSec = paceSeconds * (distance / 500);
    }

    const predicted2k = predictTime(totalTimeSec, distance, 2000);
    const pace2k = predicted2k / (2000 / 500);
    if (best2k === null || predicted2k < best2k.totalSeconds) {
      best2k = {
        totalSeconds: predicted2k,
        pacePerFiveHundred: pace2k,
        isActual: distance === 2000,
        sourceLabel: desc.label,
        sourcePace: record.pace,
        sourceRpe: record.rpe,
        sourceDragFactor: record.dragFactor,
      };
    }

    const predicted5k = predictTime(totalTimeSec, distance, 5000);
    const pace5k = predicted5k / (5000 / 500);
    if (best5k === null || predicted5k < best5k.totalSeconds) {
      best5k = {
        totalSeconds: predicted5k,
        pacePerFiveHundred: pace5k,
        isActual: distance === 5000,
        sourceLabel: desc.label,
        sourcePace: record.pace,
        sourceRpe: record.rpe,
        sourceDragFactor: record.dragFactor,
      };
    }
  }

  return { twoK: best2k, fiveK: best5k };
}

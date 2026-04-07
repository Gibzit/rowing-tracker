import { describe, it, expect } from 'vitest';
import { computeWeeklyVolume } from '../volumeCalc';
import type { SessionRecord } from '../storage';
import type { SessionDescriptor } from '../../data/trainingPlan';

function makeDesc(week: number, day: number, label: string): SessionDescriptor {
  return { weekNumber: week, dayNumber: day, label, description: '', isOptional: false };
}

function makeRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    completed: true,
    pace: '',
    totalTime: '',
    intervalTimes: [],
    notes: '',
    ...overrides,
  };
}

describe('computeWeeklyVolume', () => {
  it('returns empty array when no sessions completed', () => {
    const plan = [makeDesc(1, 1, '5000m')];
    const sessions = { '1-1': makeRecord({ completed: false }) };
    expect(computeWeeklyVolume(sessions, plan)).toEqual([]);
  });

  it('computes meters from a simple distance label', () => {
    const plan = [makeDesc(1, 1, '5000m')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '2:00', totalTime: '20:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result).toHaveLength(1);
    expect(result[0].weekNumber).toBe(1);
    expect(result[0].totalMeters).toBe(5000);
  });

  it('computes meters from an interval label', () => {
    const plan = [makeDesc(1, 1, '6 x 500m / 2min rest')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '1:55', totalTime: '18:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMeters).toBe(3000);
  });

  it('estimates meters from pace and time for time-based sessions', () => {
    const plan = [makeDesc(1, 1, '20min')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '2:00', totalTime: '20:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMeters).toBe(5000);
  });

  it('contributes 0 meters when no distance or pace available', () => {
    const plan = [makeDesc(1, 1, '20min')];
    const sessions = { '1-1': makeRecord({ completed: true, totalTime: '20:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMeters).toBe(0);
    expect(result[0].totalMinutes).toBeCloseTo(20);
  });

  it('computes totalMinutes from totalTime', () => {
    const plan = [makeDesc(1, 1, '5000m')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '2:00', totalTime: '20:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMinutes).toBeCloseTo(20);
  });

  it('contributes 0 minutes when totalTime is empty', () => {
    const plan = [makeDesc(1, 1, '5000m')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '2:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMeters).toBe(5000);
    expect(result[0].totalMinutes).toBe(0);
  });

  it('aggregates multiple sessions in the same week', () => {
    const plan = [makeDesc(1, 1, '5000m'), makeDesc(1, 2, '3000m')];
    const sessions = {
      '1-1': makeRecord({ completed: true, pace: '2:00', totalTime: '20:00' }),
      '1-2': makeRecord({ completed: true, pace: '1:50', totalTime: '11:00' }),
    };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result).toHaveLength(1);
    expect(result[0].totalMeters).toBe(8000);
    expect(result[0].totalMinutes).toBeCloseTo(31);
  });

  it('returns weeks sorted by weekNumber', () => {
    const plan = [makeDesc(3, 1, '5000m'), makeDesc(1, 1, '3000m')];
    const sessions = {
      '3-1': makeRecord({ completed: true, pace: '2:00', totalTime: '20:00' }),
      '1-1': makeRecord({ completed: true, pace: '1:50', totalTime: '11:00' }),
    };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].weekNumber).toBe(1);
    expect(result[1].weekNumber).toBe(3);
  });

  it('handles 3-digit minute totalTime (e.g., 120:00)', () => {
    const plan = [makeDesc(1, 1, '5000m')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '2:00', totalTime: '120:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMinutes).toBeCloseTo(120);
  });
});

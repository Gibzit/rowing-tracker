import { describe, it, expect } from 'vitest';
import { computePersonalBests, isNewPB } from '../personalBests';
import type { SessionRecord } from '../storage';
import type { SessionDescriptor } from '../../data/trainingPlan';

const makeDesc = (overrides: Partial<SessionDescriptor> = {}): SessionDescriptor => ({
  weekNumber: 1,
  dayNumber: 1,
  label: '5000m',
  description: '',
  isOptional: false,
  ...overrides,
});

const makeSession = (overrides: Partial<SessionRecord> = {}): SessionRecord => ({
  completed: true,
  pace: '',
  totalTime: '',
  intervalTimes: [],
  notes: '',
  ...overrides,
});

describe('computePersonalBests', () => {
  it('returns empty array when no sessions have pace', () => {
    const plan = [makeDesc({ weekNumber: 1, dayNumber: 1 })];
    const sessions = { '1-1': makeSession({ pace: '' }) };
    expect(computePersonalBests(sessions, plan)).toEqual([]);
  });

  it('returns empty array with empty sessions', () => {
    const plan = [makeDesc()];
    expect(computePersonalBests({}, plan)).toEqual([]);
  });

  it('returns empty array with empty plan', () => {
    const sessions = { '1-1': makeSession({ pace: '2:00' }) };
    expect(computePersonalBests(sessions, [])).toEqual([]);
  });

  it('finds best pace per category', () => {
    const plan = [
      makeDesc({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 2, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 1, dayNumber: 2, label: '6 x 500m / 2min rest' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:10' }),
      '2-1': makeSession({ pace: '2:05' }), // better distance pace
      '1-2': makeSession({ pace: '1:55' }),
    };
    const result = computePersonalBests(sessions, plan);

    // Should have distance and interval categories
    expect(result).toHaveLength(2);

    const distance = result.find((pb) => pb.category === 'distance')!;
    expect(distance.paceFormatted).toBe('2:05');
    expect(distance.weekNumber).toBe(2);
    expect(distance.sessionCount).toBe(2);

    const interval = result.find((pb) => pb.category === 'interval')!;
    expect(interval.paceFormatted).toBe('1:55');
    expect(interval.sessionCount).toBe(1);
  });

  it('returns results sorted: distance, interval, time', () => {
    const plan = [
      makeDesc({ weekNumber: 1, dayNumber: 1, label: '6 x 500m / 2min rest' }),
      makeDesc({ weekNumber: 1, dayNumber: 2, label: '20min' }),
      makeDesc({ weekNumber: 1, dayNumber: 3, label: '5000m' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '1:55' }),
      '1-2': makeSession({ pace: '2:10' }),
      '1-3': makeSession({ pace: '2:00' }),
    };
    const result = computePersonalBests(sessions, plan);
    expect(result.map((pb) => pb.category)).toEqual(['distance', 'interval', 'time']);
  });

  it('computes average pace and improvement percentage', () => {
    const plan = [
      makeDesc({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 2, dayNumber: 1, label: '5000m' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:10' }), // 130s
      '2-1': makeSession({ pace: '2:00' }), // 120s — PB
    };
    const result = computePersonalBests(sessions, plan);
    const pb = result[0];
    expect(pb.paceSeconds).toBe(120);
    expect(pb.avgPaceSeconds).toBe(125); // (130 + 120) / 2
    expect(pb.improvementPct).toBeLessThan(0); // PB is faster than average
  });

  it('skips sessions with invalid pace', () => {
    const plan = [
      makeDesc({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 1, dayNumber: 2, label: '5000m' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:00' }),
      '1-2': makeSession({ pace: 'bad' }),
    };
    const result = computePersonalBests(sessions, plan);
    expect(result).toHaveLength(1);
    expect(result[0].sessionCount).toBe(1);
  });
});

describe('isNewPB', () => {
  const existingBests = computePersonalBests(
    { '1-1': makeSession({ pace: '2:00' }) },
    [makeDesc({ weekNumber: 1, dayNumber: 1, label: '5000m' })]
  );

  it('returns true when pace is faster than current PB', () => {
    expect(isNewPB('5000m', 115, existingBests)).toBe(true);
  });

  it('returns false when pace is slower than current PB', () => {
    expect(isNewPB('5000m', 125, existingBests)).toBe(false);
  });

  it('returns false when pace equals current PB', () => {
    expect(isNewPB('5000m', 120, existingBests)).toBe(false);
  });

  it('returns true when no existing PB for the category', () => {
    expect(isNewPB('6 x 500m / 2min rest', 100, existingBests)).toBe(true);
  });
});

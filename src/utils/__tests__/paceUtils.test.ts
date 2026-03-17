import { describe, it, expect } from 'vitest';
import {
  paceToSeconds,
  secondsToPace,
  categorizeWorkout,
  extractPaceData,
} from '../paceUtils';
import type { SessionRecord } from '../storage';
import type { SessionDescriptor } from '../../data/trainingPlan';

describe('paceToSeconds', () => {
  it('converts "2:00" to 120', () => {
    expect(paceToSeconds('2:00')).toBe(120);
  });

  it('converts "1:45" to 105', () => {
    expect(paceToSeconds('1:45')).toBe(105);
  });

  it('converts "0:30" to 30', () => {
    expect(paceToSeconds('0:30')).toBe(30);
  });

  it('converts "10:00" to 600', () => {
    expect(paceToSeconds('10:00')).toBe(600);
  });

  it('returns null for empty string', () => {
    expect(paceToSeconds('')).toBeNull();
  });

  it('returns null for "abc"', () => {
    expect(paceToSeconds('abc')).toBeNull();
  });

  it('returns null for "2:60" (invalid seconds >= 60)', () => {
    expect(paceToSeconds('2:60')).toBeNull();
  });

  it('returns null for "2:99" (invalid seconds)', () => {
    expect(paceToSeconds('2:99')).toBeNull();
  });

  it('returns null for partial input like "2:"', () => {
    expect(paceToSeconds('2:')).toBeNull();
  });

  it('returns null for ":30" (missing minutes)', () => {
    expect(paceToSeconds(':30')).toBeNull();
  });

  it('returns null for "2:5" (single digit seconds)', () => {
    expect(paceToSeconds('2:5')).toBeNull();
  });

  it('trims whitespace before parsing', () => {
    expect(paceToSeconds('  2:00  ')).toBe(120);
  });

  it('returns null for negative-looking input "-1:30"', () => {
    expect(paceToSeconds('-1:30')).toBeNull();
  });
});

describe('secondsToPace', () => {
  it('converts 120 to "2:00"', () => {
    expect(secondsToPace(120)).toBe('2:00');
  });

  it('converts 90 to "1:30"', () => {
    expect(secondsToPace(90)).toBe('1:30');
  });

  it('converts 0 to "0:00"', () => {
    expect(secondsToPace(0)).toBe('0:00');
  });

  it('converts 61 to "1:01"', () => {
    expect(secondsToPace(61)).toBe('1:01');
  });

  it('converts 59 to "0:59"', () => {
    expect(secondsToPace(59)).toBe('0:59');
  });

  it('converts 600 to "10:00"', () => {
    expect(secondsToPace(600)).toBe('10:00');
  });

  it('rounds fractional seconds correctly', () => {
    expect(secondsToPace(90.4)).toBe('1:30');
    expect(secondsToPace(90.6)).toBe('1:31');
  });
});

describe('categorizeWorkout', () => {
  it('categorizes "5000m" as distance', () => {
    expect(categorizeWorkout('5000m')).toBe('distance');
  });

  it('categorizes "6 x 500m / 2min rest" as interval', () => {
    expect(categorizeWorkout('6 x 500m / 2min rest')).toBe('interval');
  });

  it('categorizes "4 x 750m / 2min rest" as interval', () => {
    expect(categorizeWorkout('4 x 750m / 2min rest')).toBe('interval');
  });

  it('categorizes "20min" as time', () => {
    expect(categorizeWorkout('20min')).toBe('time');
  });

  it('categorizes "25min" as time', () => {
    expect(categorizeWorkout('25min')).toBe('time');
  });

  it('categorizes "30min" as time', () => {
    expect(categorizeWorkout('30min')).toBe('time');
  });

  it('categorizes "10000m" as distance', () => {
    expect(categorizeWorkout('10000m')).toBe('distance');
  });

  it('categorizes "2 x 10min / 2min rest" as interval (has NxN pattern)', () => {
    expect(categorizeWorkout('2 x 10min / 2min rest')).toBe('interval');
  });

  it('categorizes "8 x 500m / 2min rest" as interval', () => {
    expect(categorizeWorkout('8 x 500m / 2min rest')).toBe('interval');
  });

  it('categorizes plain text label as distance (fallback)', () => {
    expect(categorizeWorkout('Steady row')).toBe('distance');
  });
});

describe('extractPaceData', () => {
  const makePlan = (entries: Partial<SessionDescriptor>[]): SessionDescriptor[] =>
    entries.map((e, i) => ({
      weekNumber: e.weekNumber ?? 1,
      dayNumber: e.dayNumber ?? i + 1,
      label: e.label ?? '5000m',
      description: e.description ?? '',
      isOptional: e.isOptional ?? false,
    }));

  const makeSession = (overrides: Partial<SessionRecord> = {}): SessionRecord => ({
    completed: true,
    pace: '',
    totalTime: '',
    intervalTimes: [],
    notes: '',
    ...overrides,
  });

  it('returns empty array when no sessions have pace', () => {
    const plan = makePlan([{ weekNumber: 1, dayNumber: 1 }]);
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true, pace: '' }),
    };
    expect(extractPaceData(sessions, plan)).toEqual([]);
  });

  it('returns empty array when sessions record is empty', () => {
    const plan = makePlan([{ weekNumber: 1, dayNumber: 1 }]);
    expect(extractPaceData({}, plan)).toEqual([]);
  });

  it('extracts pace data for sessions with valid pace', () => {
    const plan = makePlan([
      { weekNumber: 1, dayNumber: 1, label: '5000m' },
      { weekNumber: 1, dayNumber: 2, label: '6 x 500m / 2min rest' },
    ]);
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:05' }),
      '1-2': makeSession({ pace: '1:55' }),
    };
    const result = extractPaceData(sessions, plan);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      weekNumber: 1,
      dayNumber: 1,
      label: '5000m',
      paceSeconds: 125,
      category: 'distance',
    });
    expect(result[1]).toEqual({
      weekNumber: 1,
      dayNumber: 2,
      label: '6 x 500m / 2min rest',
      paceSeconds: 115,
      category: 'interval',
    });
  });

  it('skips sessions with invalid pace strings', () => {
    const plan = makePlan([
      { weekNumber: 1, dayNumber: 1, label: '5000m' },
      { weekNumber: 1, dayNumber: 2, label: '5000m' },
    ]);
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:00' }),
      '1-2': makeSession({ pace: 'abc' }),
    };
    const result = extractPaceData(sessions, plan);
    expect(result).toHaveLength(1);
    expect(result[0].paceSeconds).toBe(120);
  });

  it('skips plan entries that have no corresponding session record', () => {
    const plan = makePlan([
      { weekNumber: 1, dayNumber: 1, label: '5000m' },
      { weekNumber: 1, dayNumber: 2, label: '5000m' },
    ]);
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:00' }),
    };
    const result = extractPaceData(sessions, plan);
    expect(result).toHaveLength(1);
  });
});

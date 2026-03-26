import { describe, it, expect } from 'vitest';
import { normalizeLabel, groupWorkouts } from '../workoutGrouping';
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

describe('normalizeLabel', () => {
  it('lowercases and strips whitespace', () => {
    expect(normalizeLabel('5000m')).toBe('5000m');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeLabel('6 x 500m / 2min rest')).toBe('6x500m/2minrest');
  });

  it('handles mixed case', () => {
    expect(normalizeLabel('Steady Row')).toBe('steadyrow');
  });
});

describe('groupWorkouts', () => {
  it('returns empty array when no sessions have pace', () => {
    const plan = [makeDesc()];
    expect(groupWorkouts({}, plan)).toEqual([]);
  });

  it('returns empty array when groups have fewer than 2 entries', () => {
    const plan = [makeDesc({ weekNumber: 1, dayNumber: 1, label: '5000m' })];
    const sessions = { '1-1': makeSession({ pace: '2:00' }) };
    // Only 1 entry for '5000m' — needs >= 2 to appear
    expect(groupWorkouts(sessions, plan)).toEqual([]);
  });

  it('groups sessions with the same label', () => {
    const plan = [
      makeDesc({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 2, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 3, dayNumber: 1, label: '5000m' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:10' }),
      '2-1': makeSession({ pace: '2:05' }),
      '3-1': makeSession({ pace: '2:00' }),
    };
    const result = groupWorkouts(sessions, plan);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('5000m');
    expect(result[0].entries).toHaveLength(3);
    expect(result[0].bestPaceSeconds).toBe(120); // 2:00
  });

  it('computes bestPaceSeconds correctly', () => {
    const plan = [
      makeDesc({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 2, dayNumber: 1, label: '5000m' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:10' }), // 130s
      '2-1': makeSession({ pace: '1:55' }), // 115s
    };
    const result = groupWorkouts(sessions, plan);
    expect(result[0].bestPaceSeconds).toBe(115);
  });

  it('skips sessions with invalid pace', () => {
    const plan = [
      makeDesc({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 2, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 3, dayNumber: 1, label: '5000m' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:00' }),
      '2-1': makeSession({ pace: 'bad' }),
      '3-1': makeSession({ pace: '2:05' }),
    };
    const result = groupWorkouts(sessions, plan);
    expect(result).toHaveLength(1);
    expect(result[0].entries).toHaveLength(2);
  });

  it('sorts groups alphabetically by label', () => {
    const plan = [
      makeDesc({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 2, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 1, dayNumber: 2, label: '10000m' }),
      makeDesc({ weekNumber: 2, dayNumber: 2, label: '10000m' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:00' }),
      '2-1': makeSession({ pace: '2:05' }),
      '1-2': makeSession({ pace: '2:10' }),
      '2-2': makeSession({ pace: '2:15' }),
    };
    const result = groupWorkouts(sessions, plan);
    expect(result[0].label).toBe('10000m');
    expect(result[1].label).toBe('5000m');
  });

  it('entries include formatted pace', () => {
    const plan = [
      makeDesc({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makeDesc({ weekNumber: 2, dayNumber: 1, label: '5000m' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ pace: '2:00' }),
      '2-1': makeSession({ pace: '2:05' }),
    };
    const result = groupWorkouts(sessions, plan);
    expect(result[0].entries[0].paceFormatted).toBe('2:00');
    expect(result[0].entries[1].paceFormatted).toBe('2:05');
  });
});

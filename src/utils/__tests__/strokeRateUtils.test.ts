import { describe, it, expect } from 'vitest';
import { extractStrokeRateData } from '../strokeRateUtils';
import type { SessionRecord } from '../storage';
import type { SessionDescriptor } from '../../data/trainingPlan';

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    completed: false,
    pace: '',
    totalTime: '',
    intervalTimes: [],
    notes: '',
    ...overrides,
  };
}

function makePlanEntry(overrides: Partial<SessionDescriptor> = {}): SessionDescriptor {
  return {
    weekNumber: 1,
    dayNumber: 1,
    label: '5000m',
    description: '',
    isOptional: false,
    ...overrides,
  };
}

describe('extractStrokeRateData', () => {
  it('returns empty array when sessions is empty', () => {
    const plan = [makePlanEntry({ weekNumber: 1, dayNumber: 1 })];
    expect(extractStrokeRateData({}, plan)).toEqual([]);
  });

  it('returns empty array when plan is empty', () => {
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true, strokeRate: 24 }),
    };
    expect(extractStrokeRateData(sessions, [])).toEqual([]);
  });

  it('extracts stroke rate data for completed sessions with strokeRate', () => {
    const plan = [
      makePlanEntry({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makePlanEntry({ weekNumber: 1, dayNumber: 2, label: '6 x 500m / 2min rest' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true, strokeRate: 22 }),
      '1-2': makeSession({ completed: true, strokeRate: 26 }),
    };
    const result = extractStrokeRateData(sessions, plan);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      weekNumber: 1,
      dayNumber: 1,
      label: '5000m',
      strokeRate: 22,
      category: 'distance',
    });
    expect(result[1]).toEqual({
      weekNumber: 1,
      dayNumber: 2,
      label: '6 x 500m / 2min rest',
      strokeRate: 26,
      category: 'interval',
    });
  });

  it('filters out sessions without strokeRate', () => {
    const plan = [
      makePlanEntry({ weekNumber: 1, dayNumber: 1 }),
      makePlanEntry({ weekNumber: 1, dayNumber: 2 }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true, strokeRate: 24 }),
      '1-2': makeSession({ completed: true }),
    };
    const result = extractStrokeRateData(sessions, plan);
    expect(result).toHaveLength(1);
    expect(result[0].strokeRate).toBe(24);
  });

  it('filters out uncompleted sessions even if they have strokeRate', () => {
    const plan = [
      makePlanEntry({ weekNumber: 1, dayNumber: 1 }),
      makePlanEntry({ weekNumber: 1, dayNumber: 2 }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true, strokeRate: 22 }),
      '1-2': makeSession({ completed: false, strokeRate: 26 }),
    };
    const result = extractStrokeRateData(sessions, plan);
    expect(result).toHaveLength(1);
    expect(result[0].strokeRate).toBe(22);
  });

  it('filters out sessions with strokeRate of 0', () => {
    const plan = [makePlanEntry({ weekNumber: 1, dayNumber: 1 })];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true, strokeRate: 0 }),
    };
    const result = extractStrokeRateData(sessions, plan);
    expect(result).toHaveLength(0);
  });

  it('correctly categorizes different workout types', () => {
    const plan = [
      makePlanEntry({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makePlanEntry({ weekNumber: 1, dayNumber: 2, label: '8 x 500m / 2min rest' }),
      makePlanEntry({ weekNumber: 1, dayNumber: 3, label: '20min' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true, strokeRate: 22 }),
      '1-2': makeSession({ completed: true, strokeRate: 28 }),
      '1-3': makeSession({ completed: true, strokeRate: 20 }),
    };
    const result = extractStrokeRateData(sessions, plan);
    expect(result[0].category).toBe('distance');
    expect(result[1].category).toBe('interval');
    expect(result[2].category).toBe('time');
  });

  it('skips plan entries with no corresponding session record', () => {
    const plan = [
      makePlanEntry({ weekNumber: 1, dayNumber: 1 }),
      makePlanEntry({ weekNumber: 1, dayNumber: 2 }),
      makePlanEntry({ weekNumber: 1, dayNumber: 3 }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true, strokeRate: 22 }),
      // 1-2 and 1-3 missing
    };
    const result = extractStrokeRateData(sessions, plan);
    expect(result).toHaveLength(1);
  });

  it('handles sessions across multiple weeks', () => {
    const plan = [
      makePlanEntry({ weekNumber: 1, dayNumber: 1, label: '5000m' }),
      makePlanEntry({ weekNumber: 2, dayNumber: 1, label: '5500m' }),
      makePlanEntry({ weekNumber: 3, dayNumber: 1, label: '6000m' }),
    ];
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true, strokeRate: 24 }),
      '2-1': makeSession({ completed: true, strokeRate: 23 }),
      '3-1': makeSession({ completed: true, strokeRate: 22 }),
    };
    const result = extractStrokeRateData(sessions, plan);
    expect(result).toHaveLength(3);
    expect(result[0].weekNumber).toBe(1);
    expect(result[1].weekNumber).toBe(2);
    expect(result[2].weekNumber).toBe(3);
  });
});

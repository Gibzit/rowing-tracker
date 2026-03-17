import { describe, it, expect } from 'vitest';
import { computeStreaks } from '../streakUtils';
import type { SessionRecord } from '../storage';

function makeSession(completedDate: string): SessionRecord {
  return {
    completed: true,
    pace: '',
    totalTime: '',
    intervalTimes: [],
    notes: '',
    completedDate,
  };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

describe('computeStreaks', () => {
  it('returns { currentStreak: 0, longestStreak: 0 } for empty sessions', () => {
    expect(computeStreaks({})).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('returns { currentStreak: 0, longestStreak: 0 } for sessions without completedDate', () => {
    const sessions: Record<string, SessionRecord> = {
      '1-1': {
        completed: true,
        pace: '2:00',
        totalTime: '',
        intervalTimes: [],
        notes: '',
      },
    };
    expect(computeStreaks(sessions)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('returns { currentStreak: 0, longestStreak: 0 } for sessions not marked completed', () => {
    const sessions: Record<string, SessionRecord> = {
      '1-1': {
        completed: false,
        pace: '',
        totalTime: '',
        intervalTimes: [],
        notes: '',
        completedDate: daysAgo(0),
      },
    };
    expect(computeStreaks(sessions)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('returns streak of 1 for a single session today', () => {
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession(daysAgo(0)),
    };
    const result = computeStreaks(sessions);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('counts consecutive days correctly', () => {
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession(daysAgo(0)),
      '1-2': makeSession(daysAgo(1)),
      '1-3': makeSession(daysAgo(2)),
    };
    const result = computeStreaks(sessions);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('handles rest day tolerance (4 rest days in 7 day window allowed)', () => {
    // Active on days 0, 1, 2, 4, 5, 6 (skip day 3).
    // Day 3 (rest): 7-day window [3, 2, 1, 0, -1, -2, -3]
    //   active: 2, 1, 0 => 3 active, 4 rest days <= 4 => OK, streak continues.
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession(daysAgo(0)),
      '1-2': makeSession(daysAgo(1)),
      '1-3': makeSession(daysAgo(2)),
      '2-1': makeSession(daysAgo(4)),
      '2-2': makeSession(daysAgo(5)),
      '2-3': makeSession(daysAgo(6)),
    };
    const result = computeStreaks(sessions);
    expect(result.currentStreak).toBe(7);
  });

  it('breaks streak when too many rest days in a 7-day window (> 4)', () => {
    // Active today, then nothing for 5 days, then active 6 days ago
    // The 7-day window ending on day 1 (rest) would have rest days: 1,2,3,4,5 = 5 rest days > 4
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession(daysAgo(0)),
      '1-2': makeSession(daysAgo(6)),
    };
    const result = computeStreaks(sessions);
    // The streak should break because there are 5 consecutive rest days between the two activities
    expect(result.currentStreak).toBeLessThan(7);
  });

  it('longestStreak can differ from currentStreak', () => {
    // Old streak of 3 consecutive days, then a long gap, then 1 day today
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession(daysAgo(0)),
      '2-1': makeSession(daysAgo(30)),
      '2-2': makeSession(daysAgo(31)),
      '2-3': makeSession(daysAgo(32)),
    };
    const result = computeStreaks(sessions);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBeGreaterThanOrEqual(3);
  });

  it('handles multiple sessions on the same date', () => {
    const today = daysAgo(0);
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession(today),
      '1-2': makeSession(today),
      '1-3': makeSession(daysAgo(1)),
    };
    const result = computeStreaks(sessions);
    expect(result.currentStreak).toBe(2);
  });
});

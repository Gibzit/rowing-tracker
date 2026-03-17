import { describe, it, expect } from 'vitest';
import { checkAchievements } from '../achievements';
import type { StoredData, SessionRecord } from '../storage';
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

function makeStoredData(sessions: Record<string, SessionRecord> = {}): StoredData {
  return {
    version: 1,
    sessions,
    optionalVisible: {},
    customSessions: {},
    extraWeeks: [],
  };
}

function makePlanWeek(
  weekNumber: number,
  coreCount: number,
  optionalCount: number
): SessionDescriptor[] {
  const descs: SessionDescriptor[] = [];
  for (let d = 1; d <= coreCount; d++) {
    descs.push({
      weekNumber,
      dayNumber: d,
      label: d === 2 ? '6 x 500m / 2min rest' : '5000m',
      description: `Core session ${d}`,
      isOptional: false,
    });
  }
  for (let d = coreCount + 1; d <= coreCount + optionalCount; d++) {
    descs.push({
      weekNumber,
      dayNumber: d,
      label: '20min',
      description: `Optional session ${d}`,
      isOptional: true,
    });
  }
  return descs;
}

const noStreak = { currentStreak: 0, longestStreak: 0 };

describe('checkAchievements', () => {
  it('returns empty array when no sessions exist', () => {
    const data = makeStoredData();
    const plan = makePlanWeek(1, 3, 2);
    expect(checkAchievements(data, plan, noStreak)).toEqual([]);
  });

  it('includes "first-stroke" when one session is completed', () => {
    const data = makeStoredData({
      '1-1': makeSession({ completed: true }),
    });
    const plan = makePlanWeek(1, 3, 2);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).toContain('first-stroke');
  });

  it('includes "speed-demon" when a pace under 2:00 is logged', () => {
    const data = makeStoredData({
      '1-1': makeSession({ completed: true, pace: '1:55' }),
    });
    const plan = makePlanWeek(1, 3, 2);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).toContain('speed-demon');
  });

  it('does not include "speed-demon" when pace is exactly 2:00', () => {
    const data = makeStoredData({
      '1-1': makeSession({ completed: true, pace: '2:00' }),
    });
    const plan = makePlanWeek(1, 3, 2);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).not.toContain('speed-demon');
  });

  it('does not include "speed-demon" when pace is above 2:00', () => {
    const data = makeStoredData({
      '1-1': makeSession({ completed: true, pace: '2:10' }),
    });
    const plan = makePlanWeek(1, 3, 2);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).not.toContain('speed-demon');
  });

  it('includes "data-nerd" when 20+ sessions have valid pace', () => {
    const sessions: Record<string, SessionRecord> = {};
    const plan: SessionDescriptor[] = [];
    for (let i = 1; i <= 21; i++) {
      sessions[`1-${i}`] = makeSession({ completed: true, pace: '2:05' });
      plan.push({
        weekNumber: 1,
        dayNumber: i,
        label: '5000m',
        description: '',
        isOptional: false,
      });
    }
    const data = makeStoredData(sessions);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).toContain('data-nerd');
  });

  it('does not include "data-nerd" when fewer than 20 sessions have pace', () => {
    const sessions: Record<string, SessionRecord> = {};
    const plan: SessionDescriptor[] = [];
    for (let i = 1; i <= 19; i++) {
      sessions[`1-${i}`] = makeSession({ completed: true, pace: '2:05' });
      plan.push({
        weekNumber: 1,
        dayNumber: i,
        label: '5000m',
        description: '',
        isOptional: false,
      });
    }
    const data = makeStoredData(sessions);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).not.toContain('data-nerd');
  });

  it('includes "week-warrior" when all core sessions in a week are completed', () => {
    const plan = makePlanWeek(1, 3, 2);
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true }),
      '1-2': makeSession({ completed: true }),
      '1-3': makeSession({ completed: true }),
    };
    const data = makeStoredData(sessions);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).toContain('week-warrior');
  });

  it('does not include "week-warrior" when not all core sessions are done', () => {
    const plan = makePlanWeek(1, 3, 2);
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true }),
      '1-2': makeSession({ completed: true }),
      // 1-3 not completed
    };
    const data = makeStoredData(sessions);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).not.toContain('week-warrior');
  });

  it('includes "consistency-king" when longestStreak >= 7', () => {
    const data = makeStoredData({
      '1-1': makeSession({ completed: true }),
    });
    const plan = makePlanWeek(1, 3, 2);
    const streak = { currentStreak: 7, longestStreak: 7 };
    const result = checkAchievements(data, plan, streak);
    expect(result).toContain('consistency-king');
  });

  it('does not include "consistency-king" when longestStreak < 7', () => {
    const data = makeStoredData({
      '1-1': makeSession({ completed: true }),
    });
    const plan = makePlanWeek(1, 3, 2);
    const streak = { currentStreak: 6, longestStreak: 6 };
    const result = checkAchievements(data, plan, streak);
    expect(result).not.toContain('consistency-king');
  });

  it('includes "streak-master" when longestStreak >= 30', () => {
    const data = makeStoredData({
      '1-1': makeSession({ completed: true }),
    });
    const plan = makePlanWeek(1, 3, 2);
    const streak = { currentStreak: 30, longestStreak: 30 };
    const result = checkAchievements(data, plan, streak);
    expect(result).toContain('streak-master');
    expect(result).toContain('consistency-king');
  });

  it('includes "halfway-hero" when 36 core sessions are complete', () => {
    const sessions: Record<string, SessionRecord> = {};
    const plan: SessionDescriptor[] = [];
    for (let w = 1; w <= 12; w++) {
      for (let d = 1; d <= 3; d++) {
        sessions[`${w}-${d}`] = makeSession({ completed: true });
        plan.push({
          weekNumber: w,
          dayNumber: d,
          label: '5000m',
          description: '',
          isOptional: false,
        });
      }
    }
    const data = makeStoredData(sessions);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).toContain('halfway-hero');
  });

  it('includes "marathon-rower" when 72 core sessions are complete', () => {
    const sessions: Record<string, SessionRecord> = {};
    const plan: SessionDescriptor[] = [];
    for (let w = 1; w <= 24; w++) {
      for (let d = 1; d <= 3; d++) {
        sessions[`${w}-${d}`] = makeSession({ completed: true });
        plan.push({
          weekNumber: w,
          dayNumber: d,
          label: '5000m',
          description: '',
          isOptional: false,
        });
      }
    }
    const data = makeStoredData(sessions);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).toContain('marathon-rower');
    expect(result).toContain('halfway-hero');
  });

  it('includes "bonus-hunter" when 10 optional sessions are complete', () => {
    const sessions: Record<string, SessionRecord> = {};
    const plan: SessionDescriptor[] = [];
    for (let w = 1; w <= 5; w++) {
      for (let d = 1; d <= 3; d++) {
        plan.push({
          weekNumber: w,
          dayNumber: d,
          label: '5000m',
          description: '',
          isOptional: false,
        });
      }
      for (let d = 4; d <= 5; d++) {
        sessions[`${w}-${d}`] = makeSession({ completed: true });
        plan.push({
          weekNumber: w,
          dayNumber: d,
          label: '20min',
          description: '',
          isOptional: true,
        });
      }
    }
    const data = makeStoredData(sessions);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).toContain('bonus-hunter');
  });

  it('includes "perfect-week" when all 5 sessions in a week are complete', () => {
    const plan = makePlanWeek(1, 3, 2);
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true }),
      '1-2': makeSession({ completed: true }),
      '1-3': makeSession({ completed: true }),
      '1-4': makeSession({ completed: true }),
      '1-5': makeSession({ completed: true }),
    };
    const data = makeStoredData(sessions);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).toContain('perfect-week');
    expect(result).toContain('week-warrior');
  });

  it('does not include "perfect-week" when fewer than 5 sessions in a week are complete', () => {
    const plan = makePlanWeek(1, 3, 2);
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true }),
      '1-2': makeSession({ completed: true }),
      '1-3': makeSession({ completed: true }),
      '1-4': makeSession({ completed: true }),
      // 1-5 not completed
    };
    const data = makeStoredData(sessions);
    const result = checkAchievements(data, plan, noStreak);
    expect(result).not.toContain('perfect-week');
  });

  it('returns multiple achievements simultaneously', () => {
    const plan = makePlanWeek(1, 3, 2);
    const sessions: Record<string, SessionRecord> = {
      '1-1': makeSession({ completed: true, pace: '1:50' }),
      '1-2': makeSession({ completed: true }),
      '1-3': makeSession({ completed: true }),
    };
    const data = makeStoredData(sessions);
    const streak = { currentStreak: 7, longestStreak: 7 };
    const result = checkAchievements(data, plan, streak);
    expect(result).toContain('first-stroke');
    expect(result).toContain('speed-demon');
    expect(result).toContain('week-warrior');
    expect(result).toContain('consistency-king');
  });
});

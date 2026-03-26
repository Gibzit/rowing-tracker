import { describe, it, expect } from 'vitest';
import { getActivePlan, getCombinedPlan, getWeekSessions } from '../combinedPlan';
import type { StoredData, TrainingPlan } from '../storage';

const makePlan = (overrides: Partial<TrainingPlan> = {}): TrainingPlan => ({
  id: 'plan-1',
  name: 'Test Plan',
  description: 'A test plan',
  sessions: [
    { weekNumber: 1, dayNumber: 1, label: '5000m', description: 'row', isOptional: false },
    { weekNumber: 1, dayNumber: 2, label: '6 x 500m / 2min rest', description: '', isOptional: false },
    { weekNumber: 2, dayNumber: 1, label: '5000m', description: '', isOptional: false },
  ],
  history: [],
  createdAt: '2026-01-01',
  ...overrides,
});

const makeData = (overrides: Partial<StoredData> = {}): StoredData => ({
  version: 1,
  sessions: {},
  optionalVisible: {},
  onboardingComplete: true,
  customSessions: {},
  extraWeeks: [],
  restDays: [],
  ...overrides,
});

describe('getActivePlan', () => {
  it('returns undefined when no plans exist', () => {
    const data = makeData();
    expect(getActivePlan(data)).toBeUndefined();
  });

  it('returns undefined when plans exist but no activePlanId', () => {
    const plan = makePlan();
    const data = makeData({ plans: [plan] });
    expect(getActivePlan(data)).toBeUndefined();
  });

  it('returns the active plan when activePlanId matches', () => {
    const plan = makePlan({ id: 'plan-1' });
    const data = makeData({ plans: [plan], activePlanId: 'plan-1' });
    expect(getActivePlan(data)).toBe(plan);
  });

  it('returns undefined when activePlanId does not match any plan', () => {
    const plan = makePlan({ id: 'plan-1' });
    const data = makeData({ plans: [plan], activePlanId: 'non-existent' });
    expect(getActivePlan(data)).toBeUndefined();
  });
});

describe('getCombinedPlan', () => {
  it('returns active plan sessions when plan system is active', () => {
    const plan = makePlan();
    const data = makeData({ plans: [plan], activePlanId: 'plan-1' });
    const result = getCombinedPlan(data);
    expect(result).toBe(plan.sessions);
    expect(result).toHaveLength(3);
  });

  it('falls back to TRAINING_PLAN when no plan system', () => {
    const data = makeData();
    const result = getCombinedPlan(data);
    // Should include the default TRAINING_PLAN entries
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].weekNumber).toBe(1);
    expect(result[0].dayNumber).toBe(1);
  });

  it('includes custom sessions and extra weeks in legacy mode', () => {
    const custom = { weekNumber: 1, dayNumber: 100, label: 'Custom', description: '', isOptional: false };
    const extra = { weekNumber: 25, dayNumber: 1, label: 'Extra', description: '', isOptional: false };
    const data = makeData({
      customSessions: { 1: [custom] },
      extraWeeks: [extra],
    });
    const result = getCombinedPlan(data);
    expect(result).toContainEqual(custom);
    expect(result).toContainEqual(extra);
  });
});

describe('getWeekSessions', () => {
  it('returns sessions for the given week from active plan', () => {
    const plan = makePlan();
    const data = makeData({ plans: [plan], activePlanId: 'plan-1' });
    const week1 = getWeekSessions(data, 1);
    expect(week1).toHaveLength(2);
    expect(week1.every((s) => s.weekNumber === 1)).toBe(true);

    const week2 = getWeekSessions(data, 2);
    expect(week2).toHaveLength(1);
    expect(week2[0].weekNumber).toBe(2);
  });

  it('returns empty array for non-existent week', () => {
    const plan = makePlan();
    const data = makeData({ plans: [plan], activePlanId: 'plan-1' });
    expect(getWeekSessions(data, 99)).toEqual([]);
  });

  it('falls back to legacy when no active plan', () => {
    const data = makeData();
    const week1 = getWeekSessions(data, 1);
    // Should return the default plan's week 1 sessions
    expect(week1.length).toBeGreaterThan(0);
    expect(week1.every((s) => s.weekNumber === 1)).toBe(true);
  });

  it('includes custom sessions in legacy mode', () => {
    const custom = { weekNumber: 1, dayNumber: 100, label: 'Custom', description: '', isOptional: false };
    const data = makeData({ customSessions: { 1: [custom] } });
    const week1 = getWeekSessions(data, 1);
    expect(week1).toContainEqual(custom);
  });
});

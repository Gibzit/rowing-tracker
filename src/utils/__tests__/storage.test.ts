import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptySession,
  createDefault,
  sessionKey,
  loadData,
  saveData,
} from '../storage';

describe('createEmptySession', () => {
  it('returns a session record with all default values', () => {
    const session = createEmptySession();
    expect(session).toEqual({
      completed: false,
      pace: '',
      totalTime: '',
      intervalTimes: [],
      notes: '',
    });
  });

  it('returns a new object each time (no shared references)', () => {
    const a = createEmptySession();
    const b = createEmptySession();
    expect(a).not.toBe(b);
    expect(a.intervalTimes).not.toBe(b.intervalTimes);
  });

  it('has completed set to false', () => {
    expect(createEmptySession().completed).toBe(false);
  });

  it('has empty string for pace', () => {
    expect(createEmptySession().pace).toBe('');
  });

  it('has empty array for intervalTimes', () => {
    expect(createEmptySession().intervalTimes).toEqual([]);
  });
});

describe('createDefault', () => {
  it('returns a StoredData object with correct shape', () => {
    const data = createDefault();
    expect(data).toEqual({
      version: 1,
      sessions: {},
      optionalVisible: {},
      customSessions: {},
      extraWeeks: [],
    });
  });

  it('has version set to 1', () => {
    expect(createDefault().version).toBe(1);
  });

  it('has empty sessions object', () => {
    expect(createDefault().sessions).toEqual({});
  });

  it('has empty extraWeeks array', () => {
    expect(createDefault().extraWeeks).toEqual([]);
  });

  it('returns a new object each time', () => {
    const a = createDefault();
    const b = createDefault();
    expect(a).not.toBe(b);
    expect(a.sessions).not.toBe(b.sessions);
  });
});

describe('sessionKey', () => {
  it('returns "1-2" for week 1, day 2', () => {
    expect(sessionKey(1, 2)).toBe('1-2');
  });

  it('returns "10-5" for week 10, day 5', () => {
    expect(sessionKey(10, 5)).toBe('10-5');
  });

  it('returns "24-3" for week 24, day 3', () => {
    expect(sessionKey(24, 3)).toBe('24-3');
  });
});

describe('loadData and saveData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default data when localStorage is empty', () => {
    const data = loadData();
    expect(data.version).toBe(1);
    expect(data.sessions).toEqual({});
    expect(data.optionalVisible).toEqual({});
    expect(data.customSessions).toEqual({});
    expect(data.extraWeeks).toEqual([]);
  });

  it('round-trips data through saveData and loadData', () => {
    const original = createDefault();
    original.sessions['1-1'] = {
      completed: true,
      pace: '2:05',
      totalTime: '25:30',
      intervalTimes: [],
      notes: 'Good session',
      strokeRate: 24,
      completedDate: '2025-01-15',
    };
    original.optionalVisible = { 1: true, 2: false };
    original.onboardingComplete = true;

    saveData(original);
    const loaded = loadData();

    expect(loaded.version).toBe(1);
    expect(loaded.sessions['1-1'].completed).toBe(true);
    expect(loaded.sessions['1-1'].pace).toBe('2:05');
    expect(loaded.sessions['1-1'].totalTime).toBe('25:30');
    expect(loaded.sessions['1-1'].notes).toBe('Good session');
    expect(loaded.sessions['1-1'].strokeRate).toBe(24);
    expect(loaded.sessions['1-1'].completedDate).toBe('2025-01-15');
    expect(loaded.optionalVisible).toEqual({ 1: true, 2: false });
    expect(loaded.onboardingComplete).toBe(true);
  });

  it('returns default data when localStorage contains invalid JSON', () => {
    localStorage.setItem('petePlanData', 'not-json!!!');
    const data = loadData();
    expect(data.version).toBe(1);
    expect(data.sessions).toEqual({});
  });

  it('returns default data when stored version is not 1', () => {
    localStorage.setItem('petePlanData', JSON.stringify({ version: 2, sessions: {} }));
    const data = loadData();
    expect(data.version).toBe(1);
    expect(data.sessions).toEqual({});
  });

  it('fills in missing customSessions field', () => {
    localStorage.setItem(
      'petePlanData',
      JSON.stringify({ version: 1, sessions: {}, optionalVisible: {} })
    );
    const data = loadData();
    expect(data.customSessions).toEqual({});
  });

  it('fills in missing extraWeeks field', () => {
    localStorage.setItem(
      'petePlanData',
      JSON.stringify({
        version: 1,
        sessions: {},
        optionalVisible: {},
        customSessions: {},
      })
    );
    const data = loadData();
    expect(data.extraWeeks).toEqual([]);
  });

  it('sets onboardingComplete to true if sessions exist but field is missing', () => {
    localStorage.setItem(
      'petePlanData',
      JSON.stringify({
        version: 1,
        sessions: { '1-1': { completed: true, pace: '', totalTime: '', intervalTimes: [], notes: '' } },
        optionalVisible: {},
        customSessions: {},
        extraWeeks: [],
      })
    );
    const data = loadData();
    expect(data.onboardingComplete).toBe(true);
  });

  it('fills in missing achievements field with empty array', () => {
    localStorage.setItem(
      'petePlanData',
      JSON.stringify({
        version: 1,
        sessions: {},
        optionalVisible: {},
        customSessions: {},
        extraWeeks: [],
      })
    );
    const data = loadData();
    expect(data.achievements).toEqual([]);
  });
});

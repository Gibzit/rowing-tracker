import { describe, it, expect } from 'vitest';
import { parseDistance, predictTime, computePredictions } from '../pacePredictor';

describe('parseDistance', () => {
  it('parses distance sessions', () => {
    expect(parseDistance('5000m')).toBe(5000);
    expect(parseDistance('10000m')).toBe(10000);
    expect(parseDistance('2000m')).toBe(2000);
  });

  it('parses interval sessions', () => {
    expect(parseDistance('6 x 500m / 2min rest')).toBe(3000);
    expect(parseDistance('4 x 1000m / 3min rest')).toBe(4000);
    expect(parseDistance('8 x 500m / 2min rest')).toBe(4000);
  });

  it('returns null for time-based sessions without pace/time', () => {
    expect(parseDistance('20min')).toBeNull();
    expect(parseDistance('30min')).toBeNull();
  });
});

describe('predictTime', () => {
  it('predicts 2k from 5k using Paul\'s Law', () => {
    const predicted = predictTime(1200, 5000, 2000);
    expect(predicted).toBeCloseTo(454.3, 0);
  });

  it('predicts 5k from 2k using Paul\'s Law', () => {
    const predicted = predictTime(420, 2000, 5000);
    expect(predicted).toBeCloseTo(1109.3, 0);
  });

  it('returns same time when distances match', () => {
    const predicted = predictTime(1200, 5000, 5000);
    expect(predicted).toBe(1200);
  });
});

describe('computePredictions', () => {
  it('returns null predictions when no sessions have pace data', () => {
    const result = computePredictions({}, []);
    expect(result.twoK).toBeNull();
    expect(result.fiveK).toBeNull();
  });

  it('marks actual when source distance matches target', () => {
    const sessions = {
      '1-1': {
        completed: true,
        pace: '2:00',
        totalTime: '20:00',
        intervalTimes: [],
        notes: '',
        completedDate: '2026-01-01',
      },
    };
    const plan = [
      { weekNumber: 1, dayNumber: 1, label: '5000m', description: '', isOptional: false },
    ];
    const result = computePredictions(sessions, plan);
    expect(result.fiveK).not.toBeNull();
    expect(result.fiveK!.isActual).toBe(true);
    expect(result.fiveK!.totalSeconds).toBeCloseTo(1200, 0);
  });

  it('computes predictions from a distance session', () => {
    const sessions = {
      '1-1': {
        completed: true,
        pace: '2:05',
        totalTime: '20:50',
        intervalTimes: [],
        notes: '',
        completedDate: '2026-01-01',
      },
    };
    const plan = [
      { weekNumber: 1, dayNumber: 1, label: '5000m', description: '', isOptional: false },
    ];
    const result = computePredictions(sessions, plan);
    expect(result.twoK).not.toBeNull();
    expect(result.twoK!.isActual).toBe(false);
    expect(result.twoK!.totalSeconds).toBeGreaterThan(0);
    expect(result.twoK!.pacePerFiveHundred).toBeGreaterThan(0);
    expect(result.twoK!.sourceLabel).toBe('5000m');
  });

  it('uses totalTime for intervals instead of pace × distance', () => {
    const sessions = {
      '1-1': {
        completed: true,
        pace: '1:55',
        totalTime: '12:30',
        intervalTimes: ['1:55', '1:54', '1:56', '1:55', '1:54', '1:56'],
        notes: '',
        completedDate: '2026-01-01',
      },
    };
    const plan = [
      { weekNumber: 1, dayNumber: 1, label: '6 x 500m / 2min rest', description: '', isOptional: false },
    ];
    const result = computePredictions(sessions, plan);
    expect(result.twoK).not.toBeNull();
    expect(result.twoK!.sourceLabel).toBe('6 x 500m / 2min rest');
  });
});

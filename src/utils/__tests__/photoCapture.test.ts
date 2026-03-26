import { describe, it, expect } from 'vitest';
import { parseExtractedData, buildPrompt } from '../photoCapture';
import type { SessionDescriptor } from '../../data/trainingPlan';

describe('parseExtractedData', () => {
  it('parses valid JSON with all fields', () => {
    const input = JSON.stringify({
      pace: '2:05',
      totalTime: '22:30',
      strokeRate: 24,
      intervalPaces: null,
    });
    const result = parseExtractedData(input);
    expect(result).toEqual({
      pace: '2:05',
      totalTime: '22:30',
      strokeRate: 24,
      intervalPaces: null,
    });
  });

  it('handles JSON wrapped in markdown code fences', () => {
    const input = '```json\n{"pace": "2:05", "totalTime": "22:30", "strokeRate": 24}\n```';
    const result = parseExtractedData(input);
    expect(result.pace).toBe('2:05');
    expect(result.totalTime).toBe('22:30');
    expect(result.strokeRate).toBe(24);
  });

  it('handles code fences without json language tag', () => {
    const input = '```\n{"pace": "2:05"}\n```';
    const result = parseExtractedData(input);
    expect(result.pace).toBe('2:05');
  });

  it('returns all nulls for empty fields', () => {
    const input = JSON.stringify({
      pace: null,
      totalTime: null,
      strokeRate: null,
      intervalPaces: null,
    });
    const result = parseExtractedData(input);
    expect(result).toEqual({
      pace: null,
      totalTime: null,
      strokeRate: null,
      intervalPaces: null,
    });
  });

  it('rejects invalid pace format', () => {
    const input = JSON.stringify({ pace: '205', totalTime: null, strokeRate: null });
    const result = parseExtractedData(input);
    expect(result.pace).toBeNull();
  });

  it('rejects pace with too many digits "123:45"', () => {
    const input = JSON.stringify({ pace: '123:45' });
    const result = parseExtractedData(input);
    expect(result.pace).toBeNull();
  });

  it('accepts pace with single-digit minutes "2:05"', () => {
    const input = JSON.stringify({ pace: '2:05' });
    expect(parseExtractedData(input).pace).toBe('2:05');
  });

  it('accepts pace with double-digit minutes "12:30"', () => {
    const input = JSON.stringify({ pace: '12:30' });
    expect(parseExtractedData(input).pace).toBe('12:30');
  });

  it('validates totalTime format', () => {
    const input = JSON.stringify({ totalTime: '22:30' });
    expect(parseExtractedData(input).totalTime).toBe('22:30');
  });

  it('accepts totalTime with triple-digit minutes "120:00"', () => {
    const input = JSON.stringify({ totalTime: '120:00' });
    expect(parseExtractedData(input).totalTime).toBe('120:00');
  });

  it('rejects totalTime that is just a number', () => {
    const input = JSON.stringify({ totalTime: '2230' });
    expect(parseExtractedData(input).totalTime).toBeNull();
  });

  it('validates strokeRate is a number in range 0-60', () => {
    expect(parseExtractedData(JSON.stringify({ strokeRate: 24 })).strokeRate).toBe(24);
    expect(parseExtractedData(JSON.stringify({ strokeRate: 0 })).strokeRate).toBe(0);
    expect(parseExtractedData(JSON.stringify({ strokeRate: 60 })).strokeRate).toBe(60);
  });

  it('rejects strokeRate outside range', () => {
    expect(parseExtractedData(JSON.stringify({ strokeRate: -1 })).strokeRate).toBeNull();
    expect(parseExtractedData(JSON.stringify({ strokeRate: 61 })).strokeRate).toBeNull();
  });

  it('rejects strokeRate that is a string', () => {
    expect(parseExtractedData(JSON.stringify({ strokeRate: '24' })).strokeRate).toBeNull();
  });

  it('rounds fractional strokeRate', () => {
    expect(parseExtractedData(JSON.stringify({ strokeRate: 23.7 })).strokeRate).toBe(24);
    expect(parseExtractedData(JSON.stringify({ strokeRate: 23.2 })).strokeRate).toBe(23);
  });

  it('parses valid intervalPaces array', () => {
    const input = JSON.stringify({ intervalPaces: ['1:55', '1:58', '2:00'] });
    expect(parseExtractedData(input).intervalPaces).toEqual(['1:55', '1:58', '2:00']);
  });

  it('filters out invalid paces from intervalPaces', () => {
    const input = JSON.stringify({ intervalPaces: ['1:55', 'bad', '2:00', 123] });
    expect(parseExtractedData(input).intervalPaces).toEqual(['1:55', '2:00']);
  });

  it('returns null intervalPaces when all entries are invalid', () => {
    const input = JSON.stringify({ intervalPaces: ['bad', 'nope'] });
    expect(parseExtractedData(input).intervalPaces).toBeNull();
  });

  it('returns null intervalPaces when array is empty', () => {
    const input = JSON.stringify({ intervalPaces: [] });
    expect(parseExtractedData(input).intervalPaces).toBeNull();
  });

  it('throws on completely invalid JSON', () => {
    expect(() => parseExtractedData('not json at all')).toThrow('Could not process photo');
  });

  it('handles extra whitespace around JSON', () => {
    const input = '  \n  {"pace": "2:05"}  \n  ';
    expect(parseExtractedData(input).pace).toBe('2:05');
  });
});

describe('buildPrompt', () => {
  const makeDesc = (overrides: Partial<SessionDescriptor> = {}): SessionDescriptor => ({
    weekNumber: 1,
    dayNumber: 1,
    label: '5000m',
    description: 'Focus on technique',
    isOptional: false,
    ...overrides,
  });

  it('includes the session label in the prompt', () => {
    const prompt = buildPrompt(makeDesc({ label: '5000m' }));
    expect(prompt).toContain('5000m');
  });

  it('includes the description in the prompt', () => {
    const prompt = buildPrompt(makeDesc({ description: 'Focus on technique' }));
    expect(prompt).toContain('Focus on technique');
  });

  it('includes intervalPaces field for interval sessions', () => {
    const prompt = buildPrompt(makeDesc({ label: '6 x 500m / 2min rest' }));
    expect(prompt).toContain('intervalPaces');
    expect(prompt).toContain('6'); // interval count
  });

  it('does not include intervalPaces for non-interval sessions', () => {
    const prompt = buildPrompt(makeDesc({ label: '5000m' }));
    expect(prompt).not.toContain('intervalPaces');
  });

  it('instructs to return only JSON', () => {
    const prompt = buildPrompt(makeDesc());
    expect(prompt).toContain('Return ONLY');
    expect(prompt).toContain('JSON');
  });
});

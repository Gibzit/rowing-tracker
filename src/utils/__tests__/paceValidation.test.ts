import { describe, it, expect } from 'vitest';
import { validatePace } from '../paceValidation';

describe('validatePace', () => {
  it('returns valid for empty string (not required)', () => {
    expect(validatePace('')).toEqual({ valid: true });
  });

  it('returns valid for "2:05"', () => {
    expect(validatePace('2:05')).toEqual({ valid: true });
  });

  it('returns valid for "0:00"', () => {
    expect(validatePace('0:00')).toEqual({ valid: true });
  });

  it('returns valid for "10:30" (double-digit minutes)', () => {
    expect(validatePace('10:30')).toEqual({ valid: true });
  });

  it('returns valid for "0:59"', () => {
    expect(validatePace('0:59')).toEqual({ valid: true });
  });

  it('returns invalid for seconds >= 60', () => {
    const result = validatePace('2:60');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns invalid for seconds = 99', () => {
    const result = validatePace('2:99');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for missing seconds "2:"', () => {
    expect(validatePace('2:').valid).toBe(false);
  });

  it('returns invalid for missing minutes ":30"', () => {
    expect(validatePace(':30').valid).toBe(false);
  });

  it('returns invalid for single-digit seconds "2:5"', () => {
    expect(validatePace('2:5').valid).toBe(false);
  });

  it('returns invalid for non-numeric "abc"', () => {
    expect(validatePace('abc').valid).toBe(false);
  });

  it('returns invalid for triple-digit minutes "100:00"', () => {
    expect(validatePace('100:00').valid).toBe(false);
  });

  it('returns invalid for plain number "120"', () => {
    expect(validatePace('120').valid).toBe(false);
  });

  it('returns invalid for negative "-1:30"', () => {
    expect(validatePace('-1:30').valid).toBe(false);
  });
});

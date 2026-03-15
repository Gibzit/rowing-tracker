export function validatePace(value: string): { valid: boolean; error?: string } {
  if (!value) return { valid: true };
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { valid: false, error: 'Use m:ss format (e.g. 2:05)' };
  const seconds = parseInt(match[2], 10);
  if (seconds >= 60) return { valid: false, error: 'Seconds must be 0-59' };
  return { valid: true };
}

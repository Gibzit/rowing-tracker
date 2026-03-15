import type { SessionRecord } from './storage';

export function sessionsPerDate(sessions: Record<string, SessionRecord>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of Object.values(sessions)) {
    if (record.completed && record.completedDate) {
      counts[record.completedDate] = (counts[record.completedDate] || 0) + 1;
    }
  }
  return counts;
}

export function intensityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

export function generateDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

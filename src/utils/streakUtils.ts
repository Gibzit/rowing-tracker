import type { SessionRecord } from './storage';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

function getActivityDates(sessions: Record<string, SessionRecord>, restDays?: string[]): Set<string> {
  const dates = new Set<string>();
  for (const record of Object.values(sessions)) {
    if (record.completed && record.completedDate) {
      dates.add(record.completedDate);
    }
  }
  // Rest days count as active days for streak purposes
  if (restDays) {
    for (const d of restDays) {
      dates.add(d);
    }
  }
  return dates;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculate streak length going backwards from startDate.
 *
 * Rules (rest-day tokens):
 * - In any 7-day window, the user gets 4 rest days (needs 3 active days).
 * - Active day = at least 1 completed session on that date.
 * - Rest day with available token = streak continues.
 * - Rest day with no token left in the 7-day window = streak breaks.
 */
function calculateStreakFrom(startDate: Date, activityDates: Set<string>): number {
  let streak = 0;
  const current = new Date(startDate);

  while (true) {
    const dateStr = formatDate(current);
    const hasActivity = activityDates.has(dateStr);

    if (!hasActivity) {
      // Count rest days in the 7-day window ending on this day
      let restDaysInWindow = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(current);
        d.setDate(d.getDate() - i);
        if (!activityDates.has(formatDate(d))) {
          restDaysInWindow++;
        }
      }
      if (restDaysInWindow > 4) break;
    }

    streak++;
    current.setDate(current.getDate() - 1);
    if (streak > 730) break;
  }

  return streak;
}

export function computeStreaks(sessions: Record<string, SessionRecord>, restDays?: string[]): StreakResult {
  const activityDates = getActivityDates(sessions, restDays);
  if (activityDates.size === 0) return { currentStreak: 0, longestStreak: 0 };

  // Current streak: start from today
  const currentStreak = calculateStreakFrom(new Date(), activityDates);

  // Longest streak: scan from each activity date forward to find the longest
  const sorted = Array.from(activityDates).sort();
  const lastDate = new Date(sorted[sorted.length - 1]);
  const firstDate = new Date(sorted[0]);

  let longestStreak = currentStreak;
  const scanDate = new Date(lastDate);

  while (scanDate >= firstDate) {
    const len = calculateStreakFrom(scanDate, activityDates);
    if (len > longestStreak) longestStreak = len;
    // Jump back by the streak length to skip redundant computation
    scanDate.setDate(scanDate.getDate() - Math.max(1, len));
  }

  return { currentStreak, longestStreak };
}

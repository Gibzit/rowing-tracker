import type { StoredData, SessionRecord } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { paceToSeconds } from './paceUtils';

export type AchievementId =
  | 'first-stroke'
  | 'week-warrior'
  | 'halfway-hero'
  | 'marathon-rower'
  | 'speed-demon'
  | 'consistency-king'
  | 'streak-master'
  | 'bonus-hunter'
  | 'data-nerd'
  | 'perfect-week';

export interface AchievementDef {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
}

export interface UnlockedAchievement {
  id: AchievementId;
  unlockedDate: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-stroke', name: 'First Stroke', description: 'Complete your first session', icon: '🚣' },
  { id: 'week-warrior', name: 'Week Warrior', description: 'Complete all core sessions in a week', icon: '⚔️' },
  { id: 'halfway-hero', name: 'Halfway Hero', description: 'Complete 36 core sessions', icon: '🏅' },
  { id: 'marathon-rower', name: 'Marathon Rower', description: 'Complete all 72 core sessions', icon: '🏆' },
  { id: 'speed-demon', name: 'Speed Demon', description: 'Log a pace under 2:00/500m', icon: '⚡' },
  { id: 'consistency-king', name: 'Consistency King', description: '7-day activity streak', icon: '👑' },
  { id: 'streak-master', name: 'Streak Master', description: '30-day activity streak', icon: '🔥' },
  { id: 'bonus-hunter', name: 'Bonus Hunter', description: 'Complete 10 optional sessions', icon: '🎯' },
  { id: 'data-nerd', name: 'Data Nerd', description: 'Log pace on 20+ sessions', icon: '📊' },
  { id: 'perfect-week', name: 'Perfect Week', description: 'Complete all 5 sessions in a week', icon: '💎' },
];

export function getAchievementDef(id: AchievementId): AchievementDef {
  return ACHIEVEMENTS.find((a) => a.id === id)!;
}

export function checkAchievements(
  data: StoredData,
  plan: SessionDescriptor[],
  streakInfo: { currentStreak: number; longestStreak: number }
): AchievementId[] {
  const earned: AchievementId[] = [];
  const sessions = data.sessions;

  // Count completed sessions
  const completedCount = Object.values(sessions).filter((s) => s.completed).length;

  // 1. First Stroke
  if (completedCount >= 1) earned.push('first-stroke');

  // 2. Week Warrior — any week with all core sessions complete
  const weekNumbers = [...new Set(plan.map((s) => s.weekNumber))];
  for (const w of weekNumbers) {
    const coreSessions = plan.filter((s) => s.weekNumber === w && !s.isOptional);
    if (
      coreSessions.length > 0 &&
      coreSessions.every((s) => sessions[`${s.weekNumber}-${s.dayNumber}`]?.completed)
    ) {
      earned.push('week-warrior');
      break;
    }
  }

  // 3. Halfway Hero — 36 core sessions
  const coreCompleted = plan.filter(
    (s) => !s.isOptional && sessions[`${s.weekNumber}-${s.dayNumber}`]?.completed
  ).length;
  if (coreCompleted >= 36) earned.push('halfway-hero');

  // 4. Marathon Rower — 72 core sessions
  if (coreCompleted >= 72) earned.push('marathon-rower');

  // 5. Speed Demon — any pace under 2:00 (120 seconds)
  const hasFastPace = Object.values(sessions).some((s: SessionRecord) => {
    if (!s.pace) return false;
    const seconds = paceToSeconds(s.pace);
    return seconds !== null && seconds < 120;
  });
  if (hasFastPace) earned.push('speed-demon');

  // 6. Consistency King — 7-day streak
  if (streakInfo.longestStreak >= 7) earned.push('consistency-king');

  // 7. Streak Master — 30-day streak
  if (streakInfo.longestStreak >= 30) earned.push('streak-master');

  // 8. Bonus Hunter — 10 optional sessions
  const optionalCompleted = plan.filter(
    (s) => s.isOptional && sessions[`${s.weekNumber}-${s.dayNumber}`]?.completed
  ).length;
  if (optionalCompleted >= 10) earned.push('bonus-hunter');

  // 9. Data Nerd — 20+ sessions with pace logged
  const sessionsWithPace = Object.values(sessions).filter(
    (s: SessionRecord) => s.completed && s.pace && paceToSeconds(s.pace) !== null
  ).length;
  if (sessionsWithPace >= 20) earned.push('data-nerd');

  // 10. Perfect Week — all sessions (core + optional visible) in any week, at least 5
  for (const w of weekNumbers) {
    const allInWeek = plan.filter((s) => s.weekNumber === w);
    if (
      allInWeek.length >= 5 &&
      allInWeek.every((s) => sessions[`${s.weekNumber}-${s.dayNumber}`]?.completed)
    ) {
      earned.push('perfect-week');
      break;
    }
  }

  return earned;
}

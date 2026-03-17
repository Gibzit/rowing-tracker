import { useMemo } from 'react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  restDays: string[];
  todayHasActivity: boolean;
  onLogRestDay: () => void;
  onUndoRestDay: () => void;
}

function getWeekBounds(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (dt: Date) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  return { start: fmt(monday), end: fmt(sunday) };
}

function formatToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function StreakDisplay({
  currentStreak,
  longestStreak,
  restDays,
  todayHasActivity,
  onLogRestDay,
  onUndoRestDay,
}: StreakDisplayProps) {
  const today = formatToday();
  const todayIsRestDay = restDays.includes(today);

  // Count rest days used this calendar week (Mon-Sun)
  const { restDaysThisWeek, weeklyQuota } = useMemo(() => {
    const { start, end } = getWeekBounds(new Date());
    const count = restDays.filter((d) => d >= start && d <= end).length;
    return { restDaysThisWeek: count, weeklyQuota: 4 };
  }, [restDays]);

  const remaining = weeklyQuota - restDaysThisWeek;
  const canLogRestDay = !todayHasActivity && !todayIsRestDay && remaining > 0;

  if (currentStreak === 0 && longestStreak === 0 && !todayIsRestDay) return null;

  return (
    <div className="flex flex-col gap-1.5 mb-2">
      {/* Streak info row */}
      <div className="flex items-center justify-between text-sm bg-orange-50/50 dark:bg-orange-900/10 rounded-lg px-2.5 py-1.5 border border-orange-100 dark:border-orange-900/20">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none" style={currentStreak >= 7 ? { animation: 'timerPulse 1.5s ease-in-out infinite' } : undefined}>🔥</span>
          <span className="font-bold text-gray-800 dark:text-gray-100">
            {currentStreak} day{currentStreak !== 1 ? 's' : ''}
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">streak</span>
        </div>
        <div className="flex items-center gap-2">
          {longestStreak > currentStreak && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
              Best: {longestStreak}d
            </span>
          )}
          {longestStreak === currentStreak && currentStreak > 0 && (
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
              BEST!
            </span>
          )}
        </div>
      </div>

      {/* Rest day row */}
      <div className="flex items-center justify-between text-sm bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg px-2.5 py-1.5 border border-indigo-100 dark:border-indigo-900/20">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">😴</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Rest days: <span className="font-semibold text-gray-700 dark:text-gray-200">{remaining}</span>/{weeklyQuota} left
          </span>
        </div>

        {todayIsRestDay ? (
          <button
            onClick={onUndoRestDay}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 px-2.5 py-1 rounded-full transition-colors active:scale-95 touch-manipulation min-h-[28px]"
          >
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Resting today
          </button>
        ) : canLogRestDay ? (
          <button
            onClick={onLogRestDay}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-900/20 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 px-2.5 py-1 rounded-full transition-colors active:scale-95 touch-manipulation min-h-[28px]"
          >
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Log rest day
          </button>
        ) : todayHasActivity ? (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            Trained today!
          </span>
        ) : remaining === 0 ? (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Week quota used
          </span>
        ) : null}
      </div>
    </div>
  );
}

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
  const day = d.getDay();
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

  const { restDaysThisWeek, weeklyQuota } = useMemo(() => {
    const { start, end } = getWeekBounds(new Date());
    const count = restDays.filter((d) => d >= start && d <= end).length;
    return { restDaysThisWeek: count, weeklyQuota: 4 };
  }, [restDays]);

  const remaining = weeklyQuota - restDaysThisWeek;
  const canLogRestDay = !todayHasActivity && !todayIsRestDay && remaining > 0;

  if (currentStreak === 0 && longestStreak === 0 && !todayIsRestDay) return null;

  return (
    <div className="flex gap-2.5 mb-4">
      {/* Streak info */}
      <div className="flex-1 flex items-center gap-2 text-sm bg-teal-50 dark:bg-[#00d2ff]/5 rounded-xl px-3 py-2">
        <span className="text-base leading-none" style={currentStreak >= 7 ? { animation: 'timerPulse 1.5s ease-in-out infinite' } : undefined}>
          <svg className="w-4 h-4 text-[#00d2ff]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
        </span>
        <span className="font-display font-bold text-gray-800 dark:text-[#dae2fd] text-sm">
          {currentStreak}
        </span>
        <span className="text-[#5a6580] text-[10px] uppercase font-medium" style={{ letterSpacing: '0.05em' }}>day{currentStreak !== 1 ? 's' : ''}</span>
        {longestStreak === currentStreak && currentStreak > 0 && (
          <span className="text-[9px] font-bold text-[#00d2ff] bg-[#00d2ff]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-auto">
            Best
          </span>
        )}
        {longestStreak > currentStreak && (
          <span className="text-[10px] text-[#5a6580] font-mono ml-auto">
            /{longestStreak}
          </span>
        )}
      </div>

      {/* Rest day */}
      <div className="flex items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-900/10 rounded-xl px-3 py-2">
        <span className="text-[10px] text-[#5a6580] uppercase font-medium" style={{ letterSpacing: '0.05em' }}>
          Rest <span className="font-mono font-bold text-gray-700 dark:text-[#bbc9cf]">{remaining}</span>/{weeklyQuota}
        </span>

        {todayIsRestDay ? (
          <button
            onClick={onUndoRestDay}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 px-2 py-0.5 rounded-full transition-colors active:scale-95 touch-manipulation uppercase tracking-wider"
          >
            Resting
          </button>
        ) : canLogRestDay ? (
          <button
            onClick={onLogRestDay}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-900/20 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 px-2 py-0.5 rounded-full transition-colors active:scale-95 touch-manipulation uppercase tracking-wider"
          >
            +Rest
          </button>
        ) : null}
      </div>
    </div>
  );
}

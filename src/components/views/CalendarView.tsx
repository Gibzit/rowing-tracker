import { useMemo, useState, useCallback } from 'react';
import type { SessionRecord } from '../../utils/storage';
import type { SessionDescriptor } from '../../data/trainingPlan';

interface CalendarViewProps {
  sessions: Record<string, SessionRecord>;
  restDays: string[];
  plan: SessionDescriptor[];
}

interface DayInfo {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  sessionDetails: { label: string; pace?: string; strokeRate?: number }[];
  isRestDay: boolean;
  sessionCount: number;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildSessionsByDate(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): Record<string, { label: string; pace?: string; strokeRate?: number }[]> {
  const map: Record<string, { label: string; pace?: string; strokeRate?: number }[]> = {};

  // Build a lookup from session key to plan descriptor
  const planMap = new Map<string, SessionDescriptor>();
  for (const desc of plan) {
    planMap.set(`${desc.weekNumber}-${desc.dayNumber}`, desc);
  }

  for (const [key, record] of Object.entries(sessions)) {
    if (record.completed && record.completedDate) {
      const desc = planMap.get(key);
      const label = desc?.label || 'Session';
      if (!map[record.completedDate]) map[record.completedDate] = [];
      map[record.completedDate].push({
        label,
        pace: record.pace || undefined,
        strokeRate: record.strokeRate,
      });
    }
  }

  return map;
}

export default function CalendarView({ sessions, restDays, plan }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const restDaySet = useMemo(() => new Set(restDays), [restDays]);
  const sessionsByDate = useMemo(() => buildSessionsByDate(sessions, plan), [sessions, plan]);

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  // Build calendar grid for current month (always 6 rows × 7 cols, Mon-start)
  const calendarDays = useMemo((): DayInfo[][] => {
    const { year, month } = currentMonth;
    const firstOfMonth = new Date(year, month, 1);
    // getDay: 0=Sun. Convert to Mon-start: Mon=0, Sun=6
    let startDow = firstOfMonth.getDay() - 1;
    if (startDow < 0) startDow = 6;

    // Start from the Monday before (or on) the 1st
    const gridStart = new Date(year, month, 1 - startDow);

    const weeks: DayInfo[][] = [];
    const cursor = new Date(gridStart);

    for (let w = 0; w < 6; w++) {
      const week: DayInfo[] = [];
      for (let d = 0; d < 7; d++) {
        const dateKey = formatDateKey(cursor);
        const details = sessionsByDate[dateKey] || [];
        week.push({
          date: new Date(cursor),
          dateKey,
          isCurrentMonth: cursor.getMonth() === month,
          isToday: dateKey === todayKey,
          sessionDetails: details,
          isRestDay: restDaySet.has(dateKey),
          sessionCount: details.length,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    // Trim trailing weeks that are entirely in the next month
    while (
      weeks.length > 4 &&
      weeks[weeks.length - 1].every((d) => !d.isCurrentMonth)
    ) {
      weeks.pop();
    }

    return weeks;
  }, [currentMonth, sessionsByDate, restDaySet, todayKey]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
    setSelectedDay(null);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
    setSelectedDay(null);
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDay(todayKey);
  }, [todayKey]);

  // Stats for this month
  const monthStats = useMemo(() => {
    const { year, month } = currentMonth;
    let sessionCount = 0;
    let restCount = 0;
    let daysWithActivity = 0;

    // Iterate all days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatDateKey(new Date(year, month, d));
      const count = sessionsByDate[key]?.length || 0;
      if (count > 0) {
        sessionCount += count;
        daysWithActivity++;
      }
      if (restDaySet.has(key)) restCount++;
    }
    return { sessionCount, restCount, daysWithActivity };
  }, [currentMonth, sessionsByDate, restDaySet]);

  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    for (const week of calendarDays) {
      for (const day of week) {
        if (day.dateKey === selectedDay) return day;
      }
    }
    return null;
  }, [selectedDay, calendarDays]);

  const isCurrentMonthView =
    currentMonth.year === new Date().getFullYear() &&
    currentMonth.month === new Date().getMonth();

  return (
    <div className="py-5 px-5">
      {/* Month header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2640] active:scale-90 transition-all touch-manipulation"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-xl font-display font-extrabold text-gray-800 dark:text-[#dae2fd] uppercase tracking-wide">
            {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
          </h2>
          {!isCurrentMonthView && (
            <button
              onClick={goToToday}
              className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mt-0.5 hover:underline touch-manipulation"
            >
              Go to today
            </button>
          )}
        </div>

        <button
          onClick={goToNextMonth}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2640] active:scale-90 transition-all touch-manipulation"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Monthly stats bar */}
      {(monthStats.sessionCount > 0 || monthStats.restCount > 0) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {monthStats.sessionCount > 0 && (
            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-1.5">
              <span className="text-green-600 dark:text-green-400 text-sm font-mono font-bold">{monthStats.sessionCount}</span>
              <span className="text-green-600 dark:text-green-400 text-xs">session{monthStats.sessionCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {monthStats.daysWithActivity > 0 && (
            <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-900/20 rounded-xl px-3 py-1.5">
              <span className="text-teal-600 dark:text-teal-400 text-sm font-mono font-bold">{monthStats.daysWithActivity}</span>
              <span className="text-teal-600 dark:text-teal-400 text-xs">active day{monthStats.daysWithActivity !== 1 ? 's' : ''}</span>
            </div>
          )}
          {monthStats.restCount > 0 && (
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-1.5">
              <span className="text-indigo-600 dark:text-indigo-400 text-sm font-mono font-bold">{monthStats.restCount}</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-xs">rest day{monthStats.restCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400" />
          <span>Training</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-indigo-400 dark:bg-indigo-400" />
          <span>Rest day</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full ring-2 ring-teal-400 ring-inset bg-transparent" />
          <span>Today</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white dark:bg-[#0f1b33] rounded-2xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/[0.06]">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-[11px] font-semibold text-gray-400 dark:text-[#5a6580] uppercase tracking-wider py-2"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        {calendarDays.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-gray-50 dark:border-[#1a2640] last:border-b-0">
            {week.map((day) => {
              const hasTraining = day.sessionCount > 0;
              const isSelected = selectedDay === day.dateKey;

              return (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedDay(isSelected ? null : day.dateKey)}
                  className={`
                    relative flex flex-col items-center justify-start py-1.5 min-h-[52px]
                    transition-colors touch-manipulation
                    ${day.isCurrentMonth ? '' : 'opacity-30'}
                    ${isSelected ? 'bg-teal-50 dark:bg-teal-900/20' : 'hover:bg-gray-50 dark:hover:bg-[#1a2640]/50'}
                  `}
                  aria-label={`${day.dateKey}${hasTraining ? `, ${day.sessionCount} session${day.sessionCount !== 1 ? 's' : ''}` : ''}${day.isRestDay ? ', rest day' : ''}`}
                >
                  {/* Day number */}
                  <span
                    className={`
                      text-sm font-mono font-bold leading-none mb-1
                      ${day.isToday
                        ? 'w-6 h-6 flex items-center justify-center rounded-full bg-teal-500 dark:bg-teal-500 text-white font-mono font-bold'
                        : day.isCurrentMonth
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-300 dark:text-[#404b66]'
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Activity indicators */}
                  <div className="flex items-center gap-0.5 flex-wrap justify-center">
                    {hasTraining && (
                      <>
                        {day.sessionDetails.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className="w-[6px] h-[6px] rounded-full bg-green-500 dark:bg-green-400"
                          />
                        ))}
                        {day.sessionCount > 3 && (
                          <span className="text-[8px] text-green-600 dark:text-green-400 font-bold leading-none">+{day.sessionCount - 3}</span>
                        )}
                      </>
                    )}
                    {day.isRestDay && (
                      <div className="w-[6px] h-[6px] rounded-full bg-indigo-400 dark:bg-indigo-400" />
                    )}
                  </div>

                  {/* Session label preview (show first session label if space) */}
                  {hasTraining && day.isCurrentMonth && (
                    <span className="text-[8px] leading-tight text-green-700 dark:text-green-400 font-medium mt-0.5 max-w-full truncate px-0.5">
                      {day.sessionDetails[0].label.length > 6
                        ? day.sessionDetails[0].label.replace(/\s*\/.*/, '').slice(0, 7)
                        : day.sessionDetails[0].label}
                    </span>
                  )}
                  {day.isRestDay && !hasTraining && day.isCurrentMonth && (
                    <svg className="w-3 h-3 text-indigo-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                  )}

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-teal-500 dark:bg-teal-400" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected day detail panel */}
      {selectedDayInfo && (
        <div
          className="mt-3 bg-white dark:bg-[#0f1b33] rounded-2xl p-5"
          style={{ animation: 'slideDown 0.2s ease-out' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-mono font-bold text-gray-800 dark:text-[#dae2fd]">
              {selectedDayInfo.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-gray-400 dark:text-[#5a6580] hover:text-gray-600 dark:hover:text-gray-300 min-w-[28px] min-h-[28px] flex items-center justify-center touch-manipulation"
              aria-label="Close details"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {selectedDayInfo.sessionCount === 0 && !selectedDayInfo.isRestDay && (
            <p className="text-sm text-gray-400 dark:text-[#5a6580] italic">No activity on this day</p>
          )}

          {selectedDayInfo.isRestDay && (
            <div className="flex items-center gap-2 mb-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Rest day</span>
            </div>
          )}

          {selectedDayInfo.sessionDetails.map((session, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${i > 0 ? 'mt-2 pt-2 border-t border-gray-100 dark:border-white/[0.06]' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 dark:text-[#dae2fd] uppercase tracking-wider">{session.label}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {session.pace && (
                    <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                      {session.pace}/500m
                    </span>
                  )}
                  {session.strokeRate && (
                    <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {session.strokeRate} spm
                    </span>
                  )}
                  {!session.pace && !session.strokeRate && (
                    <span className="text-xs text-gray-400 dark:text-[#5a6580]">Completed</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {monthStats.sessionCount === 0 && monthStats.restCount === 0 && (
        <div className="mt-4 bg-teal-50 dark:bg-teal-900/30 rounded-2xl p-5">
          <p className="text-xs font-bold text-teal-700 dark:text-teal-300 mb-1 uppercase tracking-wider">No activity this month</p>
          <p className="text-xs text-teal-600 dark:text-teal-400">Complete sessions from the Training tab to see them here.</p>
        </div>
      )}
    </div>
  );
}

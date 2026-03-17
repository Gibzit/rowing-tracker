import { useMemo, useState } from 'react';
import type { SessionRecord } from '../../utils/storage';
import {
  sessionsPerDate,
  intensityLevel,
  generateDateRange,
  formatDateKey,
  getMonthLabel,
} from '../../utils/calendarUtils';

interface CalendarViewProps {
  sessions: Record<string, SessionRecord>;
}

const CELL_SIZE = 18;
const GAP = 2;
const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

const INTENSITY_COLORS = [
  'bg-gray-100 dark:bg-[#1a3550]',
  'bg-green-200 dark:bg-green-800',
  'bg-green-400 dark:bg-green-600',
  'bg-green-600 dark:bg-green-500',
  'bg-green-800 dark:bg-green-400',
];

export default function CalendarView({ sessions }: CalendarViewProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);

  const dateCounts = useMemo(() => sessionsPerDate(sessions), [sessions]);

  // Compute daily streak
  const currentStreak = useMemo(() => {
    const today = new Date();
    let streak = 0;
    const check = new Date(today);
    while (true) {
      const key = formatDateKey(check);
      if (dateCounts[key] && dateCounts[key] > 0) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [dateCounts]);

  const { weeks, monthLabels } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 140);
    start.setDate(start.getDate() - start.getDay());

    const dates = generateDateRange(start, end);

    const wks: { dates: Date[] }[] = [];
    let currentWeek: Date[] = [];
    for (const d of dates) {
      if (d.getDay() === 0 && currentWeek.length > 0) {
        wks.push({ dates: currentWeek });
        currentWeek = [];
      }
      currentWeek.push(d);
    }
    if (currentWeek.length > 0) wks.push({ dates: currentWeek });

    const labels: { text: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    wks.forEach((wk, wi) => {
      const firstDay = wk.dates[0];
      if (firstDay.getMonth() !== lastMonth) {
        lastMonth = firstDay.getMonth();
        labels.push({ text: getMonthLabel(firstDay), weekIndex: wi });
      }
    });

    return { weeks: wks, monthLabels: labels };
  }, []);

  const hasAnyDates = Object.keys(dateCounts).length > 0;
  const totalSessions = Object.values(dateCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="py-4 px-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Activity Calendar</h2>

      {/* Stats summary */}
      {hasAnyDates && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg px-3 py-1.5">
            <span className="text-green-600 dark:text-green-400 text-sm font-bold">{totalSessions}</span>
            <span className="text-green-600 dark:text-green-400 text-xs">sessions</span>
          </div>
          {currentStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg px-3 py-1.5">
              <span className="text-base leading-none">🔥</span>
              <span className="text-orange-600 dark:text-orange-400 text-sm font-bold">{currentStreak} day streak</span>
            </div>
          )}
        </div>
      )}

      {!hasAnyDates && (
        <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-1">Start building your heatmap!</p>
          <p className="text-xs text-teal-600 dark:text-teal-400">Complete sessions to see your activity visualized here.</p>
        </div>
      )}

      {/* Legend at top */}
      <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        {INTENSITY_COLORS.map((cls, i) => (
          <div
            key={i}
            className={`rounded-[3px] ${cls}`}
            style={{ width: 12, height: 12 }}
          />
        ))}
        <span>More</span>
        <span className="ml-2 text-[10px] text-gray-400 dark:text-gray-500">Tap a cell for details</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-flex">
          {/* Day labels column */}
          <div className="flex flex-col mr-1" style={{ marginTop: 18 }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-gray-400 dark:text-gray-500 leading-none"
                style={{ height: CELL_SIZE + GAP, display: 'flex', alignItems: 'center' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div>
            {/* Month labels */}
            <div className="flex" style={{ height: 16 }}>
              {monthLabels.map((ml, i) => (
                <div
                  key={i}
                  className="text-[10px] text-gray-400 dark:text-gray-500 absolute"
                  style={{ left: ml.weekIndex * (CELL_SIZE + GAP), position: 'relative' }}
                >
                  {ml.text}
                </div>
              ))}
            </div>

            {/* Cells grid */}
            <div className="flex gap-[2px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const date = week.dates.find((d) => d.getDay() === dayIdx);
                    if (!date) {
                      return (
                        <div
                          key={dayIdx}
                          style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        />
                      );
                    }
                    const dateKey = formatDateKey(date);
                    const count = dateCounts[dateKey] || 0;
                    const level = intensityLevel(count);
                    const isToday = formatDateKey(new Date()) === dateKey;

                    return (
                      <div
                        key={dayIdx}
                        className={`rounded-[3px] ${INTENSITY_COLORS[level]} ${
                          isToday ? 'ring-1.5 ring-teal-400 ring-offset-1 ring-offset-white dark:ring-offset-[#0c1929]' : ''
                        } cursor-pointer transition-transform hover:scale-[1.3]`}
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        onPointerEnter={() => setTooltip({ date: dateKey, count })}
                        onPointerLeave={() => setTooltip(null)}
                        onClick={() => setTooltip(tooltip?.date === dateKey ? null : { date: dateKey, count })}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Persistent tooltip */}
      {tooltip && (
        <div className="mt-2 bg-gray-50 dark:bg-[#1a3550] border border-gray-200 dark:border-[#2a4a6b] rounded-lg px-3 py-2 inline-flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200">{tooltip.date}</span>
          <span className="text-gray-500 dark:text-gray-400">
            {tooltip.count} session{tooltip.count !== 1 ? 's' : ''} completed
          </span>
        </div>
      )}
    </div>
  );
}

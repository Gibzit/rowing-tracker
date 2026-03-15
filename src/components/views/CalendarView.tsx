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

const CELL_SIZE = 14;
const GAP = 2;
const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

const INTENSITY_COLORS = [
  'bg-gray-100 dark:bg-gray-700',
  'bg-green-200 dark:bg-green-800',
  'bg-green-400 dark:bg-green-600',
  'bg-green-600 dark:bg-green-500',
  'bg-green-800 dark:bg-green-400',
];

export default function CalendarView({ sessions }: CalendarViewProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);

  const dateCounts = useMemo(() => sessionsPerDate(sessions), [sessions]);

  const { weeks, monthLabels } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    // Start 20 weeks ago (covers ~5 months)
    const start = new Date(now);
    start.setDate(start.getDate() - 140);
    // Align start to Sunday
    start.setDate(start.getDate() - start.getDay());

    const dates = generateDateRange(start, end);

    // Group by weeks
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

    // Month labels
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

  return (
    <div className="py-4 px-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Activity Calendar</h2>

      {!hasAnyDates && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 text-sm text-blue-700 dark:text-blue-300">
          Date tracking starts now. Complete sessions to see your activity heatmap.
        </div>
      )}

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
                        className={`rounded-sm ${INTENSITY_COLORS[level]} ${
                          isToday ? 'ring-1 ring-blue-400' : ''
                        } cursor-pointer`}
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        onPointerEnter={() => setTooltip({ date: dateKey, count })}
                        onPointerLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {tooltip.date}: {tooltip.count} session{tooltip.count !== 1 ? 's' : ''} completed
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        {INTENSITY_COLORS.map((cls, i) => (
          <div
            key={i}
            className={`rounded-sm ${cls}`}
            style={{ width: 12, height: 12 }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

import type { GroupedWorkout } from '../../utils/workoutGrouping';

interface ComparisonTableProps {
  group: GroupedWorkout;
}

export default function ComparisonTable({ group }: ComparisonTableProps) {
  return (
    <div className="space-y-2">
      {group.entries.map((entry, i) => {
        const isBest = entry.paceSeconds === group.bestPaceSeconds;
        const prev = i > 0 ? group.entries[i - 1] : null;
        const delta = prev ? entry.paceSeconds - prev.paceSeconds : null;

        return (
          <div
            key={`${entry.weekNumber}-${entry.dayNumber}`}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              isBest
                ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#0f1b33]'
            }`}
          >
            <div>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                Week {entry.weekNumber}, Day {entry.dayNumber}
              </span>
              {isBest && (
                <svg className="w-3.5 h-3.5 text-amber-500 ml-1.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
                  <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0012 0V2Z" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-bold text-gray-900 dark:text-[#dae2fd]">
                {entry.paceFormatted}
              </span>
              {delta !== null && delta !== 0 && (
                <span
                  className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                    delta < 0
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                  }`}
                >
                  {delta < 0 ? '' : '+'}{delta}s
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

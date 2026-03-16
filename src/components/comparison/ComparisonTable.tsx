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
                : 'border-gray-200 dark:border-[#1e3a5f] bg-white dark:bg-[#0f2438]'
            }`}
          >
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Week {entry.weekNumber}, Day {entry.dayNumber}
              </span>
              {isBest && <span className="text-amber-500 ml-1.5 text-sm">🏆</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {entry.paceFormatted}
              </span>
              {delta !== null && delta !== 0 && (
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
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

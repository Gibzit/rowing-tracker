interface ProgressGridProps {
  totalWeeks: number;
  currentWeek: number;
  selectedWeek: number;
  isWeekComplete: (week: number) => boolean;
  onSelectWeek: (week: number) => void;
}

export default function ProgressGrid({
  totalWeeks,
  currentWeek,
  selectedWeek,
  isWeekComplete,
  onSelectWeek,
}: ProgressGridProps) {
  const completedCount = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter(isWeekComplete).length;
  const pct = totalWeeks > 0 ? Math.round((completedCount / Math.min(totalWeeks, 24)) * 100) : 0;

  return (
    <div className="mx-4 mb-3 p-3 rounded-xl bg-white dark:bg-[#0f2438] border border-gray-200 dark:border-[#1e3a5f]">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Plan Progress
        </h3>
        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
          {completedCount}/{Math.min(totalWeeks, 24)} weeks ({pct}%)
        </span>
      </div>

      <div className="grid grid-cols-12 gap-1.5">
        {Array.from({ length: Math.min(totalWeeks, 24) }, (_, i) => i + 1).map((week) => {
          const isComplete = isWeekComplete(week);
          const isCurrent = week === currentWeek;
          const isSelected = week === selectedWeek;

          let cellClasses = 'aspect-square rounded-md transition-all duration-200 cursor-pointer relative flex items-center justify-center text-[9px] font-bold';

          if (isSelected) {
            cellClasses += ' bg-teal-500 text-white shadow-sm shadow-teal-500/30 ring-2 ring-teal-400/50';
          } else if (isComplete) {
            cellClasses += ' bg-green-500 dark:bg-green-600 text-white';
          } else if (isCurrent) {
            cellClasses += ' bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 ring-1 ring-teal-400';
          } else {
            cellClasses += ' bg-gray-100 dark:bg-[#1a3550] text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-[#24506e]';
          }

          return (
            <button
              key={week}
              onClick={() => onSelectWeek(week)}
              className={cellClasses}
              aria-label={`Week ${week}${isComplete ? ', completed' : ''}${isCurrent ? ', current' : ''}${isSelected ? ', selected' : ''}`}
            >
              {week}
            </button>
          );
        })}
      </div>
    </div>
  );
}

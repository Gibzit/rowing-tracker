import { memo } from 'react';

interface WeekCellProps {
  week: number;
  isComplete: boolean;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: (week: number) => void;
}

const WeekCell = memo(function WeekCell({ week, isComplete, isCurrent, isSelected, onSelect }: WeekCellProps) {
  let cellClasses = 'aspect-square rounded-lg transition-all duration-200 cursor-pointer relative flex items-center justify-center text-[9px] font-mono font-bold';

  if (isSelected) {
    cellClasses += ' text-[#060e20] ring-2 ring-[#00d2ff]/40';
  } else if (isComplete) {
    cellClasses += ' bg-green-500/90 dark:bg-green-500/80 text-white';
  } else if (isCurrent) {
    cellClasses += ' bg-teal-100 dark:bg-[#00d2ff]/10 text-teal-700 dark:text-[#00d2ff] ring-1 ring-[#00d2ff]/40';
  } else {
    cellClasses += ' bg-gray-100 dark:bg-[#1a2640] text-gray-400 dark:text-[#5a6580] hover:bg-gray-200 dark:hover:bg-[#222a3d]';
  }

  return (
    <button
      onClick={() => onSelect(week)}
      className={cellClasses}
      style={isSelected ? { background: 'linear-gradient(135deg, #a5e7ff, #00d2ff)' } : undefined}
      aria-label={`Week ${week}${isComplete ? ', completed' : ''}${isCurrent ? ', current' : ''}${isSelected ? ', selected' : ''}`}
    >
      {week}
    </button>
  );
});

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
  const displayedWeeks = totalWeeks;
  const completedCount = Array.from({ length: displayedWeeks }, (_, i) => i + 1).filter(isWeekComplete).length;

  return (
    <div className="mx-5 mb-5 p-5 rounded-2xl bg-white dark:bg-[#0f1b33]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase" style={{ letterSpacing: '0.08em' }}>
          Plan Progress
        </h3>
        <span className="text-[10px] font-mono font-bold text-[#00d2ff] tracking-wide">
          {completedCount}/{displayedWeeks} wk
        </span>
      </div>

      <div className="grid grid-cols-12 gap-2">
        {Array.from({ length: displayedWeeks }, (_, i) => i + 1).map((week) => (
          <WeekCell
            key={week}
            week={week}
            isComplete={isWeekComplete(week)}
            isCurrent={week === currentWeek}
            isSelected={week === selectedWeek}
            onSelect={onSelectWeek}
          />
        ))}
      </div>
    </div>
  );
}

import { useRef, useEffect } from 'react';

interface WeekSelectorProps {
  selectedWeek: number;
  currentWeek: number;
  onSelectWeek: (week: number) => void;
  isWeekComplete: (week: number) => boolean;
  totalWeeks?: number;
}

export default function WeekSelector({
  selectedWeek,
  currentWeek,
  onSelectWeek,
  isWeekComplete,
  totalWeeks = 24,
}: WeekSelectorProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedWeek]);

  return (
    <div className="overflow-x-auto py-3 px-4 border-b border-gray-100 dark:border-[#1e3a5f] bg-gray-50 dark:bg-[#0f2438] scroll-smooth">
      <div className="flex gap-2 min-w-max">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
          const isSelected = week === selectedWeek;
          const isCurrent = week === currentWeek;
          const isComplete = isWeekComplete(week);

          let classes =
            'min-w-[44px] h-[44px] rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center';
          if (isSelected) {
            classes += ' bg-teal-600 text-white shadow-[0_0_10px_rgba(13,148,136,0.3)]';
          } else if (isComplete) {
            classes += ' bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400';
          } else {
            classes += ' bg-gray-100 dark:bg-[#1a3550] text-gray-700 dark:text-gray-300';
          }
          if (isCurrent && !isSelected) {
            classes += ' ring-2 ring-teal-400';
          }

          return (
            <button
              key={week}
              ref={isSelected ? activeRef : undefined}
              onClick={() => onSelectWeek(week)}
              className={classes}
            >
              {week}
            </button>
          );
        })}
      </div>
    </div>
  );
}

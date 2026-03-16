import type { WorkoutCategory } from '../../utils/paceUtils';

type FilterOption = 'all' | WorkoutCategory;

interface ChartFilterBarProps {
  active: FilterOption;
  onChange: (filter: FilterOption) => void;
}

const filters: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'distance', label: 'Distance' },
  { id: 'interval', label: 'Intervals' },
  { id: 'time', label: 'Time' },
];

export default function ChartFilterBar({ active, onChange }: ChartFilterBarProps) {
  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors touch-manipulation ${
            active === f.id
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 dark:bg-[#1a3550] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a4a6b]'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

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
    <div className="flex bg-gray-100 dark:bg-[#1a2640] rounded-2xl p-1 mb-1">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap transition-all duration-200 touch-manipulation ${
            active === f.id
              ? 'bg-[#00d2ff] text-[#060e20] shadow-sm'
              : 'text-gray-500 dark:text-[#5a6580] hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

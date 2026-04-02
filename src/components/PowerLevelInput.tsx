import { useCallback } from 'react';

interface PowerLevelInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  isDefault?: boolean; // true when value came from defaultDragFactor pre-fill
}

export default function PowerLevelInput({ value, onChange, isDefault }: PowerLevelInputProps) {
  const handleSelect = useCallback(
    (level: number) => {
      // Tapping the already-selected value deselects it
      onChange(value === level ? undefined : level);
    },
    [value, onChange]
  );

  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
        Power Level
      </label>
      <div className="flex justify-between">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
          const isSelected = value === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => handleSelect(level)}
              className="min-w-[44px] min-h-[44px] -mx-[3px] flex items-center justify-center touch-manipulation"
              aria-label={`Power level ${level}`}
              aria-pressed={isSelected}
            >
              <span className={`
                w-8 h-8 rounded-full text-xs font-bold
                flex items-center justify-center
                transition-all duration-150
                ${
                  isSelected
                    ? isDefault
                      ? 'bg-gray-300 dark:bg-[#404b66] text-gray-700 dark:text-gray-200 ring-2 ring-gray-400 dark:ring-gray-500'
                      : 'bg-teal-500 dark:bg-[#00d2ff] text-white dark:text-[#060e20] ring-2 ring-teal-400 dark:ring-[#00d2ff] scale-110'
                    : 'bg-gray-100 dark:bg-[#1a2640] text-gray-500 dark:text-gray-400'
                }
              `}>
                {level}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

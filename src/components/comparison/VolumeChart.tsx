import { useMemo } from 'react';

interface VolumeDataPoint {
  weekNumber: number;
  value: number;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  color: string;
  currentWeek: number;
  formatValue: (value: number) => string;
  label: string;
}

export default function VolumeChart({ data, color, currentWeek, formatValue, label }: VolumeChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  if (data.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="flex flex-col gap-1.5">
        {data.map((d) => {
          const isCurrent = d.weekNumber === currentWeek;
          const widthPercent = Math.max((d.value / maxValue) * 100, 2);
          return (
            <div key={d.weekNumber} className="flex items-center gap-2 h-7">
              <span
                className={`text-[10px] font-mono w-7 shrink-0 text-right ${
                  isCurrent
                    ? 'font-bold text-gray-700 dark:text-white'
                    : 'text-gray-400 dark:text-[#5a6580]'
                }`}
              >
                W{d.weekNumber}
              </span>
              <div className="flex-1 h-5 rounded-full bg-gray-100 dark:bg-[#1a2640] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${color} ${
                    isCurrent ? 'opacity-100' : 'opacity-70'
                  }`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-mono w-16 shrink-0 text-right ${
                  isCurrent
                    ? 'font-bold text-gray-700 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {formatValue(d.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

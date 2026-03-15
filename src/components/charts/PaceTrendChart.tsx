import { useState } from 'react';
import type { PaceDataPoint } from '../../utils/paceUtils';
import { secondsToPace } from '../../utils/paceUtils';

interface PaceTrendChartProps {
  data: PaceDataPoint[];
}

const CATEGORY_COLORS: Record<string, { stroke: string; fill: string }> = {
  distance: { stroke: '#3b82f6', fill: '#3b82f6' },
  interval: { stroke: '#f59e0b', fill: '#f59e0b' },
  time: { stroke: '#10b981', fill: '#10b981' },
};

const PADDING = { top: 20, right: 20, bottom: 30, left: 50 };
const CHART_WIDTH = 340;
const CHART_HEIGHT = 200;

export default function PaceTrendChart({ data }: PaceTrendChartProps) {
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);

  if (data.length === 0) return null;

  const paces = data.map((d) => d.paceSeconds);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const paceRange = maxPace - minPace || 10;
  const padded = paceRange * 0.1;

  const yMin = minPace - padded;
  const yMax = maxPace + padded;

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const xScale = (i: number) =>
    PADDING.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);

  // Y is inverted: lower pace (faster) = higher on chart
  const yScale = (pace: number) =>
    PADDING.top + ((pace - yMin) / (yMax - yMin)) * innerH;

  // Grid lines (3-5 horizontal)
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const pace = yMin + (i / gridCount) * (yMax - yMin);
    return { y: yScale(pace), label: secondsToPace(Math.round(pace)) };
  });

  // Line path
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.paceSeconds)}`)
    .join(' ');

  return (
    <div className="px-4 py-2 relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        style={{ maxHeight: 250 }}
      >
        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={PADDING.left}
              y1={g.y}
              x2={CHART_WIDTH - PADDING.right}
              y2={g.y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-gray-200 dark:text-gray-700"
            />
            <text
              x={PADDING.left - 6}
              y={g.y + 3}
              textAnchor="end"
              fontSize="9"
              fill="currentColor"
              className="text-gray-500 dark:text-gray-400"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* X axis */}
        <line
          x1={PADDING.left}
          y1={CHART_HEIGHT - PADDING.bottom}
          x2={CHART_WIDTH - PADDING.right}
          y2={CHART_HEIGHT - PADDING.bottom}
          stroke="currentColor"
          strokeWidth="1"
          className="text-gray-300 dark:text-gray-600"
        />

        {/* Line */}
        {data.length > 1 && (
          <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
        )}

        {/* Data points */}
        {data.map((d, i) => {
          const color = CATEGORY_COLORS[d.category] || CATEGORY_COLORS.distance;
          return (
            <circle
              key={i}
              cx={xScale(i)}
              cy={yScale(d.paceSeconds)}
              r={tooltip?.index === i ? 6 : 4}
              fill={color.fill}
              stroke="white"
              strokeWidth="1.5"
              className="cursor-pointer"
              onPointerEnter={() => setTooltip({ index: i, x: xScale(i), y: yScale(d.paceSeconds) })}
              onPointerLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* Touch targets (invisible larger circles) */}
        {data.map((d, i) => (
          <circle
            key={`touch-${i}`}
            cx={xScale(i)}
            cy={yScale(d.paceSeconds)}
            r={12}
            fill="transparent"
            onPointerEnter={() =>
              setTooltip({ index: i, x: xScale(i), y: yScale(d.paceSeconds) })
            }
            onPointerLeave={() => setTooltip(null)}
          />
        ))}

        {/* Faster label */}
        <text
          x={PADDING.left - 6}
          y={PADDING.top - 6}
          textAnchor="end"
          fontSize="8"
          fill="currentColor"
          className="text-green-500"
        >
          Faster
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip && data[tooltip.index] && (
        <div
          className="absolute bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-2.5 py-1.5 pointer-events-none shadow-lg z-10"
          style={{
            left: `${(tooltip.x / CHART_WIDTH) * 100}%`,
            top: `${(tooltip.y / CHART_HEIGHT) * 100 - 14}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-medium">{secondsToPace(data[tooltip.index].paceSeconds)}/500m</div>
          <div className="opacity-75">
            W{data[tooltip.index].weekNumber} D{data[tooltip.index].dayNumber}: {data[tooltip.index].label}
          </div>
        </div>
      )}
    </div>
  );
}

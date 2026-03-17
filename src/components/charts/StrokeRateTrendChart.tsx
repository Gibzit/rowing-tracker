import { useState } from 'react';
import type { StrokeRateDataPoint } from '../../utils/strokeRateUtils';

interface StrokeRateTrendChartProps {
  data: StrokeRateDataPoint[];
}

const CATEGORY_COLORS: Record<string, { stroke: string; fill: string }> = {
  distance: { stroke: '#14b8a6', fill: '#14b8a6' },
  interval: { stroke: '#f59e0b', fill: '#f59e0b' },
  time: { stroke: '#10b981', fill: '#10b981' },
};

const PADDING = { top: 20, right: 20, bottom: 30, left: 50 };
const CHART_WIDTH = 340;
const CHART_HEIGHT = 200;

export default function StrokeRateTrendChart({ data }: StrokeRateTrendChartProps) {
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);

  if (data.length === 0) return null;

  const rates = data.map((d) => d.strokeRate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const rateRange = maxRate - minRate || 10;
  const padded = rateRange * 0.1;

  const yMin = minRate - padded;
  const yMax = maxRate + padded;

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const xScale = (i: number) =>
    PADDING.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);

  // Y is NOT inverted: higher stroke rate = higher on chart
  const yScale = (rate: number) =>
    PADDING.top + ((yMax - rate) / (yMax - yMin)) * innerH;

  // Grid lines (4 horizontal)
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const rate = yMin + (i / gridCount) * (yMax - yMin);
    return { y: yScale(rate), label: Math.round(rate).toString() };
  });

  // Line path
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.strokeRate)}`)
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
              className="text-gray-200 dark:text-[#1e3a5f]"
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
          className="text-gray-300 dark:text-[#2a4a6b]"
        />

        {/* Line */}
        {data.length > 1 && (
          <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" />
        )}

        {/* Data points */}
        {data.map((d, i) => {
          const color = CATEGORY_COLORS[d.category] || CATEGORY_COLORS.distance;
          return (
            <circle
              key={i}
              cx={xScale(i)}
              cy={yScale(d.strokeRate)}
              r={tooltip?.index === i ? 6 : 4}
              fill={color.fill}
              stroke="white"
              strokeWidth="1.5"
              className="cursor-pointer"
              onPointerEnter={() => setTooltip({ index: i, x: xScale(i), y: yScale(d.strokeRate) })}
              onPointerLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* Touch targets (invisible larger circles) */}
        {data.map((d, i) => (
          <circle
            key={`touch-${i}`}
            cx={xScale(i)}
            cy={yScale(d.strokeRate)}
            r={12}
            fill="transparent"
            onPointerEnter={() =>
              setTooltip({ index: i, x: xScale(i), y: yScale(d.strokeRate) })
            }
            onPointerLeave={() => setTooltip(null)}
          />
        ))}

        {/* Higher label */}
        <text
          x={PADDING.left - 6}
          y={PADDING.top - 6}
          textAnchor="end"
          fontSize="8"
          fill="currentColor"
          className="text-purple-500"
        >
          Higher
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
          <div className="font-medium">{data[tooltip.index].strokeRate} spm</div>
          <div className="opacity-75">
            W{data[tooltip.index].weekNumber} D{data[tooltip.index].dayNumber}: {data[tooltip.index].label}
          </div>
        </div>
      )}
    </div>
  );
}

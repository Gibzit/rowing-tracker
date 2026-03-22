import { useState } from 'react';
import type { PaceDataPoint } from '../../utils/paceUtils';
import { secondsToPace } from '../../utils/paceUtils';

interface PaceTrendChartProps {
  data: PaceDataPoint[];
}

const CATEGORY_COLORS: Record<string, { stroke: string; fill: string }> = {
  distance: { stroke: '#B8941F', fill: '#B8941F' },
  interval: { stroke: '#2E86AB', fill: '#2E86AB' },
  time: { stroke: '#45A868', fill: '#45A868' },
};

const PADDING = { top: 20, right: 20, bottom: 30, left: 50 };
const CHART_WIDTH = 340;
const CHART_HEIGHT = 220;

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

  // Area path (line + close to bottom)
  const areaPath = linePath + ` L ${xScale(data.length - 1)} ${CHART_HEIGHT - PADDING.bottom} L ${xScale(0)} ${CHART_HEIGHT - PADDING.bottom} Z`;

  return (
    <div className="relative -mx-1">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        style={{ maxHeight: 280 }}
      >
        <defs>
          <linearGradient id="paceAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="paceLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#007ea0" />
            <stop offset="50%" stopColor="#00d2ff" />
            <stop offset="100%" stopColor="#a5e7ff" />
          </linearGradient>
        </defs>

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
              className="text-gray-200 dark:text-[#1a2640]"
              strokeDasharray="4 4"
            />
            <text
              x={PADDING.left - 8}
              y={g.y + 3}
              textAnchor="end"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              fill="currentColor"
              className="text-gray-400 dark:text-[#5a6580]"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {data.length > 1 && (
          <path d={areaPath} fill="url(#paceAreaGrad)" />
        )}

        {/* Line */}
        {data.length > 1 && (
          <path d={linePath} fill="none" stroke="url(#paceLineGrad)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* Data points */}
        {data.map((d, i) => {
          const color = CATEGORY_COLORS[d.category] || CATEGORY_COLORS.distance;
          const isHovered = tooltip?.index === i;
          return (
            <g key={i}>
              {isHovered && (
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.paceSeconds)}
                  r={10}
                  fill={color.fill}
                  opacity={0.15}
                />
              )}
              <circle
                cx={xScale(i)}
                cy={yScale(d.paceSeconds)}
                r={isHovered ? 6 : 4}
                fill={color.fill}
                stroke="#0f1b33"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-150"
                onPointerEnter={() => setTooltip({ index: i, x: xScale(i), y: yScale(d.paceSeconds) })}
                onPointerLeave={() => setTooltip(null)}
              />
            </g>
          );
        })}

        {/* Touch targets (invisible larger circles) */}
        {data.map((d, i) => (
          <circle
            key={`touch-${i}`}
            cx={xScale(i)}
            cy={yScale(d.paceSeconds)}
            r={14}
            fill="transparent"
            onPointerEnter={() =>
              setTooltip({ index: i, x: xScale(i), y: yScale(d.paceSeconds) })
            }
            onPointerLeave={() => setTooltip(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && data[tooltip.index] && (
        <div
          className="absolute bg-[#1a2640] dark:bg-[#222a3d] text-[#dae2fd] text-xs rounded-xl px-3 py-2 pointer-events-none shadow-xl z-10 border border-white/[0.06]"
          style={{
            left: `${(tooltip.x / CHART_WIDTH) * 100}%`,
            top: `${(tooltip.y / CHART_HEIGHT) * 100 - 16}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-mono font-bold text-[#00d2ff]">{secondsToPace(data[tooltip.index].paceSeconds)}/500m</div>
          <div className="text-[#5a6580] text-[10px] mt-0.5">
            W{data[tooltip.index].weekNumber} D{data[tooltip.index].dayNumber}
          </div>
        </div>
      )}
    </div>
  );
}

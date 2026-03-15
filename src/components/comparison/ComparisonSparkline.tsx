import type { WorkoutEntry } from '../../utils/workoutGrouping';

interface ComparisonSparklineProps {
  entries: WorkoutEntry[];
}

export default function ComparisonSparkline({ entries }: ComparisonSparklineProps) {
  if (entries.length < 2) return null;

  const paces = entries.map((e) => e.paceSeconds);
  const min = Math.min(...paces);
  const max = Math.max(...paces);
  const range = max - min || 1;

  const width = 260;
  const height = 50;
  const padding = 8;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = entries.map((e, i) => {
    const x = padding + (i / (entries.length - 1)) * innerW;
    // Inverted: lower pace = higher on chart
    const y = padding + ((e.paceSeconds - min) / range) * innerH;
    return { x, y };
  });

  const isImproving = entries[entries.length - 1].paceSeconds <= entries[0].paceSeconds;
  const lineColor = isImproving ? '#22c55e' : '#ef4444';

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 50 }}>
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={lineColor} />
      ))}
    </svg>
  );
}

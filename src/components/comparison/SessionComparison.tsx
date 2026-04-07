import type { SessionRecord } from '../../utils/storage';
import type { SessionDescriptor } from '../../data/trainingPlan';
import { parseDistance, parseTime } from '../../utils/pacePredictor';
import { paceToSeconds } from '../../utils/paceUtils';

interface SessionComparisonProps {
  leftSession: SessionRecord;
  rightSession: SessionRecord;
  leftDescriptor: SessionDescriptor;
  rightDescriptor: SessionDescriptor;
  onClear: () => void;
}

function deriveDistance(desc: SessionDescriptor, record: SessionRecord): number | null {
  const parsed = parseDistance(desc.label);
  if (parsed !== null) return parsed;
  if (record.pace && record.totalTime) {
    const paceSec = paceToSeconds(record.pace);
    const timeSec = parseTime(record.totalTime);
    if (paceSec && paceSec > 0 && timeSec && timeSec > 0) {
      return Math.round((timeSec / paceSec) * 500);
    }
  }
  return null;
}

function formatDistance(meters: number): string {
  return `${meters.toLocaleString('en')}m`;
}

type HighlightRule = 'lower' | 'higher' | 'none';

interface MetricRow {
  label: string;
  leftValue: string;
  rightValue: string;
  leftRaw: number | null;
  rightRaw: number | null;
  highlight: HighlightRule;
}

function buildMetrics(
  left: SessionRecord,
  right: SessionRecord,
  leftDesc: SessionDescriptor,
  rightDesc: SessionDescriptor
): MetricRow[] {
  const leftPace = left.pace ? paceToSeconds(left.pace) : null;
  const rightPace = right.pace ? paceToSeconds(right.pace) : null;
  const leftDist = deriveDistance(leftDesc, left);
  const rightDist = deriveDistance(rightDesc, right);

  return [
    {
      label: 'Pace /500m',
      leftValue: left.pace || '—',
      rightValue: right.pace || '—',
      leftRaw: leftPace,
      rightRaw: rightPace,
      highlight: 'lower',
    },
    {
      label: 'Total Time',
      leftValue: left.totalTime || '—',
      rightValue: right.totalTime || '—',
      leftRaw: left.totalTime ? parseTime(left.totalTime) : null,
      rightRaw: right.totalTime ? parseTime(right.totalTime) : null,
      highlight: 'none',
    },
    {
      label: 'Distance',
      leftValue: leftDist !== null ? formatDistance(leftDist) : '—',
      rightValue: rightDist !== null ? formatDistance(rightDist) : '—',
      leftRaw: leftDist,
      rightRaw: rightDist,
      highlight: 'higher',
    },
    {
      label: 'Stroke Rate',
      leftValue: left.strokeRate ? `${left.strokeRate} spm` : '—',
      rightValue: right.strokeRate ? `${right.strokeRate} spm` : '—',
      leftRaw: left.strokeRate ?? null,
      rightRaw: right.strokeRate ?? null,
      highlight: 'none',
    },
    {
      label: 'Power Level',
      leftValue: left.dragFactor ? `${left.dragFactor}` : '—',
      rightValue: right.dragFactor ? `${right.dragFactor}` : '—',
      leftRaw: left.dragFactor ?? null,
      rightRaw: right.dragFactor ?? null,
      highlight: 'none',
    },
    {
      label: 'RPE',
      leftValue: left.rpe ? `${left.rpe}` : '—',
      rightValue: right.rpe ? `${right.rpe}` : '—',
      leftRaw: left.rpe ?? null,
      rightRaw: right.rpe ?? null,
      highlight: 'none',
    },
  ];
}

function getHighlight(
  leftRaw: number | null,
  rightRaw: number | null,
  rule: HighlightRule
): { left: boolean; right: boolean } {
  if (rule === 'none' || leftRaw === null || rightRaw === null) return { left: false, right: false };
  if (leftRaw === rightRaw) return { left: false, right: false };
  if (rule === 'lower') return { left: leftRaw < rightRaw, right: rightRaw < leftRaw };
  return { left: leftRaw > rightRaw, right: rightRaw > leftRaw };
}

function sessionLabel(desc: SessionDescriptor): string {
  return `W${desc.weekNumber} D${desc.dayNumber} · ${desc.label}`;
}

export default function SessionComparison({
  leftSession,
  rightSession,
  leftDescriptor,
  rightDescriptor,
  onClear,
}: SessionComparisonProps) {
  const metrics = buildMetrics(leftSession, rightSession, leftDescriptor, rightDescriptor);

  return (
    <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-[#0f1b33] border border-gray-100 dark:border-white/[0.06]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex gap-4">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
              {sessionLabel(leftDescriptor)}
            </span>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
              {sessionLabel(rightDescriptor)}
            </span>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 dark:text-[#5a6580] hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 touch-manipulation"
          aria-label="Clear comparison"
        >
          ✕ Clear
        </button>
      </div>

      {/* Metric rows */}
      <div className="flex flex-col gap-3">
        {metrics.map((row) => {
          const hl = getHighlight(row.leftRaw, row.rightRaw, row.highlight);
          return (
            <div key={row.label} className="flex items-center">
              <span
                className={`flex-1 text-sm font-mono text-right ${
                  hl.left
                    ? 'text-teal-600 dark:text-[#00d2ff] font-bold'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {row.leftValue}
              </span>
              <span className="w-24 text-center text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase tracking-wider shrink-0">
                {row.label}
              </span>
              <span
                className={`flex-1 text-sm font-mono ${
                  hl.right
                    ? 'text-teal-600 dark:text-[#00d2ff] font-bold'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {row.rightValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import type { SessionRecord } from '../../utils/storage';
import type { SessionDescriptor } from '../../data/trainingPlan';
import { computeWeeklyVolume } from '../../utils/volumeCalc';
import VolumeChart from '../comparison/VolumeChart';
import SessionComparison from '../comparison/SessionComparison';

interface ComparisonViewProps {
  sessions: Record<string, SessionRecord>;
  plan: SessionDescriptor[];
  compareSlots: [string | null, string | null];
  onClearCompare: () => void;
  currentWeek: number;
}

function formatMeters(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
  }
  return `${value}m`;
}

function formatMinutes(value: number): string {
  return `${Math.round(value)} min`;
}

export default function ComparisonView({
  sessions,
  plan,
  compareSlots,
  onClearCompare,
  currentWeek,
}: ComparisonViewProps) {
  const weeklyVolume = useMemo(() => computeWeeklyVolume(sessions, plan), [sessions, plan]);

  const currentWeekVolume = useMemo(
    () => weeklyVolume.find((w) => w.weekNumber === currentWeek),
    [weeklyVolume, currentWeek]
  );

  const metersData = useMemo(
    () => weeklyVolume.map((w) => ({ weekNumber: w.weekNumber, value: w.totalMeters })),
    [weeklyVolume]
  );

  const timeData = useMemo(
    () => weeklyVolume.map((w) => ({ weekNumber: w.weekNumber, value: w.totalMinutes })),
    [weeklyVolume]
  );

  const comparison = useMemo(() => {
    if (!compareSlots[0] || !compareSlots[1]) return null;
    const leftRecord = sessions[compareSlots[0]];
    const rightRecord = sessions[compareSlots[1]];
    if (!leftRecord?.completed || !rightRecord?.completed) return null;
    const leftDesc = plan.find((d) => `${d.weekNumber}-${d.dayNumber}` === compareSlots[0]);
    const rightDesc = plan.find((d) => `${d.weekNumber}-${d.dayNumber}` === compareSlots[1]);
    if (!leftDesc || !rightDesc) return null;
    return { leftRecord, rightRecord, leftDesc, rightDesc };
  }, [compareSlots, sessions, plan]);

  return (
    <div className="px-5 py-6">
      <h2 className="font-display text-2xl font-bold text-gray-800 dark:text-[#dae2fd] mb-1">
        Training Volume
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Weekly meters and time logged
      </p>

      {weeklyVolume.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1a2640] flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-gray-400 dark:text-[#5a6580]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 15h18M9 3v18" />
            </svg>
          </div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            No volume data yet
          </p>
          <p className="text-xs text-gray-400 dark:text-[#5a6580] mt-1">
            Complete sessions to see training volume
          </p>
        </div>
      ) : (
        <>
          {currentWeekVolume && (
            <div className="text-sm font-mono text-gray-600 dark:text-gray-300 mb-4">
              <span className="font-bold">W{currentWeek}:</span>{' '}
              {currentWeekVolume.totalMeters > 0 && (
                <span>{formatMeters(currentWeekVolume.totalMeters)}</span>
              )}
              {currentWeekVolume.totalMeters > 0 && currentWeekVolume.totalMinutes > 0 && (
                <span> · </span>
              )}
              {currentWeekVolume.totalMinutes > 0 && (
                <span>{formatMinutes(currentWeekVolume.totalMinutes)}</span>
              )}
            </div>
          )}

          <VolumeChart
            data={metersData}
            color="bg-teal-500 dark:bg-[#00d2ff]"
            currentWeek={currentWeek}
            formatValue={formatMeters}
            label="Meters"
          />
          <VolumeChart
            data={timeData}
            color="bg-amber-500 dark:bg-amber-400"
            currentWeek={currentWeek}
            formatValue={formatMinutes}
            label="Time"
          />
        </>
      )}

      {comparison && (
        <SessionComparison
          leftSession={comparison.leftRecord}
          rightSession={comparison.rightRecord}
          leftDescriptor={comparison.leftDesc}
          rightDescriptor={comparison.rightDesc}
          onClear={onClearCompare}
        />
      )}
    </div>
  );
}

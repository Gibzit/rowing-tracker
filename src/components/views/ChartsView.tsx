import { useState, useMemo } from 'react';
import type { SessionRecord } from '../../utils/storage';
import type { WorkoutCategory } from '../../utils/paceUtils';
import { extractPaceData } from '../../utils/paceUtils';
import { extractStrokeRateData } from '../../utils/strokeRateUtils';
import type { SessionDescriptor } from '../../data/trainingPlan';
import ChartFilterBar from '../charts/ChartFilterBar';
import PaceTrendChart from '../charts/PaceTrendChart';
import StrokeRateTrendChart from '../charts/StrokeRateTrendChart';
import EmptyState from '../EmptyState';

type FilterOption = 'all' | WorkoutCategory;

interface ChartsViewProps {
  sessions: Record<string, SessionRecord>;
  plan: SessionDescriptor[];
  onGoToTraining?: () => void;
}

export default function ChartsView({ sessions, plan, onGoToTraining }: ChartsViewProps) {
  const [filter, setFilter] = useState<FilterOption>('all');

  const allPaceData = useMemo(() => extractPaceData(sessions, plan), [sessions, plan]);
  const allSRData = useMemo(() => extractStrokeRateData(sessions, plan), [sessions, plan]);

  const filteredPace = useMemo(
    () => (filter === 'all' ? allPaceData : allPaceData.filter((d) => d.category === filter)),
    [allPaceData, filter]
  );

  const filteredSR = useMemo(
    () => (filter === 'all' ? allSRData : allSRData.filter((d) => d.category === filter)),
    [allSRData, filter]
  );

  const legend = (
    <div className="px-4 mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Distance
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Interval
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Time
      </span>
    </div>
  );

  const hasAnyData = filteredPace.length > 0 || filteredSR.length > 0;

  return (
    <div className="py-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 px-4 mb-3">Pace Trends</h2>
      <ChartFilterBar active={filter} onChange={setFilter} />

      {!hasAnyData ? (
        <EmptyState
          icon="📈"
          title="No pace data yet"
          description="Log pace data on your sessions to see trends here."
          actionLabel="Go to Training"
          onAction={onGoToTraining}
        />
      ) : (
        <>
          {filteredPace.length > 0 && (
            <>
              <PaceTrendChart data={filteredPace} />
              {legend}
            </>
          )}

          {filteredSR.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 px-4 mb-3 mt-6">
                Stroke Rate Trends
              </h2>
              <StrokeRateTrendChart data={filteredSR} />
              {legend}
            </>
          )}
        </>
      )}
    </div>
  );
}

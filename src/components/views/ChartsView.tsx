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
    <div className="px-4 mt-2 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-[#B8941F] inline-block" /> Distance
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-[#2E86AB] inline-block" /> Interval
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-[#45A868] inline-block" /> Time
      </span>
    </div>
  );

  const hasAnyData = filteredPace.length > 0 || filteredSR.length > 0;

  return (
    <div className="py-4">
      <h2 className="text-sm font-extrabold text-gray-800 dark:text-gray-100 px-4 mb-3 uppercase tracking-wide">Pace Trends</h2>
      <ChartFilterBar active={filter} onChange={setFilter} />

      {!hasAnyData ? (
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
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
              <h2 className="text-sm font-extrabold text-gray-800 dark:text-gray-100 px-4 mb-3 uppercase tracking-wide mt-6">
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

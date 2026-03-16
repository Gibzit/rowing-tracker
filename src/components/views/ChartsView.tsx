import { useState, useMemo } from 'react';
import type { SessionRecord } from '../../utils/storage';
import type { WorkoutCategory } from '../../utils/paceUtils';
import { extractPaceData } from '../../utils/paceUtils';
import type { SessionDescriptor } from '../../data/trainingPlan';
import ChartFilterBar from '../charts/ChartFilterBar';
import PaceTrendChart from '../charts/PaceTrendChart';

type FilterOption = 'all' | WorkoutCategory;

interface ChartsViewProps {
  sessions: Record<string, SessionRecord>;
  plan: SessionDescriptor[];
}

export default function ChartsView({ sessions, plan }: ChartsViewProps) {
  const [filter, setFilter] = useState<FilterOption>('all');

  const allData = useMemo(() => extractPaceData(sessions, plan), [sessions, plan]);

  const filtered = useMemo(
    () => (filter === 'all' ? allData : allData.filter((d) => d.category === filter)),
    [allData, filter]
  );

  return (
    <div className="py-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 px-4 mb-3">Pace Trends</h2>
      <ChartFilterBar active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">No pace data yet</p>
          <p className="text-sm">
            Log pace data on your sessions to see trends here.
          </p>
        </div>
      ) : (
        <>
          <PaceTrendChart data={filtered} />
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
        </>
      )}
    </div>
  );
}

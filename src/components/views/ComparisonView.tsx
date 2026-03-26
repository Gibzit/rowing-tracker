import { useState, useMemo } from 'react';
import type { SessionRecord } from '../../utils/storage';
import { groupWorkouts } from '../../utils/workoutGrouping';
import type { SessionDescriptor } from '../../data/trainingPlan';
import ComparisonSparkline from '../comparison/ComparisonSparkline';
import ComparisonTable from '../comparison/ComparisonTable';
import EmptyState from '../EmptyState';

interface ComparisonViewProps {
  sessions: Record<string, SessionRecord>;
  plan: SessionDescriptor[];
  onGoToTraining?: () => void;
}

export default function ComparisonView({ sessions, plan, onGoToTraining }: ComparisonViewProps) {
  const groups = useMemo(() => groupWorkouts(sessions, plan), [sessions, plan]);
  const [selected, setSelected] = useState<string>('');

  const activeGroup = groups.find((g) => g.label === selected) || groups[0] || null;

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-7 h-7 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5" />
            <path d="M8 3H3v5" />
            <path d="M21 3l-7 7" />
            <path d="M3 3l7 7" />
            <path d="M16 21h5v-5" />
            <path d="M8 21H3v-5" />
            <path d="M21 21l-7-7" />
            <path d="M3 21l7-7" />
          </svg>
        }
        title="No comparisons yet"
        description="Complete the same workout type at least twice with pace data to compare results here."
        actionLabel="Go to Training"
        onAction={onGoToTraining}
      />
    );
  }

  return (
    <div className="py-4 px-4">
      <h2 className="text-sm font-extrabold text-gray-800 dark:text-[#dae2fd] mb-3 uppercase tracking-wide">Workout Comparison</h2>

      <select
        aria-label="Select workout type to compare"
        value={activeGroup?.label || ''}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] dark:bg-[#0f1b33] dark:text-[#dae2fd] rounded-lg text-sm font-mono min-h-[44px] mb-4"
      >
        {groups.map((g) => (
          <option key={g.label} value={g.label}>
            {g.label} ({g.entries.length} sessions)
          </option>
        ))}
      </select>

      {activeGroup && (
        <>
          <ComparisonSparkline entries={activeGroup.entries} />
          <div className="mt-3">
            <ComparisonTable group={activeGroup} />
          </div>
        </>
      )}
    </div>
  );
}

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
}

export default function ComparisonView({ sessions, plan }: ComparisonViewProps) {
  const groups = useMemo(() => groupWorkouts(sessions, plan), [sessions, plan]);
  const [selected, setSelected] = useState<string>('');

  const activeGroup = groups.find((g) => g.label === selected) || groups[0] || null;

  if (groups.length === 0) {
    return (
      <EmptyState
        icon="⚖️"
        title="No comparisons yet"
        description="Complete the same workout type at least twice with pace data to compare results here."
      />
    );
  }

  return (
    <div className="py-4 px-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Workout Comparison</h2>

      <select
        value={activeGroup?.label || ''}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a4a6b] dark:bg-[#0f2438] dark:text-gray-100 rounded-lg text-base min-h-[44px] mb-4"
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

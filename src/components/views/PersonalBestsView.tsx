import { useMemo } from 'react';
import type { SessionRecord } from '../../utils/storage';
import { computePersonalBests } from '../../utils/personalBests';
import type { SessionDescriptor } from '../../data/trainingPlan';

interface PersonalBestsViewProps {
  sessions: Record<string, SessionRecord>;
  plan: SessionDescriptor[];
}

export default function PersonalBestsView({ sessions, plan }: PersonalBestsViewProps) {
  const pbs = useMemo(() => computePersonalBests(sessions, plan), [sessions, plan]);

  return (
    <div className="py-4 px-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Personal Bests</h2>

      {pbs.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">No personal bests yet</p>
          <p className="text-sm">Log pace data on your sessions to track personal bests here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {pbs.map((pb) => (
            <div
              key={pb.label}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 border-t-2 border-t-amber-400"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {pb.label}
                </span>
                <span className="text-amber-500 text-sm ml-1">🏆</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{pb.paceFormatted}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Week {pb.weekNumber}, Day {pb.dayNumber}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

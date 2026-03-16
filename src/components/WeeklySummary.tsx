import { useMemo } from 'react';
import type { SessionDescriptor } from '../data/trainingPlan';
import type { SessionRecord } from '../utils/storage';
import { paceToSeconds, secondsToPace } from '../utils/paceUtils';

interface WeeklySummaryProps {
  weekNumber: number;
  sessions: SessionDescriptor[];
  getSession: (week: number, day: number) => SessionRecord;
}

export default function WeeklySummary({ weekNumber, sessions, getSession }: WeeklySummaryProps) {
  const stats = useMemo(() => {
    const coreCount = sessions.filter((s) => !s.isOptional).length;
    let completedCount = 0;
    let paceSum = 0;
    let paceCount = 0;
    let bestPaceSeconds = Infinity;

    for (const desc of sessions) {
      const record = getSession(desc.weekNumber, desc.dayNumber);
      if (record.completed) completedCount++;
      if (record.pace) {
        const seconds = paceToSeconds(record.pace);
        if (seconds !== null) {
          paceSum += seconds;
          paceCount++;
          if (seconds < bestPaceSeconds) bestPaceSeconds = seconds;
        }
      }
    }

    return {
      completedCount,
      totalCount: coreCount,
      avgPace: paceCount > 0 ? secondsToPace(paceSum / paceCount) : null,
      bestPace: bestPaceSeconds < Infinity ? secondsToPace(bestPaceSeconds) : null,
      sessionsWithPace: paceCount,
    };
  }, [sessions, getSession]);

  if (stats.completedCount === 0) return null;

  return (
    <div className="mx-4 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-[#0f2438] border border-gray-200 dark:border-[#1e3a5f]">
      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
        Week {weekNumber} Summary
      </h3>
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
        <div className="flex items-center gap-2">
          <span className="text-green-500 dark:text-green-400 text-sm">✓</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {stats.completedCount} / {stats.totalCount} sessions
          </span>
        </div>
        {stats.sessionsWithPace > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-teal-500 dark:text-teal-400 text-sm">⏱</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {stats.sessionsWithPace} paced
            </span>
          </div>
        )}
        {stats.avgPace && (
          <div className="flex items-center gap-2">
            <span className="text-cyan-500 dark:text-cyan-400 text-sm">⊘</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Avg {stats.avgPace}/500m
            </span>
          </div>
        )}
        {stats.bestPace && (
          <div className="flex items-center gap-2">
            <span className="text-amber-500 dark:text-amber-400 text-sm">⚡</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Best {stats.bestPace}/500m
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

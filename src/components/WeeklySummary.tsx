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

  const allComplete = stats.completedCount >= stats.totalCount;

  return (
    <div className={`mx-4 mb-3 p-3.5 rounded-xl border transition-colors ${
      allComplete
        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50'
        : 'bg-white dark:bg-[#0f2438] border-gray-200 dark:border-[#1e3a5f]'
    }`}>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Week {weekNumber} Summary
        </h3>
        {allComplete && (
          <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
            Complete!
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {stats.completedCount} / {stats.totalCount}
          </span>
        </div>
        {stats.sessionsWithPace > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-teal-600 dark:text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {stats.sessionsWithPace} paced
            </span>
          </div>
        )}
        {stats.avgPace && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-cyan-600 dark:text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Avg {stats.avgPace}/500m
            </span>
          </div>
        )}
        {stats.bestPace && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Best {stats.bestPace}/500m
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

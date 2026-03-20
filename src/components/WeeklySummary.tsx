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
    let completedOptionalCount = 0;
    let paceSum = 0;
    let paceCount = 0;
    let bestPaceSeconds = Infinity;

    for (const desc of sessions) {
      const record = getSession(desc.weekNumber, desc.dayNumber);
      if (record.completed) {
        completedCount++;
        if (desc.isOptional) completedOptionalCount++;
      }
      if (record.pace) {
        const seconds = paceToSeconds(record.pace);
        if (seconds !== null) {
          paceSum += seconds;
          paceCount++;
          if (seconds < bestPaceSeconds) bestPaceSeconds = seconds;
        }
      }
    }

    const totalCount = coreCount + completedOptionalCount;

    return {
      completedCount,
      totalCount,
      avgPace: paceCount > 0 ? secondsToPace(paceSum / paceCount) : null,
      bestPace: bestPaceSeconds < Infinity ? secondsToPace(bestPaceSeconds) : null,
      sessionsWithPace: paceCount,
    };
  }, [sessions, getSession]);

  if (stats.completedCount === 0) return null;

  const allComplete = stats.completedCount >= stats.totalCount;

  return (
    <div className={`mx-5 mb-5 p-5 rounded-2xl transition-colors ${
      allComplete
        ? 'bg-green-50 dark:bg-green-950/20'
        : 'bg-white dark:bg-[#0f1b33]'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase" style={{ letterSpacing: '0.08em' }}>
          Week {weekNumber} Summary
        </h3>
        {allComplete && (
          <span className="text-[9px] font-bold bg-green-500/10 dark:bg-green-400/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Complete
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase mb-1" style={{ letterSpacing: '0.08em' }}>Sessions</p>
          <p className="text-2xl font-display font-extrabold text-gray-800 dark:text-[#dae2fd]">
            {stats.completedCount}<span className="text-base font-normal text-gray-400 dark:text-[#5a6580]">/{stats.totalCount}</span>
          </p>
        </div>
        {stats.sessionsWithPace > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase mb-1" style={{ letterSpacing: '0.08em' }}>Paced</p>
            <p className="text-2xl font-display font-extrabold text-gray-800 dark:text-[#dae2fd]">
              {stats.sessionsWithPace}
            </p>
          </div>
        )}
        {stats.avgPace && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase mb-1" style={{ letterSpacing: '0.08em' }}>Avg Split</p>
            <p className="text-2xl font-mono font-bold text-gray-800 dark:text-[#dae2fd]">
              {stats.avgPace}<span className="text-base font-normal text-gray-400 dark:text-[#5a6580]">/500</span>
            </p>
          </div>
        )}
        {stats.bestPace && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase mb-1" style={{ letterSpacing: '0.08em' }}>Best Split</p>
            <p className="text-2xl font-mono font-bold text-[#00d2ff]">
              {stats.bestPace}<span className="text-base font-normal text-[#5a6580]">/500</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

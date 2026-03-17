import { useMemo } from 'react';
import type { SessionRecord } from '../../utils/storage';
import { computePersonalBests } from '../../utils/personalBests';
import type { SessionDescriptor } from '../../data/trainingPlan';
import EmptyState from '../EmptyState';

interface PersonalBestsViewProps {
  sessions: Record<string, SessionRecord>;
  plan: SessionDescriptor[];
  onGoToTraining?: () => void;
}

function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } catch {
    return '';
  }
}

export default function PersonalBestsView({ sessions, plan, onGoToTraining }: PersonalBestsViewProps) {
  const pbs = useMemo(() => computePersonalBests(sessions, plan), [sessions, plan]);

  return (
    <div className="py-4 px-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Personal Bests</h2>

      {pbs.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No personal bests yet"
          description="Log pace data on your sessions to track personal bests here."
          actionLabel="Go to Training"
          onAction={onGoToTraining}
        />
      ) : (
        <div className="space-y-3">
          {pbs.map((pb) => (
            <div
              key={pb.label}
              className="bg-white dark:bg-[#0f2438] border border-gray-200 dark:border-[#1e3a5f] rounded-xl p-4 border-l-4 border-l-amber-400 dark:border-l-amber-500 hover:shadow-md dark:hover:shadow-black/30 transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-500 text-base">🏆</span>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">
                      {pb.label}
                    </span>
                    {pb.sessionCount > 1 && (
                      <span className="text-[10px] font-medium bg-gray-100 dark:bg-[#1a3550] text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full shrink-0">
                        {pb.sessionCount} sessions
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    {pb.paceFormatted}
                    <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">/500m</span>
                  </p>
                </div>

                {/* Improvement indicator */}
                {pb.improvementPct !== undefined && pb.sessionCount > 1 && pb.improvementPct < 0 && (
                  <div className="text-right shrink-0 ml-3 text-green-600 dark:text-green-400">
                    <div className="flex items-center gap-1 justify-end">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-bold">
                        {Math.abs(pb.improvementPct)}% faster
                      </span>
                    </div>
                    <p className="text-[10px] mt-0.5">vs avg pace</p>
                  </div>
                )}
              </div>

              {/* Details row */}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 dark:border-[#1e3a5f]">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Week {pb.weekNumber}, Day {pb.dayNumber}
                </span>
                {pb.completedDate && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatRelativeDate(pb.completedDate)}
                  </span>
                )}
                {pb.avgPaceFormatted && pb.sessionCount > 1 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                    Avg: {pb.avgPaceFormatted}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

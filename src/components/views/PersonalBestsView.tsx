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

function formatActualDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function PersonalBestsView({ sessions, plan, onGoToTraining }: PersonalBestsViewProps) {
  const pbs = useMemo(() => computePersonalBests(sessions, plan), [sessions, plan]);

  return (
    <div className="py-4 px-4">
      <h2 className="text-sm font-extrabold text-gray-800 dark:text-[#dae2fd] mb-4 uppercase tracking-wide">Personal Bests</h2>

      {pbs.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
              <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0012 0V2Z" />
            </svg>
          }
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
              className="bg-white dark:bg-[#0f1b33] border border-gray-200 dark:border-white/[0.06] rounded-lg p-4 hover:shadow-md dark:hover:shadow-black/30 transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
                      <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                      <path d="M18 2H6v7a6 6 0 0012 0V2Z" />
                    </svg>
                    <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider">
                      {pb.label}
                    </span>
                    {pb.sessionCount > 1 && (
                      <span className="text-[10px] font-bold font-mono bg-gray-100 dark:bg-[#1a2640] text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded shrink-0">
                        {pb.sessionCount} sessions
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-mono font-bold text-gray-900 dark:text-[#dae2fd] tracking-tight">
                    {pb.paceFormatted}
                    <span className="text-sm font-normal text-gray-400 dark:text-[#5a6580] ml-1">/500m</span>
                  </p>
                </div>

                {/* Improvement indicator */}
                {pb.improvementPct !== undefined && pb.sessionCount > 1 && pb.improvementPct < 0 && (
                  <div className="text-right shrink-0 ml-3 text-green-600 dark:text-green-400">
                    <div className="flex items-center gap-1 justify-end">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-mono font-bold">
                        {Math.abs(pb.improvementPct)}% faster
                      </span>
                    </div>
                    <p className="text-[10px] mt-0.5">vs avg pace</p>
                  </div>
                )}
              </div>

              {/* Details row */}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                {pb.completedDate && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-gray-400 dark:text-[#5a6580] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                      {formatActualDate(pb.completedDate)}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-[#5a6580]">
                      ({formatRelativeDate(pb.completedDate)})
                    </span>
                  </div>
                )}
                {pb.avgPaceFormatted && pb.sessionCount > 1 && (
                  <span className="text-xs text-gray-400 dark:text-[#5a6580] ml-auto">
                    Avg: <span className="font-mono font-bold">{pb.avgPaceFormatted}</span>
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

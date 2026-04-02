import { useState, useMemo } from 'react';
import type { SessionRecord } from '../../utils/storage';
import type { WorkoutCategory } from '../../utils/paceUtils';
import { extractPaceData, secondsToPace } from '../../utils/paceUtils';
import { extractStrokeRateData } from '../../utils/strokeRateUtils';
import type { SessionDescriptor } from '../../data/trainingPlan';
import ChartFilterBar from '../charts/ChartFilterBar';
import PaceTrendChart from '../charts/PaceTrendChart';
import StrokeRateTrendChart from '../charts/StrokeRateTrendChart';
import EmptyState from '../EmptyState';
import RacePredictions from '../RacePredictions';

type FilterOption = 'all' | WorkoutCategory;

interface ChartsViewProps {
  sessions: Record<string, SessionRecord>;
  plan: SessionDescriptor[];
  onGoToTraining?: () => void;
}

export default function ChartsView({ sessions, plan, onGoToTraining }: ChartsViewProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [showRpe, setShowRpe] = useState(false);

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

  // Compute summary stats
  const stats = useMemo(() => {
    if (filteredPace.length === 0) return null;
    const paces = filteredPace.map((d) => d.paceSeconds);
    const best = Math.min(...paces);
    const avg = paces.reduce((a, b) => a + b, 0) / paces.length;
    return {
      totalSessions: filteredPace.length,
      bestPace: secondsToPace(best),
      avgPace: secondsToPace(avg),
    };
  }, [filteredPace]);

  // Stroke rate summary
  const srStats = useMemo(() => {
    if (filteredSR.length === 0) return null;
    const rates = filteredSR.map((d) => d.strokeRate);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const latest = rates[rates.length - 1];
    return { avgRate: Math.round(avg), latestRate: latest, totalSessions: filteredSR.length };
  }, [filteredSR]);

  const legend = (
    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#5a6580] mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#B8941F] inline-block" /> Distance
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#2E86AB] inline-block" /> Interval
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#45A868] inline-block" /> Time
      </span>
    </div>
  );

  const hasAnyData = filteredPace.length > 0 || filteredSR.length > 0;

  return (
    <div className="py-6 px-5">
      {/* Editorial header */}
      <h2 className="font-display text-2xl font-extrabold text-gray-800 dark:text-[#dae2fd] mb-1">
        Performance Analytics
      </h2>
      <p className="text-xs text-gray-400 dark:text-[#5a6580] mb-5">
        Track your rowing progress over time
      </p>

      {/* Filter bar */}
      <ChartFilterBar active={filter} onChange={setFilter} />

      {!hasAnyData ? (
        <div className="mt-4">
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
        </div>
      ) : (
        <>
          {/* Top summary metrics */}
          {stats && (
            <div className="flex gap-4 mt-5 mb-5">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase mb-1" style={{ letterSpacing: '0.08em' }}>Total Sessions</p>
                <p className="text-3xl font-display font-extrabold text-gray-800 dark:text-[#dae2fd]">
                  {stats.totalSessions}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase mb-1" style={{ letterSpacing: '0.08em' }}>Avg Split</p>
                <p className="text-3xl font-mono font-bold text-gray-800 dark:text-[#dae2fd]">
                  {stats.avgPace}
                  <span className="text-sm font-normal text-gray-400 dark:text-[#5a6580] ml-0.5">/500m</span>
                </p>
              </div>
            </div>
          )}

          {/* Pace chart card */}
          {filteredPace.length > 0 && (
            <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 mb-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-base font-display font-bold text-gray-800 dark:text-[#dae2fd]">
                    Split Time Trend
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-[#5a6580] mt-0.5">
                    Pace consistency per workout
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#00d2ff]/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#00d2ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
              </div>
              {stats && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-bold bg-[#00d2ff]/10 text-[#00d2ff] px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Best: {stats.bestPace}/500m
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580]">
                    Last {Math.min(filteredPace.length, 20)} Sessions
                  </span>
                </div>
              )}
              <PaceTrendChart data={filteredPace} showRpe={showRpe} />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setShowRpe(!showRpe)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors touch-manipulation min-h-[44px] ${
                    showRpe
                      ? 'bg-teal-50 dark:bg-[#00d2ff]/10 text-teal-700 dark:text-[#00d2ff]'
                      : 'text-gray-400 dark:text-[#5a6580] hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {showRpe ? 'Hide RPE' : 'Show RPE'}
                </button>
              </div>
              {legend}
            </div>
          )}

          {/* Stroke rate chart card */}
          {filteredSR.length > 0 && (
            <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 mb-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-base font-display font-bold text-gray-800 dark:text-[#dae2fd]">
                    Stroke Rate
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-[#5a6580] mt-0.5">
                    Strokes per minute over time
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-teal-500 dark:text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </div>
              {srStats && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Avg: {srStats.avgRate} spm
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580]">
                    Last {srStats.totalSessions} Sessions
                  </span>
                </div>
              )}
              <StrokeRateTrendChart data={filteredSR} />
              {legend}
            </div>
          )}

          {/* Performance summary card */}
          {stats && (
            <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase mb-2" style={{ letterSpacing: '0.08em' }}>Training Status</p>
                  <p className="text-xl font-display font-extrabold italic text-gray-800 dark:text-[#dae2fd]">
                    {stats.totalSessions >= 10 ? 'Building Momentum' : stats.totalSessions >= 5 ? 'Getting Started' : 'Early Days'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-[#5a6580] mt-1">
                    {stats.totalSessions} session{stats.totalSessions !== 1 ? 's' : ''} with pace data logged
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <RacePredictions sessions={sessions} plan={plan} />
    </div>
  );
}

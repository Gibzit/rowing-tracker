import { useMemo } from 'react';
import type { SessionRecord } from '../utils/storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { computePredictions } from '../utils/pacePredictor';
import type { RacePrediction } from '../utils/pacePredictor';

interface RacePredictionsProps {
  sessions: Record<string, SessionRecord>;
  plan: SessionDescriptor[];
}

function formatTime(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds * 10) / 10;
  const minutes = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${minutes}:${secs.toFixed(1).padStart(4, '0')}`;
}

function formatPace(paceSeconds: number): string {
  const minutes = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function PredictionCard({ label, prediction }: { label: string; prediction: RacePrediction | null }) {
  if (!prediction) return null;

  const sourceContext = [
    prediction.sourceRpe ? `RPE ${prediction.sourceRpe}` : null,
    prediction.sourceDragFactor ? `PWR ${prediction.sourceDragFactor}` : null,
  ].filter(Boolean).join(', ');

  return (
    <div className="flex-1 p-4 rounded-xl bg-white dark:bg-[#0f1b33] border border-gray-100 dark:border-white/[0.06]">
      <div className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase tracking-wider mb-1">
        {prediction.isActual ? `${label} Actual` : `${label} Predicted`}
      </div>
      <div className="font-mono text-2xl font-bold text-gray-800 dark:text-[#dae2fd]">
        {formatTime(prediction.totalSeconds)}
      </div>
      <div className="font-mono text-xs text-teal-600 dark:text-[#00d2ff] mt-0.5">
        {formatPace(prediction.pacePerFiveHundred)}/500m
      </div>
      <div className="text-[10px] text-gray-400 dark:text-[#5a6580] mt-2 leading-relaxed">
        From {prediction.sourceLabel} at {prediction.sourcePace}
        {sourceContext && ` — ${sourceContext}`}
      </div>
    </div>
  );
}

export default function RacePredictions({ sessions, plan }: RacePredictionsProps) {
  const predictions = useMemo(() => computePredictions(sessions, plan), [sessions, plan]);

  if (!predictions.twoK && !predictions.fiveK) {
    return (
      <div className="mt-6">
        <h3 className="font-display text-lg font-bold text-gray-800 dark:text-[#dae2fd] mb-3">
          Race Predictions
        </h3>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1a2640] flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-gray-400 dark:text-[#5a6580]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            No predictions yet
          </p>
          <p className="text-xs text-gray-400 dark:text-[#5a6580] mt-1">
            Complete a session with pace data to see race predictions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-bold text-gray-800 dark:text-[#dae2fd] mb-3">
        Race Predictions
      </h3>
      <div className="flex gap-3">
        <PredictionCard label="2K" prediction={predictions.twoK} />
        <PredictionCard label="5K" prediction={predictions.fiveK} />
      </div>
    </div>
  );
}

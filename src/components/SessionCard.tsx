import { useState, useEffect, useCallback, useRef } from 'react';
import type { SessionDescriptor } from '../data/trainingPlan';
import { isIntervalSession, getIntervalCount } from '../data/trainingPlan';
import type { SessionRecord } from '../utils/storage';
import PaceInput from './PaceInput';
import IntervalInputs from './IntervalInputs';
import NotesInput from './NotesInput';
import StrokeRateInput from './StrokeRateInput';
import SessionTimer from './SessionTimer';
import CheckCircle from './CheckCircle';
import SaveToast from './SaveToast';
import PhotoScanButton from './PhotoScanButton';
import type { ExtractedData } from '../utils/photoCapture';
import { validatePace } from '../utils/paceValidation';

interface DraftState {
  pace: string;
  totalTime: string;
  intervalTimes: string[];
  strokeRate?: number;
  notes: string;
}

function makeDraft(record: SessionRecord): DraftState {
  return {
    pace: record.pace,
    totalTime: record.totalTime,
    intervalTimes: [...record.intervalTimes],
    strokeRate: record.strokeRate,
    notes: record.notes,
  };
}

function isDraftChanged(draft: DraftState, record: SessionRecord): boolean {
  if (draft.pace !== record.pace) return true;
  if (draft.totalTime !== record.totalTime) return true;
  if (draft.notes !== record.notes) return true;
  if (draft.strokeRate !== record.strokeRate) return true;
  if (draft.intervalTimes.length !== record.intervalTimes.length) return true;
  for (let i = 0; i < draft.intervalTimes.length; i++) {
    if (draft.intervalTimes[i] !== record.intervalTimes[i]) return true;
  }
  return false;
}

interface SessionCardProps {
  descriptor: SessionDescriptor;
  record: SessionRecord;
  onToggleComplete: () => void;
  onUpdate: (partial: Partial<SessionRecord>) => void;
  isCustom?: boolean;
  onDelete?: () => void;
  apiKey?: string | null;
  onSetupRequired?: () => void;
}

export default function SessionCard({
  descriptor,
  record,
  onToggleComplete,
  onUpdate,
  isCustom,
  onDelete,
  apiKey,
  onSetupRequired,
}: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<DraftState>(() => makeDraft(record));
  const [justCompleted, setJustCompleted] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const prevCompletedRef = useRef(record.completed);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInterval = isIntervalSession(descriptor.label);
  const intervalCount = isInterval ? getIntervalCount(descriptor.label) : 0;

  useEffect(() => {
    if (record.completed && !prevCompletedRef.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 600);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = record.completed;
  }, [record.completed]);

  // Sync draft when card expands or record changes externally (e.g. reset)
  useEffect(() => {
    if (expanded) {
      setDraft(makeDraft(record));
    }
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasChanges = expanded && isDraftChanged(draft, record);

  const handleSave = useCallback(() => {
    const savedPace = draft.pace;
    onUpdate({
      pace: draft.pace,
      totalTime: draft.totalTime,
      intervalTimes: draft.intervalTimes,
      strokeRate: draft.strokeRate,
      notes: draft.notes,
    });
    setExpanded(false);
    // Show save confirmation toast
    const toastMsg = savedPace ? `Saved: ${savedPace}/500m` : 'Session updated';
    setShowToast(toastMsg);
  }, [draft, onUpdate]);

  const handleDiscard = useCallback(() => {
    setDraft(makeDraft(record));
  }, [record]);

  const handlePhotoData = useCallback((data: ExtractedData) => {
    setDraft((prev) => ({
      ...prev,
      pace: data.pace ?? prev.pace,
      totalTime: data.totalTime ?? prev.totalTime,
      strokeRate: data.strokeRate ?? prev.strokeRate,
      intervalTimes: data.intervalPaces ?? prev.intervalTimes,
    }));
  }, []);

  const cardBg = record.completed
    ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800'
    : 'bg-white dark:bg-[#0f2438] border-gray-200 dark:border-[#1e3a5f]';
  const borderStyle = descriptor.isOptional ? 'border-dashed' : 'border-solid';
  const leftAccent = record.completed
    ? 'dark:border-l-[3px] dark:border-l-green-500'
    : 'dark:border-l-[3px] dark:border-l-teal-600';

  return (
    <>
      <div
        className={`border rounded-xl p-4 mb-3 ${cardBg} ${borderStyle} ${leftAccent} dark:shadow-lg dark:shadow-black/20 hover:translate-y-[-1px] transition-all duration-200`}
        style={justCompleted ? { animation: 'cardComplete 0.6s ease-out' } : undefined}
      >
        <div
          className="flex items-start gap-3 cursor-pointer touch-manipulation"
          onClick={() => setExpanded(!expanded)}
        >
          <CheckCircle checked={record.completed} onChange={onToggleComplete} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold text-base ${
                  record.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                Day {descriptor.dayNumber}: {descriptor.label}
              </span>
              {isCustom && (
                <span className="text-[11px] font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  custom
                </span>
              )}
              {descriptor.isOptional && !isCustom && (
                <span className="text-[11px] font-medium bg-gray-100 dark:bg-[#1a3550] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  optional
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{descriptor.description}</p>
            {!expanded && (record.pace || record.strokeRate) && (
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {record.pace && (
                  <span className="text-[11px] font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
                    {record.pace}/500m
                  </span>
                )}
                {record.strokeRate && (
                  <span className="text-[11px] font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    {record.strokeRate} spm
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 mt-1">
            {/* Timer icon hint for interval workouts */}
            {isInterval && !expanded && (
              <span
                className="text-teal-400 dark:text-teal-500"
                title="Rest timer available"
                aria-label="Has rest timer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
            )}
            {isCustom && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="min-w-[32px] min-h-[32px] flex items-center justify-center text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Delete custom workout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <span className="text-gray-400 dark:text-gray-500 text-lg">
              {expanded ? '\u25B2' : '\u25BC'}
            </span>
          </div>
        </div>

        {expanded && (
          <div
            ref={contentRef}
            className="mt-4 space-y-3 border-t border-gray-100 dark:border-[#1e3a5f] pt-4"
            style={{ animation: 'slideDown 0.2s ease-out' }}
          >
            {/* Photo scan button */}
            {onSetupRequired && (
              <PhotoScanButton
                descriptor={descriptor}
                onDataExtracted={handlePhotoData}
                apiKey={apiKey ?? null}
                onSetupRequired={onSetupRequired}
              />
            )}

            {/* Unsaved changes indicator */}
            {hasChanges && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </div>
            )}

            <PaceInput
              label="Average Pace (per 500m)"
              value={draft.pace}
              onChange={(v) => setDraft((prev) => ({ ...prev, pace: v }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Time
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="mm:ss"
                value={draft.totalTime}
                onChange={(e) => setDraft((prev) => ({ ...prev, totalTime: e.target.value }))}
                onBlur={() => {
                  if (draft.totalTime) {
                    const result = validatePace(draft.totalTime);
                    if (!result.valid && draft.totalTime) {
                      const match = draft.totalTime.match(/^\d{1,3}:\d{2}$/);
                      if (!match) {
                        // silently accept for now — validation is on pace input
                      }
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a4a6b] dark:bg-[#0f2438] dark:text-gray-100 rounded-xl text-base min-h-[44px] focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-colors"
              />
            </div>

            {isInterval && (
              <IntervalInputs
                count={intervalCount}
                values={draft.intervalTimes}
                onChange={(v) => setDraft((prev) => ({ ...prev, intervalTimes: v }))}
              />
            )}

            <StrokeRateInput
              value={draft.strokeRate}
              onChange={(v) => setDraft((prev) => ({ ...prev, strokeRate: v }))}
            />

            <NotesInput
              value={draft.notes}
              onChange={(v) => setDraft((prev) => ({ ...prev, notes: v }))}
            />

            {isInterval && <SessionTimer />}

            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-[#1e3a5f]">
              <button
                onClick={handleDiscard}
                disabled={!hasChanges}
                className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border transition-colors touch-manipulation ${
                  hasChanges
                    ? 'border-gray-300 dark:border-[#2a4a6b] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a3550]'
                    : 'border-gray-200 dark:border-[#1e3a5f] text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-all touch-manipulation ${
                  hasChanges
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-600/20'
                    : 'bg-gray-200 dark:bg-[#1a3550] text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {showToast && (
        <SaveToast message={showToast} onDone={() => setShowToast(null)} />
      )}
    </>
  );
}

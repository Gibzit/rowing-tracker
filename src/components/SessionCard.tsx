import { useState, useEffect, useCallback, useRef } from 'react';
import type { SessionDescriptor } from '../data/trainingPlan';
import { isIntervalSession, getIntervalCount, parseRestDuration } from '../data/trainingPlan';
import type { SessionRecord } from '../utils/storage';
import PaceInput from './PaceInput';
import IntervalInputs from './IntervalInputs';
import NotesInput from './NotesInput';
import StrokeRateInput from './StrokeRateInput';
import SessionTimer from './SessionTimer';
import CheckCircle from './CheckCircle';
import SaveToast from './SaveToast';
import ConfirmDialog from './ConfirmDialog';
import PhotoScanButton from './PhotoScanButton';
import type { ExtractedData } from '../utils/photoCapture';


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
  const [showUncheckConfirm, setShowUncheckConfirm] = useState(false);
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
    // Auto-mark as completed when saving data
    if (!record.completed) {
      onToggleComplete();
    }
    setExpanded(false);
    // Show save confirmation toast
    const toastMsg = savedPace ? `Saved: ${savedPace}/500m` : 'Session saved & completed';
    setShowToast(toastMsg);
  }, [draft, onUpdate, record.completed, onToggleComplete]);

  const handleDiscard = useCallback(() => {
    setDraft(makeDraft(record));
  }, [record]);

  const handleToggleComplete = useCallback(() => {
    if (record.completed) {
      // Show confirmation before unchecking a completed session
      setShowUncheckConfirm(true);
    } else {
      onToggleComplete();
    }
  }, [record.completed, onToggleComplete]);

  const handleConfirmUncheck = useCallback(() => {
    onToggleComplete();
    setShowUncheckConfirm(false);
  }, [onToggleComplete]);

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
    ? 'bg-green-50 dark:bg-green-950/20'
    : 'bg-white dark:bg-[#0f1b33]';
  const optionalBorder = descriptor.isOptional ? ' border border-dashed border-gray-200/50 dark:border-white/[0.04]' : '';

  return (
    <>
      <div
        className={`rounded-2xl p-5 mb-4 ${cardBg}${optionalBorder} hover:translate-y-[-1px] transition-all duration-200`}
        style={justCompleted ? { animation: 'cardComplete 0.6s ease-out' } : undefined}
      >
        <div
          className="flex items-start gap-3 cursor-pointer touch-manipulation"
          onClick={() => setExpanded(!expanded)}
        >
          <CheckCircle checked={record.completed} onChange={handleToggleComplete} />

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase tracking-wider shrink-0">D{descriptor.dayNumber}</span>
              <span
                className={`font-display font-bold text-[15px] leading-snug ${
                  record.completed ? 'line-through text-gray-400 dark:text-[#5a6580]' : 'text-gray-800 dark:text-[#dae2fd]'
                }`}
              >
                {descriptor.label}
              </span>
              {isCustom && (
                <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded uppercase tracking-wider">
                  custom
                </span>
              )}
              {descriptor.isOptional && !isCustom && (
                <span className="text-[9px] font-bold bg-gray-100 dark:bg-[#1a2640] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded uppercase tracking-wider">
                  opt
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{descriptor.description}</p>
            {!expanded && (record.pace || record.strokeRate) && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {record.pace && (
                  <span className="text-[10px] font-mono font-bold bg-teal-50 dark:bg-[#00d2ff]/10 text-teal-700 dark:text-[#00d2ff] px-2.5 py-1 rounded-lg">
                    {record.pace}/500m
                  </span>
                )}
                {record.strokeRate && (
                  <span className="text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg">
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
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition-colors touch-manipulation"
                title="Delete custom workout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 dark:text-[#5a6580] chevron-icon${expanded ? ' chevron-rotated' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className={`card-expandable${expanded ? ' card-expanded' : ''}`}>
          <div className="card-expandable-inner">
            <div
              ref={contentRef}
              className="card-expandable-content mt-5 space-y-4 border-t border-gray-100 dark:border-white/[0.06] pt-5"
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
                <div className="flex items-center gap-1.5 text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Unsaved changes
                </div>
              )}

              <PaceInput
                label="Average Pace (per 500m)"
                value={draft.pace}
                onChange={(v) => setDraft((prev) => ({ ...prev, pace: v }))}
              />

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
                  Total Time
                </label>
                <input
                  type="text"
                  inputMode="text"
                  placeholder="mm:ss"
                  value={draft.totalTime}
                  onChange={(e) => setDraft((prev) => ({ ...prev, totalTime: e.target.value }))}

                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.08] dark:bg-[#0f1b33] dark:text-[#dae2fd] rounded-lg text-base min-h-[44px] focus:ring-2 focus:ring-[#00d2ff]/20 focus:border-[#00d2ff]/40 outline-none transition-colors"
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

              {isInterval && (
                <SessionTimer
                  totalReps={intervalCount}
                  restDurationSeconds={parseRestDuration(descriptor.label)}
                />
              )}

              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-white/[0.04]">
                <button
                  onClick={handleDiscard}
                  disabled={!hasChanges}
                  className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors touch-manipulation ${
                    hasChanges
                      ? 'bg-gray-100 dark:bg-[#1a2640] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222a3d]'
                      : 'bg-gray-50 dark:bg-[#1a2640]/50 text-gray-400 dark:text-[#404b66] cursor-not-allowed'
                  }`}
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all touch-manipulation ${
                    hasChanges
                      ? 'btn-primary-gradient shadow-[0_0_16px_rgba(0,210,255,0.2)]'
                      : 'bg-gray-200 dark:bg-[#1a2640] text-gray-400 dark:text-[#5a6580] cursor-not-allowed'
                  }`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <SaveToast message={showToast} onDone={() => setShowToast(null)} />
      )}

      {showUncheckConfirm && (
        <ConfirmDialog
          message="Mark this session as incomplete? Your recorded data (pace, time, etc.) will be kept, but the completion status and date will be removed."
          onConfirm={handleConfirmUncheck}
          onCancel={() => setShowUncheckConfirm(false)}
          confirmLabel="Uncheck"
        />
      )}
    </>
  );
}

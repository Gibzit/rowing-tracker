import { useState, useEffect, useMemo } from 'react';
import type { TrainingPlan } from '../../utils/storage';
import type { SessionRecord } from '../../utils/storage';
import {
  editPlanSession,
  deletePlanSession,
  addPlanSession,
  renamePlan,
  restorePlanSnapshot,
  getNextDayNumber,
} from '../../utils/planUtils';
import PlanSessionRow from './PlanSessionRow';

interface PlanEditorModalProps {
  plan: TrainingPlan;
  sessions: Record<string, SessionRecord>;
  onSave: (plan: TrainingPlan) => void;
  onClose: () => void;
  scrollToWeek?: number;
}

export default function PlanEditorModal({
  plan: originalPlan,
  sessions,
  onSave,
  onClose,
  scrollToWeek,
}: PlanEditorModalProps) {
  const [draft, setDraft] = useState<TrainingPlan>(() => ({
    ...originalPlan,
    sessions: originalPlan.sessions.map((s) => ({ ...s })),
    history: [...originalPlan.history],
  }));
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(draft.name);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(() =>
    new Set(scrollToWeek ? [scrollToWeek] : [])
  );
  const [addingToWeek, setAddingToWeek] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const weekNumbers = useMemo(() => {
    const weeks = [...new Set(draft.sessions.map((s) => s.weekNumber))].sort(
      (a, b) => a - b
    );
    return weeks;
  }, [draft.sessions]);

  const hasChanges = useMemo(() => {
    if (draft.name !== originalPlan.name) return true;
    if (draft.sessions.length !== originalPlan.sessions.length) return true;
    return draft.sessions.some((s, i) => {
      const o = originalPlan.sessions[i];
      return (
        !o ||
        s.label !== o.label ||
        s.description !== o.description ||
        s.isOptional !== o.isOptional ||
        s.weekNumber !== o.weekNumber ||
        s.dayNumber !== o.dayNumber
      );
    });
  }, [draft, originalPlan]);

  // ESC key to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  };

  const handleSaveName = () => {
    if (nameValue.trim()) {
      setDraft(renamePlan(draft, nameValue.trim()));
    }
    setEditingName(false);
  };

  const handleEditSession = (
    weekNumber: number,
    dayNumber: number,
    patch: Partial<Pick<import('../../data/trainingPlan').SessionDescriptor, 'label' | 'description' | 'isOptional'>>
  ) => {
    setDraft(editPlanSession(draft, weekNumber, dayNumber, patch));
  };

  const handleDeleteSession = (weekNumber: number, dayNumber: number) => {
    setDraft(deletePlanSession(draft, weekNumber, dayNumber));
  };

  const handleAddSession = (weekNumber: number) => {
    if (!newLabel.trim()) return;
    const dayNumber = getNextDayNumber(draft, weekNumber);
    setDraft(
      addPlanSession(draft, {
        weekNumber,
        dayNumber,
        label: newLabel.trim(),
        description: newDescription.trim(),
        isOptional: true,
      })
    );
    setNewLabel('');
    setNewDescription('');
    setAddingToWeek(null);
  };

  const handleRestore = (index: number) => {
    setDraft(restorePlanSnapshot(draft, index));
    setShowHistory(false);
  };

  const handleAddWeek = () => {
    const maxWeek = weekNumbers.length > 0 ? Math.max(...weekNumbers) : 0;
    const nextWeek = maxWeek + 1;
    let updated = draft;
    for (let d = 1; d <= 5; d++) {
      updated = addPlanSession(updated, {
        weekNumber: nextWeek,
        dayNumber: d,
        label: d <= 3 ? `Session ${d}` : `Session ${d}`,
        description: '',
        isOptional: d > 3,
      });
    }
    setDraft(updated);
    setExpandedWeeks((prev) => new Set([...prev, nextWeek]));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      style={{ animation: 'backdropFadeIn 0.2s ease-out' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Plan editor"
        className="bg-[#0b1326] rounded-2xl max-w-lg w-full shadow-2xl ring-1 ring-white/[0.06] flex flex-col"
        style={{ animation: 'dialogPopIn 0.25s ease-out', maxHeight: '90dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center justify-between mb-1">
            {editingName ? (
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="font-display text-xl font-extrabold text-[#dae2fd] bg-transparent border-b-2 border-[#00d2ff] outline-none px-0 py-1"
                autoFocus
              />
            ) : (
              <h2
                className="font-display text-xl font-extrabold text-[#dae2fd] cursor-pointer hover:text-[#00d2ff] transition-colors"
                onClick={() => setEditingName(true)}
                title="Click to rename"
              >
                {draft.name}
                <svg className="w-3.5 h-3.5 inline-block ml-2 text-[#5a6580]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </h2>
            )}
            <button
              onClick={onClose}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#5a6580] hover:text-[#dae2fd] transition-colors touch-manipulation"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-[#5a6580] font-bold uppercase tracking-wider">
            {draft.sessions.length} sessions &middot; {weekNumbers.length} weeks
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {/* History toggle */}
          {draft.history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-[10px] font-bold text-[#5a6580] hover:text-[#00d2ff] uppercase tracking-wider transition-colors mb-2 touch-manipulation"
            >
              {showHistory ? '▼' : '▶'} History ({draft.history.length})
            </button>
          )}

          {showHistory && (
            <div className="bg-[#0f1b33] rounded-xl p-3 mb-3 space-y-2 max-h-40 overflow-y-auto">
              {draft.history.map((snap, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs text-[#dae2fd]">{snap.changeDescription}</p>
                    <p className="text-[10px] text-[#5a6580]">
                      {new Date(snap.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(i)}
                    className="text-[10px] font-bold text-[#00d2ff] hover:text-[#00d2ff]/80 px-2 py-1 rounded-lg bg-[#00d2ff]/10 touch-manipulation"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Week list */}
          {weekNumbers.map((week) => {
            const weekSessions = draft.sessions
              .filter((s) => s.weekNumber === week)
              .sort((a, b) => a.dayNumber - b.dayNumber);
            const isExpanded = expandedWeeks.has(week);
            const completedCount = weekSessions.filter(
              (s) => sessions[`${s.weekNumber}-${s.dayNumber}`]?.completed
            ).length;

            return (
              <div key={week} className="bg-[#0f1b33] rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 touch-manipulation"
                  onClick={() => toggleWeek(week)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-extrabold italic text-[#dae2fd]">
                      W{week}
                    </span>
                    <span className="text-[10px] font-bold text-[#5a6580] uppercase tracking-wider">
                      {weekSessions.length} sessions
                    </span>
                    {completedCount > 0 && (
                      <span className="text-[10px] font-mono font-bold text-green-400 bg-green-900/20 px-2 py-0.5 rounded">
                        {completedCount} done
                      </span>
                    )}
                  </div>
                  <span className="text-[#5a6580] text-sm">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-white/[0.04]">
                    {weekSessions.map((s) => (
                      <PlanSessionRow
                        key={`${s.weekNumber}-${s.dayNumber}`}
                        session={s}
                        onEdit={(patch) =>
                          handleEditSession(s.weekNumber, s.dayNumber, patch)
                        }
                        onDelete={() =>
                          handleDeleteSession(s.weekNumber, s.dayNumber)
                        }
                        hasSessionData={
                          !!sessions[`${s.weekNumber}-${s.dayNumber}`]?.completed
                        }
                      />
                    ))}

                    {/* Add session to week */}
                    {addingToWeek === week ? (
                      <div className="mt-2 space-y-2 bg-[#1a2640] rounded-lg p-3">
                        <input
                          type="text"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          placeholder="e.g. 6000m, 4 x 1000m / 3min rest"
                          className="w-full px-3 py-2 border border-white/[0.08] bg-[#0f1b33] text-[#dae2fd] rounded-lg text-sm min-h-[44px] font-mono focus:ring-2 focus:ring-[#00d2ff]/20 outline-none"
                          autoFocus
                        />
                        <textarea
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-2 border border-white/[0.08] bg-[#0f1b33] text-[#dae2fd] rounded-lg text-sm min-h-[44px] resize-y focus:ring-2 focus:ring-[#00d2ff]/20 outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setAddingToWeek(null); setNewLabel(''); setNewDescription(''); }}
                            className="flex-1 min-h-[36px] text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#0f1b33] text-gray-400 touch-manipulation"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddSession(week)}
                            disabled={!newLabel.trim()}
                            className="flex-1 min-h-[36px] text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#00d2ff]/10 text-[#00d2ff] disabled:opacity-40 touch-manipulation"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingToWeek(week)}
                        className="w-full mt-2 py-2 text-[10px] font-bold text-[#5a6580] hover:text-[#00d2ff] uppercase tracking-wider border border-dashed border-white/[0.06] rounded-lg hover:bg-[#1a2640]/50 transition-colors touch-manipulation"
                      >
                        + Add Session
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add week */}
          <button
            onClick={handleAddWeek}
            className="w-full py-3 text-xs font-bold text-[#5a6580] hover:text-[#00d2ff] uppercase tracking-wider border border-dashed border-white/[0.06] rounded-xl hover:bg-[#0f1b33] transition-colors touch-manipulation"
          >
            + Add Week
          </button>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.04] shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#1a2640] text-gray-300 hover:bg-[#222a3d] transition-colors touch-manipulation"
            >
              {hasChanges ? 'Discard' : 'Close'}
            </button>
            <button
              onClick={() => { onSave(draft); onClose(); }}
              disabled={!hasChanges}
              className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all touch-manipulation ${
                hasChanges
                  ? 'btn-primary-gradient shadow-[0_0_16px_rgba(0,210,255,0.2)]'
                  : 'bg-[#1a2640] text-[#5a6580] cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { TrainingPlan } from '../../utils/storage';
import { createPlanFromTemplate, createBlankPlan } from '../../utils/planUtils';
import { createPetePlanTemplate } from '../../data/planTemplates';
import ConfirmDialog from '../ConfirmDialog';

interface PlanManagerModalProps {
  plans: TrainingPlan[];
  activePlanId: string;
  onSwitchPlan: (planId: string) => void;
  onCreatePlan: (plan: TrainingPlan) => void;
  onDeletePlan: (planId: string) => void;
  onDuplicatePlan: (planId: string, name: string) => void;
  onClose: () => void;
}

export default function PlanManagerModal({
  plans,
  activePlanId,
  onSwitchPlan,
  onCreatePlan,
  onDeletePlan,
  onDuplicatePlan,
  onClose,
}: PlanManagerModalProps) {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [blankWeeks, setBlankWeeks] = useState('12');
  const [blankName, setBlankName] = useState('');
  const [showBlankForm, setShowBlankForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ESC key to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCreateFromTemplate = () => {
    const template = createPetePlanTemplate();
    const plan = createPlanFromTemplate(template, `Pete Plan (copy)`);
    onCreatePlan(plan);
    setShowNewMenu(false);
  };

  const handleCreateBlank = () => {
    const weeks = parseInt(blankWeeks, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 52) return;
    const name = blankName.trim() || `Custom Plan`;
    const plan = createBlankPlan(name, weeks);
    onCreatePlan(plan);
    setShowBlankForm(false);
    setShowNewMenu(false);
    setBlankName('');
    setBlankWeeks('12');
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
        aria-label="Plan manager"
        className="bg-[#0b1326] rounded-2xl max-w-sm w-full shadow-2xl ring-1 ring-white/[0.06] flex flex-col"
        style={{ animation: 'dialogPopIn 0.25s ease-out', maxHeight: '85dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-[#dae2fd]">
              Training Plans
            </h2>
            <button
              onClick={onClose}
              aria-label="Close plan manager"
              className="min-w-[36px] min-h-[44px] flex items-center justify-center text-[#5a6580] hover:text-[#dae2fd] transition-colors touch-manipulation"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-[#5a6580] font-bold uppercase tracking-wider mt-1">
            {plans.length} plan{plans.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Plan list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {plans.map((plan) => {
            const isActive = plan.id === activePlanId;
            const weekCount = new Set(plan.sessions.map((s) => s.weekNumber)).size;

            return (
              <div
                key={plan.id}
                className={`rounded-xl p-4 transition-colors ${
                  isActive
                    ? 'bg-[#00d2ff]/5 ring-1 ring-[#00d2ff]/20'
                    : 'bg-[#0f1b33] hover:bg-[#1a2640]/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-sm text-[#dae2fd] truncate">
                        {plan.name}
                      </h3>
                      {isActive && (
                        <span className="text-[9px] font-bold bg-[#00d2ff]/20 text-[#00d2ff] px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#5a6580] mt-1">
                      {weekCount} weeks &middot; {plan.sessions.length} sessions
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  {!isActive && (
                    <button
                      onClick={() => onSwitchPlan(plan.id)}
                      className="min-h-[44px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#00d2ff]/10 text-[#00d2ff] hover:bg-[#00d2ff]/20 transition-colors touch-manipulation"
                    >
                      Switch to
                    </button>
                  )}
                  <button
                    onClick={() => onDuplicatePlan(plan.id, `${plan.name} (copy)`)}
                    className="min-h-[44px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#1a2640] text-gray-300 hover:bg-[#222a3d] transition-colors touch-manipulation"
                  >
                    Duplicate
                  </button>
                  {plans.length > 1 && (
                    <button
                      onClick={() => setDeleteConfirm(plan.id)}
                      className="min-h-[44px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors touch-manipulation"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* New plan section */}
        <div className="p-5 border-t border-white/[0.04] space-y-3">
          {!showNewMenu ? (
            <button
              onClick={() => setShowNewMenu(true)}
              className="w-full min-h-[44px] py-3 text-xs font-bold uppercase tracking-wider rounded-xl border border-dashed border-white/[0.08] text-[#5a6580] hover:text-[#00d2ff] hover:border-[#00d2ff]/20 transition-colors touch-manipulation"
            >
              + New Plan
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleCreateFromTemplate}
                className="w-full min-h-[44px] py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#0f1b33] text-[#dae2fd] hover:bg-[#1a2640] transition-colors touch-manipulation text-left px-4"
              >
                <span className="text-[#00d2ff]">From Pete Plan template</span>
                <p className="text-[10px] text-[#5a6580] font-normal normal-case tracking-normal mt-0.5">
                  24-week progressive plan — make it your own
                </p>
              </button>

              {!showBlankForm ? (
                <button
                  onClick={() => setShowBlankForm(true)}
                  className="w-full min-h-[44px] py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#0f1b33] text-[#dae2fd] hover:bg-[#1a2640] transition-colors touch-manipulation text-left px-4"
                >
                  <span className="text-[#00d2ff]">Blank plan</span>
                  <p className="text-[10px] text-[#5a6580] font-normal normal-case tracking-normal mt-0.5">
                    Start from scratch with empty sessions
                  </p>
                </button>
              ) : (
                <div className="bg-[#0f1b33] rounded-xl p-4 space-y-3">
                  <input
                    type="text"
                    value={blankName}
                    onChange={(e) => setBlankName(e.target.value)}
                    placeholder="Plan name"
                    className="w-full px-3 py-2 border border-white/[0.08] bg-[#1a2640] text-[#dae2fd] rounded-lg text-sm min-h-[44px] focus:ring-2 focus:ring-[#00d2ff]/40 outline-none"
                    autoFocus
                  />
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                      Number of weeks
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={blankWeeks}
                      onChange={(e) => setBlankWeeks(e.target.value)}
                      className="w-full px-3 py-2 border border-white/[0.08] bg-[#1a2640] text-[#dae2fd] rounded-lg text-sm min-h-[44px] font-mono focus:ring-2 focus:ring-[#00d2ff]/40 outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowBlankForm(false); setBlankName(''); setBlankWeeks('12'); }}
                      className="flex-1 min-h-[44px] text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#1a2640] text-gray-400 touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateBlank}
                      className="flex-1 min-h-[44px] text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#00d2ff]/10 text-[#00d2ff] touch-manipulation"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => { setShowNewMenu(false); setShowBlankForm(false); }}
                className="w-full py-2 text-[10px] font-bold uppercase tracking-wider text-[#5a6580] hover:text-gray-300 transition-colors touch-manipulation"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          message={`Delete "${plans.find((p) => p.id === deleteConfirm)?.name}"? Session records for this plan will be lost.`}
          confirmLabel="Delete"
          onConfirm={() => {
            onDeletePlan(deleteConfirm);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

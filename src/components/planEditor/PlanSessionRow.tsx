import { useState, useEffect } from 'react';
import type { SessionDescriptor } from '../../data/trainingPlan';

interface PlanSessionRowProps {
  session: SessionDescriptor;
  onEdit: (patch: Partial<Pick<SessionDescriptor, 'label' | 'description' | 'isOptional'>>) => void;
  onDelete: () => void;
  hasSessionData: boolean;
}

export default function PlanSessionRow({
  session,
  onEdit,
  onDelete,
  hasSessionData,
}: PlanSessionRowProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(session.label);
  const [description, setDescription] = useState(session.description);

  // Sync local state when props change (e.g., after saving an edit externally)
  useEffect(() => {
    if (!editing) {
      setLabel(session.label);
      setDescription(session.description);
    }
  }, [session.label, session.description, editing]);

  const handleSave = () => {
    onEdit({
      label: label.trim() || session.label,
      description: description.trim(),
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setLabel(session.label);
    setDescription(session.description);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-[#1a2640] rounded-xl p-3 space-y-2">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border border-white/[0.08] bg-[#0f1b33] text-[#dae2fd] rounded-lg text-sm min-h-[44px] font-mono focus:ring-2 focus:ring-[#00d2ff]/20 focus:border-[#00d2ff]/40 outline-none transition-colors"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-white/[0.08] bg-[#0f1b33] text-[#dae2fd] rounded-lg text-sm min-h-[60px] resize-y focus:ring-2 focus:ring-[#00d2ff]/20 focus:border-[#00d2ff]/40 outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 min-h-[36px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#0f1b33] text-gray-400 hover:text-gray-300 transition-colors touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 min-h-[36px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#00d2ff]/10 text-[#00d2ff] hover:bg-[#00d2ff]/20 transition-colors touch-manipulation"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 py-2 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] font-bold text-[#5a6580] shrink-0">
            D{session.dayNumber}
          </span>
          <span className="font-mono text-sm font-bold text-[#dae2fd] truncate">
            {session.label}
          </span>
          {session.isOptional && (
            <span className="text-[9px] font-bold bg-[#1a2640] text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              opt
            </span>
          )}
          {hasSessionData && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1" title="Has recorded data" />
          )}
        </div>
        {session.description && (
          <p className="text-[10px] text-[#5a6580] mt-0.5 leading-relaxed line-clamp-1">
            {session.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit({ isOptional: !session.isOptional })}
          className="min-w-[28px] min-h-[28px] flex items-center justify-center text-[#5a6580] hover:text-[#00d2ff] transition-colors touch-manipulation"
          title={session.isOptional ? 'Make required' : 'Make optional'}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {session.isOptional ? (
              <><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></>
            ) : (
              <><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></>
            )}
          </svg>
        </button>
        <button
          onClick={() => setEditing(true)}
          className="min-w-[28px] min-h-[28px] flex items-center justify-center text-[#5a6580] hover:text-[#00d2ff] transition-colors touch-manipulation"
          title="Edit session"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="min-w-[28px] min-h-[28px] flex items-center justify-center text-[#5a6580] hover:text-red-400 transition-colors touch-manipulation"
          title="Delete session"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { SessionDescriptor } from '../data/trainingPlan';
import type { SessionRecord } from '../utils/storage';
import SessionCard from './SessionCard';
import OptionalToggle from './OptionalToggle';
import AddWorkoutForm from './AddWorkoutForm';

interface WeekViewProps {
  weekNumber: number;
  sessions: SessionDescriptor[];
  getSession: (week: number, day: number) => SessionRecord;
  optionalVisible: boolean;
  onToggleComplete: (week: number, day: number) => void;
  onUpdateSession: (week: number, day: number, partial: Partial<SessionRecord>) => void;
  onToggleOptional: () => void;
  onAddCustomSession: (label: string, description: string) => void;
  onDeleteCustomSession: (dayNumber: number) => void;
  apiKey?: string | null;
  onSetupRequired?: () => void;
}

export default function WeekView({
  weekNumber,
  sessions,
  getSession,
  optionalVisible,
  onToggleComplete,
  onUpdateSession,
  onToggleOptional,
  onAddCustomSession,
  onDeleteCustomSession,
  apiKey,
  onSetupRequired,
}: WeekViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const coreSessions = sessions.filter((s) => !s.isOptional);
  const optionalSessions = sessions.filter((s) => s.isOptional);

  return (
    <div className="px-5 py-6">
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="font-display text-4xl font-extrabold italic text-gray-800 dark:text-[#dae2fd]">
          W{weekNumber}
        </h2>
        <div className="flex-1 h-px bg-gray-200/50 dark:bg-white/[0.04]" />
        <span className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase" style={{ letterSpacing: '0.08em' }}>
          Sessions
        </span>
      </div>

      {coreSessions.map((session) => (
        <SessionCard
          key={`${session.weekNumber}-${session.dayNumber}`}
          descriptor={session}
          record={getSession(session.weekNumber, session.dayNumber)}
          onToggleComplete={() => onToggleComplete(session.weekNumber, session.dayNumber)}
          onUpdate={(partial) =>
            onUpdateSession(session.weekNumber, session.dayNumber, partial)
          }
          apiKey={apiKey}
          onSetupRequired={onSetupRequired}
        />
      ))}

      {optionalSessions.length > 0 && (
        <>
          <OptionalToggle visible={optionalVisible} onToggle={onToggleOptional} />
          {optionalVisible && (
            <>
              {optionalSessions.map((session) => (
                <SessionCard
                  key={`${session.weekNumber}-${session.dayNumber}`}
                  descriptor={session}
                  record={getSession(session.weekNumber, session.dayNumber)}
                  isCustom={session.dayNumber >= 100}
                  onToggleComplete={() =>
                    onToggleComplete(session.weekNumber, session.dayNumber)
                  }
                  onUpdate={(partial) =>
                    onUpdateSession(session.weekNumber, session.dayNumber, partial)
                  }
                  onDelete={
                    session.dayNumber >= 100
                      ? () => onDeleteCustomSession(session.dayNumber)
                      : undefined
                  }
                  apiKey={apiKey}
                  onSetupRequired={onSetupRequired}
                />
              ))}
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full min-h-[44px] text-xs font-bold uppercase tracking-wider text-[#5a6580] dark:text-[#5a6580] py-3 px-4 rounded-2xl border border-dashed border-gray-300/50 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-[#1a2640]/50 hover:text-[#00d2ff] dark:hover:text-[#00d2ff] transition-colors mb-4 touch-manipulation"
              >
                + Add Custom Workout
              </button>
            </>
          )}
        </>
      )}

      {showAddForm && (
        <AddWorkoutForm
          onSave={(label, description) => {
            onAddCustomSession(label, description);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

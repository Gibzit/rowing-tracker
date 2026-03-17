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
    <div className="px-4 py-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Week {weekNumber}</h2>

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
                className="w-full min-h-[44px] text-sm text-green-600 dark:text-green-400 font-medium py-2 px-4 rounded-lg border border-dashed border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors mb-3 touch-manipulation"
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

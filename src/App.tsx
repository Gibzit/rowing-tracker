import { useState, useMemo, useCallback } from 'react';
import { useTrainingData } from './hooks/useTrainingData';
import { useDarkMode } from './hooks/useDarkMode';
import { paceToSeconds } from './utils/paceUtils';
import { computePersonalBests, isNewPB } from './utils/personalBests';
import { getWeekSessions } from './utils/combinedPlan';
import type { SessionRecord } from './utils/storage';
import type { ViewType } from './types';
import Header from './components/Header';
import WeekSelector from './components/WeekSelector';
import WeekView from './components/WeekView';
import ResetButton from './components/ResetButton';
import BottomNav from './components/BottomNav';
import PBCelebration from './components/PBCelebration';
import ChartsView from './components/views/ChartsView';
import PersonalBestsView from './components/views/PersonalBestsView';
import CalendarView from './components/views/CalendarView';
import ComparisonView from './components/views/ComparisonView';
import GenerateWeekBanner from './components/GenerateWeekBanner';

function App() {
  const {
    data,
    combinedPlan,
    getSession,
    updateSession,
    toggleComplete,
    toggleOptional,
    addCustomSession,
    deleteCustomSession,
    resetAll,
    coreCompleted,
    coreTotal,
    currentWeek,
    totalWeeks,
    all24Complete,
    isWeekComplete,
    generateNextWeek,
  } = useTrainingData();

  const { theme, cycleTheme } = useDarkMode();
  const [activeView, setActiveView] = useState<ViewType>('training');
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [pbCelebration, setPbCelebration] = useState<{ label: string; pace: string } | null>(null);

  const weekSessions = useMemo(
    () => getWeekSessions(data, selectedWeek),
    [data, selectedWeek]
  );

  const currentPBs = useMemo(
    () => computePersonalBests(data.sessions, combinedPlan),
    [data.sessions, combinedPlan]
  );

  const handleUpdateSession = useCallback(
    (week: number, day: number, partial: Partial<SessionRecord>) => {
      if (partial.pace) {
        const paceSeconds = paceToSeconds(partial.pace);
        if (paceSeconds !== null) {
          const desc = combinedPlan.find((s) => s.weekNumber === week && s.dayNumber === day);
          if (desc && isNewPB(desc.label, paceSeconds, currentPBs)) {
            setPbCelebration({ label: desc.label, pace: partial.pace });
          }
        }
      }
      updateSession(week, day, partial);
    },
    [updateSession, currentPBs, combinedPlan]
  );

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-[#0c1929] min-h-dvh pb-20">
      <Header coreCompleted={coreCompleted} coreTotal={coreTotal} theme={theme} onToggleTheme={cycleTheme} />

      {activeView === 'training' && (
        <>
          <WeekSelector
            selectedWeek={selectedWeek}
            currentWeek={currentWeek}
            onSelectWeek={setSelectedWeek}
            isWeekComplete={isWeekComplete}
            totalWeeks={totalWeeks}
          />
          <WeekView
            weekNumber={selectedWeek}
            sessions={weekSessions}
            getSession={getSession}
            optionalVisible={!!data.optionalVisible[selectedWeek]}
            onToggleComplete={toggleComplete}
            onUpdateSession={handleUpdateSession}
            onToggleOptional={() => toggleOptional(selectedWeek)}
            onAddCustomSession={(label, description) =>
              addCustomSession(selectedWeek, label, description)
            }
            onDeleteCustomSession={(dayNumber) =>
              deleteCustomSession(selectedWeek, dayNumber)
            }
          />
          {all24Complete && (
            <GenerateWeekBanner
              nextWeek={totalWeeks + 1}
              onGenerate={() => {
                generateNextWeek();
                setSelectedWeek(totalWeeks + 1);
              }}
            />
          )}
          <ResetButton onReset={resetAll} />
        </>
      )}

      {activeView === 'charts' && <ChartsView sessions={data.sessions} plan={combinedPlan} />}
      {activeView === 'pbs' && <PersonalBestsView sessions={data.sessions} plan={combinedPlan} />}
      {activeView === 'calendar' && <CalendarView sessions={data.sessions} />}
      {activeView === 'compare' && <ComparisonView sessions={data.sessions} plan={combinedPlan} />}

      <BottomNav active={activeView} onNavigate={setActiveView} />

      {pbCelebration && (
        <PBCelebration
          label={pbCelebration.label}
          pace={pbCelebration.pace}
          onDone={() => setPbCelebration(null)}
        />
      )}
    </div>
  );
}

export default App;

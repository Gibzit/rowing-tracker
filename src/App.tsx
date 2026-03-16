import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTrainingData } from './hooks/useTrainingData';
import { useDarkMode } from './hooks/useDarkMode';
import { paceToSeconds } from './utils/paceUtils';
import { computePersonalBests, isNewPB } from './utils/personalBests';
import { computeStreaks } from './utils/streakUtils';
import { getWeekSessions } from './utils/combinedPlan';
import type { SessionRecord } from './utils/storage';
import type { ViewType } from './types';
import Header from './components/Header';
import WeekSelector from './components/WeekSelector';
import WeekView from './components/WeekView';
import WeeklySummary from './components/WeeklySummary';
import ResetButton from './components/ResetButton';
import DataManagement from './components/DataManagement';
import BottomNav from './components/BottomNav';
import PBCelebration from './components/PBCelebration';
import ViewTransition from './components/ViewTransition';
import WeekCelebration from './components/WeekCelebration';
import Onboarding from './components/Onboarding';
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
    importData,
    completeOnboarding,
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
  const [celebration, setCelebration] = useState<number | null>(null);

  // Track week completion to trigger celebration
  const weekComplete = isWeekComplete(selectedWeek);
  const prevWeekRef = useRef(selectedWeek);
  const prevCompleteRef = useRef(weekComplete);

  useEffect(() => {
    // Only celebrate if the SAME week transitioned from incomplete to complete
    if (weekComplete && !prevCompleteRef.current && selectedWeek === prevWeekRef.current) {
      setCelebration(selectedWeek);
    }
    prevWeekRef.current = selectedWeek;
    prevCompleteRef.current = weekComplete;
  }, [weekComplete, selectedWeek]);

  const weekSessions = useMemo(
    () => getWeekSessions(data, selectedWeek),
    [data, selectedWeek]
  );

  const currentPBs = useMemo(
    () => computePersonalBests(data.sessions, combinedPlan),
    [data.sessions, combinedPlan]
  );

  const { currentStreak, longestStreak } = useMemo(
    () => computeStreaks(data.sessions),
    [data.sessions]
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
      <Header coreCompleted={coreCompleted} coreTotal={coreTotal} theme={theme} onToggleTheme={cycleTheme} currentStreak={currentStreak} longestStreak={longestStreak} />

      <ViewTransition viewKey={activeView}>
        {activeView === 'training' && (
          <>
            <WeekSelector
              selectedWeek={selectedWeek}
              currentWeek={currentWeek}
              onSelectWeek={setSelectedWeek}
              isWeekComplete={isWeekComplete}
              totalWeeks={totalWeeks}
            />
            <WeeklySummary weekNumber={selectedWeek} sessions={weekSessions} getSession={getSession} />
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
            <DataManagement data={data} onImport={importData} />
            <ResetButton onReset={resetAll} />
          </>
        )}

        {activeView === 'charts' && <ChartsView sessions={data.sessions} plan={combinedPlan} />}
        {activeView === 'pbs' && <PersonalBestsView sessions={data.sessions} plan={combinedPlan} />}
        {activeView === 'calendar' && <CalendarView sessions={data.sessions} />}
        {activeView === 'compare' && <ComparisonView sessions={data.sessions} plan={combinedPlan} />}
      </ViewTransition>

      <BottomNav active={activeView} onNavigate={setActiveView} />

      {pbCelebration && (
        <PBCelebration
          label={pbCelebration.label}
          pace={pbCelebration.pace}
          onDone={() => setPbCelebration(null)}
        />
      )}

      {celebration !== null && (
        <WeekCelebration
          weekNumber={celebration}
          onDone={() => setCelebration(null)}
        />
      )}

      {!data.onboardingComplete && <Onboarding onComplete={completeOnboarding} />}
    </div>
  );
}

export default App;

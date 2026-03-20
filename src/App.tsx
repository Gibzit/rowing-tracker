import { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { useTrainingData } from './hooks/useTrainingData';
import { useDarkMode } from './hooks/useDarkMode';
import { paceToSeconds } from './utils/paceUtils';
import { computePersonalBests, isNewPB } from './utils/personalBests';
import { computeStreaks } from './utils/streakUtils';
import { checkAchievements, getAchievementDef } from './utils/achievements';
import type { AchievementDef, AchievementId, UnlockedAchievement } from './utils/achievements';
import { getWeekSessions } from './utils/combinedPlan';
import type { SessionRecord } from './utils/storage';
import type { ViewType } from './types';
import Header from './components/Header';
import WeekView from './components/WeekView';
import WeeklySummary from './components/WeeklySummary';
import ResetButton from './components/ResetButton';
import DataManagement from './components/DataManagement';
import BottomNav from './components/BottomNav';
import PBCelebration from './components/PBCelebration';
import ViewTransition from './components/ViewTransition';
import WeekCelebration from './components/WeekCelebration';
import Onboarding from './components/Onboarding';
import AchievementCelebration from './components/AchievementCelebration';
import AchievementBadges from './components/AchievementBadges';
import ErrorBoundary from './components/ErrorBoundary';
import GenerateWeekBanner from './components/GenerateWeekBanner';
import ProgressGrid from './components/ProgressGrid';
import ApiKeySettings from './components/ApiKeySettings';
import { useApiKey } from './hooks/useApiKey';

// Lazy-load non-training views for code splitting
const ChartsView = lazy(() => import('./components/views/ChartsView'));
const PersonalBestsView = lazy(() => import('./components/views/PersonalBestsView'));
const CalendarView = lazy(() => import('./components/views/CalendarView'));
const ComparisonView = lazy(() => import('./components/views/ComparisonView'));

function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-[#00d2ff] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
    unlockAchievements,
    logRestDay,
    undoRestDay,
    coreCompleted,
    coreTotal,
    currentWeek,
    totalWeeks,
    all24Complete,
    isWeekComplete,
    generateNextWeek,
  } = useTrainingData();

  const { theme, cycleTheme } = useDarkMode();
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const [activeView, setActiveView] = useState<ViewType>('training');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [pbCelebration, setPbCelebration] = useState<{ label: string; pace: string } | null>(null);
  const [celebration, setCelebration] = useState<number | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<AchievementDef[]>([]);

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

  const restDays = data.restDays || [];

  const streakInfo = useMemo(
    () => computeStreaks(data.sessions, restDays),
    [data.sessions, restDays]
  );

  // Check if today already has a completed training session
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayHasActivity = useMemo(() => {
    return Object.values(data.sessions).some(
      (r) => r.completed && r.completedDate === todayStr
    );
  }, [data.sessions, todayStr]);

  const handleLogRestDay = useCallback(() => {
    logRestDay(todayStr);
  }, [logRestDay, todayStr]);

  const handleUndoRestDay = useCallback(() => {
    undoRestDay(todayStr);
  }, [undoRestDay, todayStr]);

  // Achievement detection
  const earnedAchievements = useMemo(
    () => checkAchievements(data, combinedPlan, streakInfo),
    [data, combinedPlan, streakInfo]
  );

  const achievementReportedRef = useRef<Set<AchievementId>>(new Set());

  // Initialize reported set with already-unlocked achievements on mount
  useEffect(() => {
    const existing = data.achievements || [];
    existing.forEach((a) => achievementReportedRef.current.add(a.id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const alreadyUnlocked = new Set((data.achievements || []).map((a) => a.id));
    const newlyEarned = earnedAchievements.filter(
      (id) => !alreadyUnlocked.has(id) && !achievementReportedRef.current.has(id)
    );

    if (newlyEarned.length > 0) {
      newlyEarned.forEach((id) => achievementReportedRef.current.add(id));

      // Persist the new achievements
      const newUnlocks: UnlockedAchievement[] = newlyEarned.map((id) => ({
        id,
        unlockedDate: new Date().toISOString().split('T')[0],
      }));
      unlockAchievements(newUnlocks);

      // Queue celebrations
      const defs = newlyEarned.map((id) => getAchievementDef(id));
      setAchievementQueue((prev) => [...prev, ...defs]);
    }
  }, [earnedAchievements, data.achievements, unlockAchievements]);

  const handleAchievementDone = useCallback(() => {
    setAchievementQueue((prev) => prev.slice(1));
  }, []);

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

  const handleGoToTraining = useCallback(() => {
    setActiveView('training');
  }, []);

  return (
    <ErrorBoundary>
      <div className="max-w-lg mx-auto bg-gray-50 dark:bg-[#0b1326] min-h-dvh pb-20">
        <Header
          coreCompleted={coreCompleted}
          coreTotal={coreTotal}
          theme={theme}
          onToggleTheme={cycleTheme}
          currentStreak={streakInfo.currentStreak}
          longestStreak={streakInfo.longestStreak}
          restDays={restDays}
          todayHasActivity={todayHasActivity}
          onLogRestDay={handleLogRestDay}
          onUndoRestDay={handleUndoRestDay}
        />

        <ViewTransition viewKey={activeView}>
          {activeView === 'training' && (
            <>
              <ProgressGrid
                totalWeeks={totalWeeks}
                currentWeek={currentWeek}
                selectedWeek={selectedWeek}
                isWeekComplete={isWeekComplete}
                onSelectWeek={setSelectedWeek}
              />
              <WeeklySummary weekNumber={selectedWeek} sessions={weekSessions} getSession={getSession} />
              <AchievementBadges achievements={data.achievements || []} />
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
                apiKey={apiKey}
                onSetupRequired={() => setShowApiSettings(true)}
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

          <Suspense fallback={<ViewLoader />}>
            {activeView === 'charts' && (
              <ErrorBoundary>
                <ChartsView sessions={data.sessions} plan={combinedPlan} onGoToTraining={handleGoToTraining} />
              </ErrorBoundary>
            )}
            {activeView === 'pbs' && (
              <ErrorBoundary>
                <PersonalBestsView sessions={data.sessions} plan={combinedPlan} onGoToTraining={handleGoToTraining} />
              </ErrorBoundary>
            )}
            {activeView === 'calendar' && (
              <ErrorBoundary>
                <CalendarView sessions={data.sessions} restDays={restDays} plan={combinedPlan} />
              </ErrorBoundary>
            )}
            {activeView === 'compare' && (
              <ErrorBoundary>
                <ComparisonView sessions={data.sessions} plan={combinedPlan} onGoToTraining={handleGoToTraining} />
              </ErrorBoundary>
            )}
          </Suspense>
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

        {achievementQueue.length > 0 && (
          <AchievementCelebration
            achievement={achievementQueue[0]}
            onDone={handleAchievementDone}
          />
        )}

        {!data.onboardingComplete && <Onboarding onComplete={completeOnboarding} />}

        {showApiSettings && (
          <ApiKeySettings
            currentKey={apiKey}
            onSave={setApiKey}
            onClear={clearApiKey}
            onClose={() => setShowApiSettings(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;

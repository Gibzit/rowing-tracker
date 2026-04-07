import { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense, type ReactNode } from 'react';
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
import WeekCelebration from './components/WeekCelebration';
import Onboarding from './components/Onboarding';
import AchievementCelebration from './components/AchievementCelebration';
import AchievementBadges from './components/AchievementBadges';
import ErrorBoundary from './components/ErrorBoundary';
import GenerateWeekBanner from './components/GenerateWeekBanner';
import ProgressGrid from './components/ProgressGrid';
import ApiKeySettings from './components/ApiKeySettings';
import ChartsSkeleton from './components/skeletons/ChartsSkeleton';
import PBsSkeleton from './components/skeletons/PBsSkeleton';
import CalendarSkeleton from './components/skeletons/CalendarSkeleton';
import CompareSkeleton from './components/skeletons/CompareSkeleton';
import { useApiKey } from './hooks/useApiKey';

/** Hook to track which views have been visited (for lazy mounting). */
function useVisitedViews(activeView: ViewType) {
  const [visited, setVisited] = useState<Set<ViewType>>(() => new Set([activeView]));
  useEffect(() => {
    setVisited(prev => {
      if (prev.has(activeView)) return prev;
      const next = new Set(prev);
      next.add(activeView);
      return next;
    });
  }, [activeView]);
  return visited;
}

// Lazy-load non-training views for code splitting
const ChartsView = lazy(() => import('./components/views/ChartsView'));
const PersonalBestsView = lazy(() => import('./components/views/PersonalBestsView'));
const CalendarView = lazy(() => import('./components/views/CalendarView'));
const ComparisonView = lazy(() => import('./components/views/ComparisonView'));
const PlanEditorModal = lazy(() => import('./components/planEditor/PlanEditorModal'));
const PlanManagerModal = lazy(() => import('./components/planEditor/PlanManagerModal'));

/** Tab panel that stays in the DOM once mounted, hidden via display:none when inactive. */
function TabPanel({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const wasActive = useRef(active);

  useEffect(() => {
    if (active && !wasActive.current && ref.current) {
      ref.current.style.animation = 'none';
      void ref.current.offsetHeight;
      ref.current.style.animation = 'viewFadeIn 0.2s ease-out';
    }
    wasActive.current = active;
  }, [active]);

  return (
    <div ref={ref} style={active ? undefined : { display: 'none' }}>
      {children}
    </div>
  );
}

function App() {
  const {
    data,
    combinedPlan,
    activePlan,
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
    // Plan management
    initializePlanSystem,
    switchPlan,
    savePlanEdits,
    createPlan,
    deletePlan,
    duplicatePlan,
    setDefaultDragFactor,
  } = useTrainingData();

  const { theme, cycleTheme } = useDarkMode();
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const [activeView, setActiveView] = useState<ViewType>('training');
  const visitedViews = useVisitedViews(activeView);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [showPlanManager, setShowPlanManager] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [pbCelebration, setPbCelebration] = useState<{ label: string; pace: string } | null>(null);
  const [celebration, setCelebration] = useState<number | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<AchievementDef[]>([]);
  const [showDfPrompt, setShowDfPrompt] = useState<number | null>(null);
  const [compareSlots, setCompareSlots] = useState<[string | null, string | null]>([null, null]);

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
    const timer = setTimeout(() => {
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
    }, 300);
    return () => clearTimeout(timer);
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
      // First-save default drag factor prompt
      if (partial.dragFactor !== undefined && !data.defaultDragFactor) {
        setShowDfPrompt(partial.dragFactor);
      }
    },
    [updateSession, currentPBs, combinedPlan, data.defaultDragFactor]
  );

  const handleGoToTraining = useCallback(() => {
    setActiveView('training');
  }, []);

  const handleTogglePin = useCallback(
    (key: string) => {
      setCompareSlots((prev) => {
        // If already pinned, unpin it (always takes priority)
        if (prev[0] === key) return [prev[1], null];
        if (prev[1] === key) return [prev[0], null];

        // Fill empty slot
        if (prev[0] === null) return [key, prev[1]];
        if (prev[1] === null) {
          // Second pin filled — auto-navigate to compare (1→2 transition only)
          setTimeout(() => setActiveView('compare'), 0);
          return [prev[0], key];
        }

        // Both full — replace oldest (slot 0). No auto-navigate.
        return [key, prev[1]];
      });
    },
    []
  );

  const handleClearCompare = useCallback(() => {
    setCompareSlots([null, null]);
  }, []);

  const handleManagePlans = useCallback(() => {
    // Initialize the plan system on first use
    if (!data.plans || data.plans.length === 0) {
      initializePlanSystem();
    }
    setShowPlanManager(true);
  }, [data.plans, initializePlanSystem]);

  const handleEditPlan = useCallback(() => {
    // Initialize the plan system on first use
    if (!data.plans || data.plans.length === 0) {
      initializePlanSystem();
    }
    setShowPlanEditor(true);
  }, [data.plans, initializePlanSystem]);

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
          activePlanName={activePlan?.name}
          onManagePlans={handleManagePlans}
        />

        <TabPanel active={activeView === 'training'}>
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
            onEditPlan={handleEditPlan}
            defaultDragFactor={data.defaultDragFactor}
            compareSlots={compareSlots}
            onTogglePin={handleTogglePin}
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
        </TabPanel>

        {visitedViews.has('charts') && (
          <Suspense fallback={<ChartsSkeleton />}>
            <TabPanel active={activeView === 'charts'}>
              <ErrorBoundary>
                <ChartsView sessions={data.sessions} plan={combinedPlan} onGoToTraining={handleGoToTraining} />
              </ErrorBoundary>
            </TabPanel>
          </Suspense>
        )}

        {visitedViews.has('pbs') && (
          <Suspense fallback={<PBsSkeleton />}>
            <TabPanel active={activeView === 'pbs'}>
              <ErrorBoundary>
                <PersonalBestsView sessions={data.sessions} plan={combinedPlan} onGoToTraining={handleGoToTraining} />
              </ErrorBoundary>
            </TabPanel>
          </Suspense>
        )}

        {visitedViews.has('calendar') && (
          <Suspense fallback={<CalendarSkeleton />}>
            <TabPanel active={activeView === 'calendar'}>
              <ErrorBoundary>
                <CalendarView sessions={data.sessions} restDays={restDays} plan={combinedPlan} />
              </ErrorBoundary>
            </TabPanel>
          </Suspense>
        )}

        {visitedViews.has('compare') && (
          <Suspense fallback={<CompareSkeleton />}>
            <TabPanel active={activeView === 'compare'}>
              <ErrorBoundary>
                <ComparisonView
                  sessions={data.sessions}
                  plan={combinedPlan}
                  compareSlots={compareSlots}
                  onClearCompare={handleClearCompare}
                  currentWeek={currentWeek}
                />
              </ErrorBoundary>
            </TabPanel>
          </Suspense>
        )}

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

        {showDfPrompt !== null && (
          <div
            role="status"
            aria-live="polite"
            className="fixed left-4 right-4 z-50"
            style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px) + 3.5rem)', animation: 'toastSlideIn 0.25s ease-out' }}
          >
            <div className="max-w-md mx-auto bg-white dark:bg-[#1a2640] rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-white/[0.06] flex items-center gap-3">
              <p className="flex-1 text-sm text-gray-700 dark:text-gray-200">
                Use <strong>{showDfPrompt}</strong> as your default power level?
              </p>
              <button
                onClick={() => {
                  setDefaultDragFactor(showDfPrompt!);
                  setShowDfPrompt(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider btn-primary-gradient min-h-[44px] touch-manipulation"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDfPrompt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-100 dark:bg-[#0f1b33] text-gray-600 dark:text-gray-400 min-h-[44px] touch-manipulation"
              >
                No
              </button>
            </div>
          </div>
        )}

        {compareSlots[0] !== null && compareSlots[1] === null && (
          <div
            role="status"
            aria-live="polite"
            className="fixed left-4 right-4 z-40"
            style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="max-w-md mx-auto bg-white dark:bg-[#1a2640] rounded-2xl px-4 py-3 shadow-lg border border-gray-200 dark:border-white/[0.06] flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                1 selected — tap another to compare
              </p>
              <button
                onClick={() => setCompareSlots([null, null])}
                className="text-gray-400 dark:text-[#5a6580] hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Cancel comparison"
              >
                ✕
              </button>
            </div>
          </div>
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

        {/* Plan Editor Modal */}
        {showPlanEditor && activePlan && (
          <Suspense fallback={null}>
            <PlanEditorModal
              plan={activePlan}
              sessions={data.sessions}
              onSave={savePlanEdits}
              onClose={() => setShowPlanEditor(false)}
              scrollToWeek={selectedWeek}
            />
          </Suspense>
        )}

        {/* Plan Manager Modal */}
        {showPlanManager && data.plans && data.activePlanId && (
          <Suspense fallback={null}>
            <PlanManagerModal
              plans={data.plans}
              activePlanId={data.activePlanId}
              onSwitchPlan={switchPlan}
              onCreatePlan={createPlan}
              onDeletePlan={deletePlan}
              onDuplicatePlan={duplicatePlan}
              onClose={() => setShowPlanManager(false)}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TRAINING_PLAN } from '../data/trainingPlan';
import {
  type StoredData,
  type SessionRecord,
  type TrainingPlan,
  loadData,
  saveData,
  createDefault,
  createEmptySession,
  sessionKey,
  generateId,
} from '../utils/storage';
import type { UnlockedAchievement } from '../utils/achievements';
import { getCombinedPlan, getActivePlan } from '../utils/combinedPlan';
import { generateWeekSessions } from '../utils/generateWeek';
import { getPlanTotalWeeks, addWeekToPlan } from '../utils/planUtils';
import { PETE_PLAN_ID } from '../data/planTemplates';

export function useTrainingData() {
  const [data, setData] = useState<StoredData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const combinedPlan = useMemo(() => getCombinedPlan(data), [data]);
  const activePlan = useMemo(() => getActivePlan(data), [data]);

  const getSession = useCallback(
    (week: number, day: number): SessionRecord => {
      return data.sessions[sessionKey(week, day)] || createEmptySession();
    },
    [data.sessions]
  );

  const updateSession = useCallback(
    (week: number, day: number, partial: Partial<SessionRecord>) => {
      setData((prev) => {
        const key = sessionKey(week, day);
        const existing = prev.sessions[key] || createEmptySession();
        return {
          ...prev,
          sessions: { ...prev.sessions, [key]: { ...existing, ...partial } },
        };
      });
    },
    []
  );

  const toggleComplete = useCallback((week: number, day: number) => {
    setData((prev) => {
      const key = sessionKey(week, day);
      const existing = prev.sessions[key] || createEmptySession();
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [key]: {
            ...existing,
            completed: !existing.completed,
            completedDate: !existing.completed
              ? new Date().toISOString().split('T')[0]
              : undefined,
          },
        },
      };
    });
  }, []);

  const toggleOptional = useCallback((week: number) => {
    setData((prev) => ({
      ...prev,
      optionalVisible: {
        ...prev.optionalVisible,
        [week]: !prev.optionalVisible[week],
      },
    }));
  }, []);

  // Legacy: add custom session via customSessions (non-plan mode)
  // or via plan editor (plan mode)
  const addCustomSession = useCallback(
    (week: number, label: string, description: string) => {
      setData((prev) => {
        const plan = getActivePlan(prev);
        if (plan) {
          // Plan mode: add to the active plan's sessions
          // Use dayNumber >= 100 for custom sessions added via WeekView so delete button shows
          const weekSessions = plan.sessions.filter((s) => s.weekNumber === week);
          const maxDay = weekSessions.length > 0
            ? Math.max(...weekSessions.map((s) => s.dayNumber))
            : 0;
          const nextDay = Math.max(maxDay, 99) + 1;
          const newSession = {
            weekNumber: week,
            dayNumber: nextDay,
            label,
            description,
            isOptional: true,
          };
          const updatedPlan = {
            ...plan,
            sessions: [...plan.sessions, newSession],
          };
          return {
            ...prev,
            plans: (prev.plans || []).map((p) =>
              p.id === updatedPlan.id ? updatedPlan : p
            ),
          };
        }

        // Legacy mode
        const existing = prev.customSessions[week] || [];
        const nextDay = existing.length > 0
          ? Math.max(...existing.map((s) => s.dayNumber)) + 1
          : 100;
        const newSession = {
          weekNumber: week,
          dayNumber: nextDay,
          label,
          description,
          isOptional: true,
        };
        return {
          ...prev,
          customSessions: {
            ...prev.customSessions,
            [week]: [...existing, newSession],
          },
        };
      });
    },
    []
  );

  const deleteCustomSession = useCallback(
    (week: number, dayNumber: number) => {
      setData((prev) => {
        const key = sessionKey(week, dayNumber);
        const plan = getActivePlan(prev);
        if (plan) {
          // Plan mode: remove from active plan's sessions
          const updatedPlan = {
            ...plan,
            sessions: plan.sessions.filter(
              (s) => !(s.weekNumber === week && s.dayNumber === dayNumber)
            ),
          };
          const { [key]: _, ...remainingSessions } = prev.sessions;
          return {
            ...prev,
            plans: (prev.plans || []).map((p) =>
              p.id === updatedPlan.id ? updatedPlan : p
            ),
            sessions: remainingSessions,
          };
        }

        // Legacy mode
        const existing = prev.customSessions[week] || [];
        const filtered = existing.filter((s) => s.dayNumber !== dayNumber);
        const { [key]: _, ...remainingSessions } = prev.sessions;
        return {
          ...prev,
          customSessions: {
            ...prev.customSessions,
            [week]: filtered,
          },
          sessions: remainingSessions,
        };
      });
    },
    []
  );

  const resetAll = useCallback(() => {
    setData(createDefault());
  }, []);

  const importData = useCallback((newData: StoredData) => {
    setData(newData);
  }, []);

  const completeOnboarding = useCallback(() => {
    setData((prev) => ({ ...prev, onboardingComplete: true }));
  }, []);

  const unlockAchievements = useCallback((newAchievements: UnlockedAchievement[]) => {
    setData((prev) => ({
      ...prev,
      achievements: [...(prev.achievements || []), ...newAchievements],
    }));
  }, []);

  const logRestDay = useCallback((date: string) => {
    setData((prev) => {
      const existing = prev.restDays || [];
      if (existing.includes(date)) return prev;
      return { ...prev, restDays: [...existing, date] };
    });
  }, []);

  const undoRestDay = useCallback((date: string) => {
    setData((prev) => ({
      ...prev,
      restDays: (prev.restDays || []).filter((d) => d !== date),
    }));
  }, []);

  // --- Plan management ---

  /** Initialize the plan system by migrating existing data into a Pete Plan */
  const initializePlanSystem = useCallback(() => {
    setData((prev) => {
      if (prev.plans && prev.plans.length > 0) return prev; // already initialized

      // Build the Pete Plan from TRAINING_PLAN + custom + extra
      const custom = Object.values(prev.customSessions || {}).flat();
      const allSessions = [...TRAINING_PLAN, ...custom, ...(prev.extraWeeks || [])];

      const petePlan: TrainingPlan = {
        id: PETE_PLAN_ID,
        name: 'Pete Plan',
        description: 'A progressive 24-week rowing training plan.',
        createdAt: new Date().toISOString(),
        sessions: allSessions,
        history: [],
      };

      return {
        ...prev,
        activePlanId: PETE_PLAN_ID,
        plans: [petePlan],
        planSessions: {},
        // Clear legacy fields since they're now in the plan
        customSessions: {},
        extraWeeks: [],
      };
    });
  }, []);

  /** Switch to a different plan. Archives current plan's data, loads target plan's data. */
  const switchPlan = useCallback((planId: string) => {
    setData((prev) => {
      if (!prev.activePlanId || prev.activePlanId === planId) return prev;
      const planSessions = { ...(prev.planSessions || {}) };

      // Archive current plan's session records
      planSessions[prev.activePlanId] = {
        sessions: prev.sessions,
        optionalVisible: prev.optionalVisible,
      };

      // Load target plan's session records (or empty)
      const target = planSessions[planId];
      const newSessions = target?.sessions || {};
      const newOptionalVisible = target?.optionalVisible || {};

      // Remove target from archive (it's now active)
      delete planSessions[planId];

      return {
        ...prev,
        activePlanId: planId,
        sessions: newSessions,
        optionalVisible: newOptionalVisible,
        planSessions,
      };
    });
  }, []);

  /** Save edits to the active plan */
  const savePlanEdits = useCallback((updatedPlan: TrainingPlan) => {
    setData((prev) => ({
      ...prev,
      plans: (prev.plans || []).map((p) =>
        p.id === updatedPlan.id ? updatedPlan : p
      ),
    }));
  }, []);

  /** Create a new plan and switch to it */
  const createPlan = useCallback((plan: TrainingPlan) => {
    setData((prev) => {
      const planSessions = { ...(prev.planSessions || {}) };

      // Archive current plan's data if there's an active plan
      if (prev.activePlanId) {
        planSessions[prev.activePlanId] = {
          sessions: prev.sessions,
          optionalVisible: prev.optionalVisible,
        };
      }

      return {
        ...prev,
        activePlanId: plan.id,
        plans: [...(prev.plans || []), plan],
        sessions: {},
        optionalVisible: {},
        planSessions,
      };
    });
  }, []);

  /** Delete a plan (cannot delete the last plan) */
  const deletePlan = useCallback((planId: string) => {
    setData((prev) => {
      const plans = (prev.plans || []).filter((p) => p.id !== planId);
      if (plans.length === 0) return prev; // don't delete the last plan

      const planSessions = { ...(prev.planSessions || {}) };
      delete planSessions[planId];

      // If deleting the active plan, switch to the first remaining one
      if (prev.activePlanId === planId) {
        const newActivePlan = plans[0];
        const target = planSessions[newActivePlan.id];
        const newSessions = target?.sessions || {};
        const newOptionalVisible = target?.optionalVisible || {};
        delete planSessions[newActivePlan.id];

        return {
          ...prev,
          activePlanId: newActivePlan.id,
          plans,
          sessions: newSessions,
          optionalVisible: newOptionalVisible,
          planSessions,
        };
      }

      return { ...prev, plans, planSessions };
    });
  }, []);

  /** Duplicate a plan (doesn't copy session records, just the plan definition) */
  const duplicatePlan = useCallback((planId: string, newName: string) => {
    setData((prev) => {
      const source = (prev.plans || []).find((p) => p.id === planId);
      if (!source) return prev;

      const newPlan: TrainingPlan = {
        id: generateId(),
        name: newName,
        description: source.description,
        createdAt: new Date().toISOString(),
        sessions: source.sessions.map((s) => ({ ...s })),
        history: [],
      };

      return {
        ...prev,
        plans: [...(prev.plans || []), newPlan],
      };
    });
  }, []);

  // --- Computed values ---

  const totalWeeks = useMemo(() => {
    if (activePlan) {
      return getPlanTotalWeeks(activePlan);
    }
    // Legacy
    if (data.extraWeeks.length === 0) return 24;
    return Math.max(24, ...data.extraWeeks.map((s) => s.weekNumber));
  }, [activePlan, data.extraWeeks]);

  const completedOptionalCount = combinedPlan.filter(
    (s) => s.isOptional && data.sessions[sessionKey(s.weekNumber, s.dayNumber)]?.completed
  ).length;
  const coreTotal = combinedPlan.filter((s) => !s.isOptional).length + completedOptionalCount;
  const coreCompleted = combinedPlan.filter(
    (s) => data.sessions[sessionKey(s.weekNumber, s.dayNumber)]?.completed
  ).length;

  const allCoreComplete = useMemo(() => {
    const coreSessions = combinedPlan.filter((s) => !s.isOptional);
    if (coreSessions.length === 0) return false;
    return coreSessions.every(
      (s) => data.sessions[sessionKey(s.weekNumber, s.dayNumber)]?.completed
    );
  }, [data.sessions, combinedPlan]);

  const currentWeek = useMemo(() => {
    for (let w = 1; w <= totalWeeks; w++) {
      const coreSessions = combinedPlan.filter(
        (s) => s.weekNumber === w && !s.isOptional
      );
      const allDone = coreSessions.every(
        (s) => data.sessions[sessionKey(s.weekNumber, s.dayNumber)]?.completed
      );
      if (!allDone) return w;
    }
    return totalWeeks;
  }, [data.sessions, combinedPlan, totalWeeks]);

  const isWeekComplete = useCallback(
    (week: number): boolean => {
      const coreSessions = combinedPlan.filter(
        (s) => s.weekNumber === week && !s.isOptional
      );
      return coreSessions.every(
        (s) => data.sessions[sessionKey(s.weekNumber, s.dayNumber)]?.completed
      );
    },
    [data.sessions, combinedPlan]
  );

  const generateNextWeek = useCallback(() => {
    setData((prev) => {
      const plan = getActivePlan(prev);
      if (plan) {
        // Plan mode: add generated week to the active plan's sessions
        const maxWeek = getPlanTotalWeeks(plan);
        const nextWeekNum = maxWeek + 1;
        const newSessions = generateWeekSessions(nextWeekNum);
        const updatedPlan = addWeekToPlan(plan, newSessions);
        return {
          ...prev,
          plans: (prev.plans || []).map((p) =>
            p.id === updatedPlan.id ? updatedPlan : p
          ),
        };
      }

      // Legacy mode
      const currentMax = prev.extraWeeks.length > 0
        ? Math.max(...prev.extraWeeks.map((s) => s.weekNumber))
        : 24;
      const nextWeekNum = currentMax + 1;
      const newSessions = generateWeekSessions(nextWeekNum);
      return {
        ...prev,
        extraWeeks: [...prev.extraWeeks, ...newSessions],
      };
    });
  }, []);

  return {
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
    coreCompleted,
    coreTotal,
    currentWeek,
    totalWeeks,
    all24Complete: allCoreComplete,
    isWeekComplete,
    generateNextWeek,
    importData,
    completeOnboarding,
    unlockAchievements,
    logRestDay,
    undoRestDay,
    // Plan management
    initializePlanSystem,
    switchPlan,
    savePlanEdits,
    createPlan,
    deletePlan,
    duplicatePlan,
  };
}

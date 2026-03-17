import { useState, useEffect, useCallback, useMemo } from 'react';
import { TRAINING_PLAN } from '../data/trainingPlan';
import {
  type StoredData,
  type SessionRecord,
  loadData,
  saveData,
  createDefault,
  createEmptySession,
  sessionKey,
} from '../utils/storage';
import type { UnlockedAchievement } from '../utils/achievements';
import { getCombinedPlan } from '../utils/combinedPlan';
import { generateWeekSessions } from '../utils/generateWeek';

export function useTrainingData() {
  const [data, setData] = useState<StoredData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const combinedPlan = useMemo(() => getCombinedPlan(data), [data]);

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

  const addCustomSession = useCallback(
    (week: number, label: string, description: string) => {
      setData((prev) => {
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
        const existing = prev.customSessions[week] || [];
        const filtered = existing.filter((s) => s.dayNumber !== dayNumber);
        const key = sessionKey(week, dayNumber);
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
      if (existing.includes(date)) return prev; // already logged
      return { ...prev, restDays: [...existing, date] };
    });
  }, []);

  const undoRestDay = useCallback((date: string) => {
    setData((prev) => ({
      ...prev,
      restDays: (prev.restDays || []).filter((d) => d !== date),
    }));
  }, []);

  const totalWeeks = useMemo(() => {
    if (data.extraWeeks.length === 0) return 24;
    return Math.max(24, ...data.extraWeeks.map((s) => s.weekNumber));
  }, [data.extraWeeks]);

  const completedOptionalCount = combinedPlan.filter(
    (s) => s.isOptional && data.sessions[sessionKey(s.weekNumber, s.dayNumber)]?.completed
  ).length;
  const coreTotal = combinedPlan.filter((s) => !s.isOptional).length + completedOptionalCount;
  const coreCompleted = combinedPlan.filter(
    (s) => data.sessions[sessionKey(s.weekNumber, s.dayNumber)]?.completed
  ).length;

  const all24Complete = useMemo(() => {
    for (let w = 1; w <= 24; w++) {
      const coreSessions = TRAINING_PLAN.filter(
        (s) => s.weekNumber === w && !s.isOptional
      );
      const allDone = coreSessions.every(
        (s) => data.sessions[sessionKey(s.weekNumber, s.dayNumber)]?.completed
      );
      if (!allDone) return false;
    }
    return true;
  }, [data.sessions]);

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
    importData,
    completeOnboarding,
    unlockAchievements,
    logRestDay,
    undoRestDay,
  };
}

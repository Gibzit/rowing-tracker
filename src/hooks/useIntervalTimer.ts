import { useState, useRef, useCallback, useEffect } from 'react';
import { playRestStart, playCountdownBeep, playWorkStart, vibrate } from '../utils/timerAudio';

export type IntervalPhase = 'idle' | 'work' | 'rest';

export interface IntervalTimerState {
  phase: IntervalPhase;
  currentRep: number; // 1-based during active use, 0 when idle
  totalReps: number;
  timeRemaining: number;
  restDuration: number;
  isRunning: boolean;
  isFinished: boolean;
}

interface UseIntervalTimerOptions {
  totalReps: number;
  restDurationSeconds: number;
  onAllComplete?: () => void;
}

const INITIAL_STATE: IntervalTimerState = {
  phase: 'idle',
  currentRep: 0,
  totalReps: 0,
  timeRemaining: 0,
  restDuration: 0,
  isRunning: false,
  isFinished: false,
};

export function useIntervalTimer({
  totalReps,
  restDurationSeconds,
  onAllComplete,
}: UseIntervalTimerOptions) {
  const [state, setState] = useState<IntervalTimerState>({
    ...INITIAL_STATE,
    totalReps,
    restDuration: restDurationSeconds,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onAllCompleteRef = useRef(onAllComplete);
  onAllCompleteRef.current = onAllComplete;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(
    (rep: number) => {
      clearTimer();
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const next = prev.timeRemaining - 1;

          // 3-2-1 countdown beeps
          if (next === 3 || next === 2 || next === 1) {
            playCountdownBeep();
          }

          if (next <= 0) {
            // Rest finished
            clearInterval(intervalRef.current!);
            intervalRef.current = null;

            if (rep < totalReps) {
              // More reps to go — transition to work phase
              playWorkStart();
              vibrate([100, 50, 100, 50, 100, 50, 400]);
              return {
                ...prev,
                timeRemaining: 0,
                isRunning: false,
                phase: 'work' as IntervalPhase,
              };
            } else {
              // Final rest done — all complete
              onAllCompleteRef.current?.();
              return {
                ...prev,
                timeRemaining: 0,
                isRunning: false,
                isFinished: true,
                phase: 'idle' as IntervalPhase,
              };
            }
          }

          return { ...prev, timeRemaining: next };
        });
      }, 1000);
    },
    [clearTimer, totalReps]
  );

  /** Called when user finishes a work rep — starts the rest countdown */
  const startRest = useCallback(() => {
    setState((prev) => {
      if (prev.isFinished) return prev;

      const nextRep = prev.phase === 'idle' ? 1 : prev.currentRep + 1;
      if (nextRep > totalReps) return prev;

      // Audio + haptic for rest start
      playRestStart();
      vibrate([150, 80, 150]);

      return {
        ...prev,
        phase: 'rest' as IntervalPhase,
        currentRep: nextRep,
        timeRemaining: restDurationSeconds,
        isRunning: true,
        isFinished: false,
      };
    });
  }, [totalReps, restDurationSeconds]);

  // Start the countdown whenever we transition to rest phase with running=true
  // We watch for state changes and kick off the interval
  const prevPhaseRef = useRef(state.phase);
  const prevRunningRef = useRef(state.isRunning);

  useEffect(() => {
    if (
      state.phase === 'rest' &&
      state.isRunning &&
      (prevPhaseRef.current !== 'rest' || !prevRunningRef.current)
    ) {
      startCountdown(state.currentRep);
    }
    prevPhaseRef.current = state.phase;
    prevRunningRef.current = state.isRunning;
  }, [state.phase, state.isRunning, state.currentRep, startCountdown]);

  const pause = useCallback(() => {
    clearTimer();
    setState((prev) => ({ ...prev, isRunning: false }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (state.phase !== 'rest' || state.isRunning || state.timeRemaining <= 0) return;
    setState((prev) => ({ ...prev, isRunning: true }));
    // The useEffect above will detect the running change and start the countdown
  }, [state.phase, state.isRunning, state.timeRemaining]);

  const reset = useCallback(() => {
    clearTimer();
    setState({
      ...INITIAL_STATE,
      totalReps,
      restDuration: restDurationSeconds,
    });
  }, [clearTimer, totalReps, restDurationSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    ...state,
    startRest,
    pause,
    resume,
    reset,
  };
}

import { useState, useRef, useCallback, useEffect } from 'react';

interface TimerState {
  timeRemaining: number;
  isRunning: boolean;
  isFinished: boolean;
  totalDuration: number;
}

export function useTimer(onFinish?: () => void) {
  const [state, setState] = useState<TimerState>({
    timeRemaining: 0,
    isRunning: false,
    isFinished: false,
    totalDuration: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((seconds: number) => {
    clearTimer();
    setState({
      timeRemaining: seconds,
      isRunning: true,
      isFinished: false,
      totalDuration: seconds,
    });
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeRemaining <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          onFinishRef.current?.();
          return { ...prev, timeRemaining: 0, isRunning: false, isFinished: true };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setState((prev) => ({ ...prev, isRunning: false }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (state.timeRemaining <= 0 || state.isRunning) return;
    setState((prev) => ({ ...prev, isRunning: true }));
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeRemaining <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          onFinishRef.current?.();
          return { ...prev, timeRemaining: 0, isRunning: false, isFinished: true };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  }, [state.timeRemaining, state.isRunning]);

  const reset = useCallback(() => {
    clearTimer();
    setState({ timeRemaining: 0, isRunning: false, isFinished: false, totalDuration: 0 });
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { ...state, start, pause, resume, reset };
}

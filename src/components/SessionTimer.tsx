import { useTimer } from '../hooks/useTimer';
import { useIntervalTimer } from '../hooks/useIntervalTimer';
import { playTimerFinished, vibrate } from '../utils/timerAudio';

const PRESETS = [
  { label: '1:00', seconds: 60 },
  { label: '1:30', seconds: 90 },
  { label: '2:00', seconds: 120 },
  { label: '3:00', seconds: 180 },
  { label: '4:00', seconds: 240 },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface SessionTimerProps {
  totalReps?: number;
  restDurationSeconds?: number;
  onAllComplete?: () => void;
}

// --- Simple rest timer (original behavior) ---

function SimpleRestTimer() {
  const { timeRemaining, isRunning, isFinished, totalDuration, start, pause, resume, reset } =
    useTimer(() => {
      playTimerFinished();
      vibrate();
    });

  const progress = totalDuration > 0 ? (totalDuration - timeRemaining) / totalDuration : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const isActive = totalDuration > 0;

  return (
    <div className="bg-gray-50 dark:bg-[#1a2640]/50 rounded-lg p-3">
      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-[0.12em]">Rest Timer</p>

      {!isActive && (
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.seconds}
              onClick={() => start(p.seconds)}
              className="px-3 py-1.5 text-xs font-bold font-mono rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/60 transition-colors touch-manipulation"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {isActive && (
        <div className="flex items-center gap-4">
          <TimerRing
            timeRemaining={timeRemaining}
            totalDuration={totalDuration}
            progress={progress}
            strokeDashoffset={strokeDashoffset}
            ringColor={isFinished ? 'text-green-500' : 'text-teal-500'}
            textColor={
              isFinished
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-900 dark:text-[#dae2fd]'
            }
          />

          <div className="flex gap-2 flex-wrap">
            {isRunning ? (
              <button
                onClick={pause}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 transition-colors touch-manipulation"
              >
                Pause
              </button>
            ) : !isFinished ? (
              <button
                onClick={resume}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 transition-colors touch-manipulation"
              >
                Resume
              </button>
            ) : null}
            <button
              onClick={reset}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-gray-200 dark:bg-[#1A3350] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#224058] transition-colors touch-manipulation"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Shared ring component ---

function TimerRing({
  timeRemaining,
  totalDuration,
  progress: _progress,
  strokeDashoffset,
  ringColor,
  textColor,
}: {
  timeRemaining: number;
  totalDuration: number;
  progress: number;
  strokeDashoffset: number;
  ringColor: string;
  textColor: string;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-gray-200 dark:text-[#1A3350]"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={totalDuration > 0 ? strokeDashoffset : circumference}
          className={ringColor}
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-sm font-mono font-bold ${textColor}`}
      >
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
}

// --- Enhanced interval timer ---

function IntervalRestTimer({
  totalReps,
  restDurationSeconds,
  onAllComplete,
}: {
  totalReps: number;
  restDurationSeconds: number;
  onAllComplete?: () => void;
}) {
  const {
    phase,
    currentRep,
    timeRemaining,
    isRunning,
    isFinished,
    startRest,
    pause,
    resume,
    reset,
  } = useIntervalTimer({
    totalReps,
    restDurationSeconds,
    onAllComplete,
  });

  const progress =
    phase === 'rest' && restDurationSeconds > 0
      ? (restDurationSeconds - timeRemaining) / restDurationSeconds
      : phase === 'work'
        ? 1
        : 0;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const ringColor =
    isFinished
      ? 'text-green-500'
      : phase === 'rest'
        ? 'text-[#00d2ff]'
        : phase === 'work'
          ? 'text-amber-400'
          : 'text-teal-500';

  const textColor =
    isFinished
      ? 'text-green-600 dark:text-green-400'
      : 'text-gray-900 dark:text-[#dae2fd]';

  return (
    <div className="bg-gray-50 dark:bg-[#1a2640]/50 rounded-xl p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.12em]">
          Interval Timer
        </p>
        {currentRep > 0 && !isFinished && (
          <span className="text-[10px] font-mono font-bold text-[#00d2ff] bg-[#00d2ff]/10 px-2.5 py-1 rounded-lg">
            Rep {phase === 'work' ? Math.min(currentRep + 1, totalReps) : currentRep} / {totalReps}
          </span>
        )}
      </div>

      {/* Idle state — prompt to start */}
      {phase === 'idle' && !isFinished && (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-xs text-gray-500 dark:text-[#5a6580] text-center">
            Press after completing each rep to start your {formatTime(restDurationSeconds)} rest
          </p>
          <button
            onClick={startRest}
            className="min-h-[44px] px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#00d2ff]/10 text-[#00d2ff] hover:bg-[#00d2ff]/20 transition-colors touch-manipulation"
          >
            Start Rest (Rep 1)
          </button>
        </div>
      )}

      {/* Rest phase — countdown active */}
      {phase === 'rest' && (
        <div className="flex items-center gap-4">
          <TimerRing
            timeRemaining={timeRemaining}
            totalDuration={restDurationSeconds}
            progress={progress}
            strokeDashoffset={strokeDashoffset}
            ringColor={ringColor}
            textColor={textColor}
          />

          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold uppercase tracking-widest text-[#00d2ff] mb-2">
              Rest
            </p>
            <div className="flex gap-2 flex-wrap">
              {isRunning ? (
                <button
                  onClick={pause}
                  className="min-h-[44px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 transition-colors touch-manipulation"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={resume}
                  className="min-h-[44px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 transition-colors touch-manipulation"
                >
                  Resume
                </button>
              )}
              <button
                onClick={reset}
                className="min-h-[44px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-gray-200 dark:bg-[#1A3350] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#224058] transition-colors touch-manipulation"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Work phase — rest just finished, waiting for user to row */}
      {phase === 'work' && (
        <div className="flex items-center gap-4">
          <TimerRing
            timeRemaining={0}
            totalDuration={restDurationSeconds}
            progress={1}
            strokeDashoffset={0}
            ringColor={ringColor}
            textColor="text-amber-500 dark:text-amber-400"
          />

          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold uppercase tracking-widest text-amber-400 dark:text-amber-300 mb-1"
              style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
            >
              Row!
            </p>
            <p className="text-[10px] text-gray-400 dark:text-[#5a6580] mb-2">
              {currentRep + 1 <= totalReps
                ? `Press when rep ${currentRep + 1} is done`
                : 'All reps complete!'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {currentRep + 1 <= totalReps && (
                <button
                  onClick={startRest}
                  className="min-h-[44px] px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#00d2ff]/10 text-[#00d2ff] hover:bg-[#00d2ff]/20 transition-colors touch-manipulation"
                >
                  Start Rest
                </button>
              )}
              <button
                onClick={reset}
                className="min-h-[44px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-gray-200 dark:bg-[#1A3350] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#224058] transition-colors touch-manipulation"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finished state */}
      {isFinished && (
        <div className="flex items-center gap-3 py-2">
          <svg className="w-8 h-8 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              All {totalReps} intervals done!
            </p>
            <p className="text-[10px] text-gray-400 dark:text-[#5a6580] mt-0.5">
              Enter your split paces above
            </p>
          </div>
          <button
            onClick={reset}
            className="min-h-[44px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-gray-200 dark:bg-[#1A3350] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#224058] transition-colors touch-manipulation shrink-0"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

// --- Main export ---

export default function SessionTimer({
  totalReps,
  restDurationSeconds,
  onAllComplete,
}: SessionTimerProps) {
  if (totalReps !== undefined && restDurationSeconds !== undefined) {
    return (
      <IntervalRestTimer
        totalReps={totalReps}
        restDurationSeconds={restDurationSeconds}
        onAllComplete={onAllComplete}
      />
    );
  }

  return <SimpleRestTimer />;
}

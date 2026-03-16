import { useTimer } from '../hooks/useTimer';
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

export default function SessionTimer() {
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
    <div className="bg-gray-50 dark:bg-[#1a3550]/50 rounded-lg p-3">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rest Timer</p>

      {!isActive && (
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.seconds}
              onClick={() => start(p.seconds)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/60 transition-colors touch-manipulation"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {isActive && (
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-gray-200 dark:text-[#1e3a5f]"
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
                strokeDashoffset={strokeDashoffset}
                className={isFinished ? 'text-green-500' : 'text-teal-500'}
              />
            </svg>
            <span
              className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${
                isFinished
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {isRunning ? (
              <button
                onClick={pause}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 transition-colors touch-manipulation"
              >
                Pause
              </button>
            ) : !isFinished ? (
              <button
                onClick={resume}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 transition-colors touch-manipulation"
              >
                Resume
              </button>
            ) : null}
            <button
              onClick={reset}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-200 dark:bg-[#1e3a5f] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#2a4a6b] transition-colors touch-manipulation"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

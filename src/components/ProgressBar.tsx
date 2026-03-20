interface ProgressBarProps {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[#bbc9cf] dark:text-[#5a6580] font-bold tracking-wide text-[10px] uppercase" style={{ letterSpacing: '0.08em' }}>
          {completed} / {total} sessions
        </span>
        <span className={`font-display font-extrabold text-base ${pct === 100 ? 'text-green-500 dark:text-green-400' : 'text-[#00d2ff]'}`}>
          {pct}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-[#1a2640] rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${completed} of ${total} sessions completed`}>
        <div
          className={`h-2 rounded-full transition-all duration-700 ease-out ${
            pct === 100
              ? 'bg-gradient-to-r from-green-500 to-green-400 shadow-[0_0_12px_rgba(27,158,74,0.4)]'
              : 'shadow-[0_0_12px_rgba(0,210,255,0.3)]'
          }`}
          style={{
            width: `${pct}%`,
            ...(pct < 100 ? { background: 'linear-gradient(90deg, #007ea0, #00d2ff, #a5e7ff)' } : {}),
          }}
        />
      </div>
    </div>
  );
}

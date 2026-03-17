interface ProgressBarProps {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400 font-medium">
          {completed} / {total} sessions
        </span>
        <span className={`font-bold ${pct === 100 ? 'text-green-600 dark:text-green-400' : 'text-teal-600 dark:text-teal-400'}`}>
          {pct}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-[#1a3550] rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${completed} of ${total} sessions completed`}>
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
            pct === 100
              ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
              : 'bg-gradient-to-r from-teal-600 to-cyan-500 shadow-[0_0_8px_rgba(13,148,136,0.4)]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

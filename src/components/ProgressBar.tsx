interface ProgressBarProps {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
        <span>
          {completed} / {total} core sessions
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-[#1a3550] rounded-full h-2.5">
        <div
          className="bg-gradient-to-r from-teal-600 to-cyan-500 h-2.5 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(13,148,136,0.4)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

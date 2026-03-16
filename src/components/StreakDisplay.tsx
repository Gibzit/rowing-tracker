interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  if (currentStreak === 0 && longestStreak === 0) return null;

  return (
    <div className="flex items-center justify-between text-sm mb-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-base">🔥</span>
        <span className="font-semibold text-gray-800 dark:text-gray-100">
          {currentStreak} day streak
        </span>
      </div>
      {longestStreak > currentStreak && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Best: {longestStreak} days
        </span>
      )}
    </div>
  );
}

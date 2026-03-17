import ProgressBar from './ProgressBar';
import ThemeToggle from './ThemeToggle';
import StreakDisplay from './StreakDisplay';

type Theme = 'light' | 'dark';

interface HeaderProps {
  coreCompleted: number;
  coreTotal: number;
  theme: Theme;
  onToggleTheme: () => void;
  currentStreak: number;
  longestStreak: number;
  restDays: string[];
  todayHasActivity: boolean;
  onLogRestDay: () => void;
  onUndoRestDay: () => void;
}

export default function Header({ coreCompleted, coreTotal, theme, onToggleTheme, currentStreak, longestStreak, restDays, todayHasActivity, onLogRestDay, onUndoRestDay }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-br from-white to-gray-50 dark:from-[#0f2942] dark:to-[#134e4a] border-b-2 border-gray-200 dark:border-b-teal-600 px-4 py-3 shadow-sm dark:shadow-md dark:shadow-black/20 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <img src={import.meta.env.BASE_URL + 'icon.svg'} alt="" className="w-7 h-7 rounded-lg shadow-sm" />
          <h1 className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-300">Ido's Rowing Tracker</h1>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <StreakDisplay
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        restDays={restDays}
        todayHasActivity={todayHasActivity}
        onLogRestDay={onLogRestDay}
        onUndoRestDay={onUndoRestDay}
      />
      <ProgressBar completed={coreCompleted} total={coreTotal} />
    </header>
  );
}

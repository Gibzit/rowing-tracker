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
    <header className="sticky top-0 z-10 bg-[#F8F5F0]/95 dark:bg-[#06101A]/95 border-b border-gray-200 dark:border-[#1A3350] px-4 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-sm shadow-teal-500/20">
            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h4l3-9 6 18 3-9h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-gray-800 dark:text-gray-100 uppercase" style={{ letterSpacing: '0.04em' }}>
              Rowing Tracker
            </h1>
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] -mt-0.5">
              Ido's Training Log
            </p>
          </div>
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

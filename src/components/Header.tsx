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
    <header className="sticky top-0 z-10 bg-gray-50/80 dark:bg-[#0b1326]/80 backdrop-blur-xl px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a5e7ff, #00d2ff)' }}>
            <svg className="w-[18px] h-[18px] text-[#060e20]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h4l3-9 6 18 3-9h4" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-base font-extrabold tracking-tight text-gray-800 dark:text-[#dae2fd] uppercase" style={{ letterSpacing: '0.05em' }}>
              Velocity
            </h1>
            <p className="text-[10px] font-medium text-gray-400 dark:text-[#5a6580] uppercase tracking-[0.15em] -mt-0.5">
              Rowing Performance
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

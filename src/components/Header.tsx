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
  activePlanName?: string;
  onManagePlans?: () => void;
}

export default function Header({ coreCompleted, coreTotal, theme, onToggleTheme, currentStreak, longestStreak, restDays, todayHasActivity, onLogRestDay, onUndoRestDay, activePlanName, onManagePlans }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-gray-50/80 dark:bg-[#0b1326]/80 backdrop-blur-xl px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a5e7ff, #00d2ff)' }}>
            <svg className="w-5 h-5 text-[#060e20]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h4l3-9 6 18 3-9h4" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg font-extrabold tracking-tight text-gray-800 dark:text-[#dae2fd] uppercase" style={{ letterSpacing: '0.05em' }}>
              Velocity
            </h1>
            <p className="text-[10px] font-medium text-gray-400 dark:text-[#5a6580] uppercase tracking-[0.15em] -mt-0.5">
              Rowing Performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onManagePlans && (
            <button
              onClick={onManagePlans}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-400 dark:text-[#5a6580] hover:text-[#00d2ff] dark:hover:text-[#00d2ff] transition-colors touch-manipulation"
              title={activePlanName ? `Plan: ${activePlanName}` : 'Manage plans'}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </button>
          )}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
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

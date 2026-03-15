import ProgressBar from './ProgressBar';
import ThemeToggle from './ThemeToggle';

type Theme = 'light' | 'dark' | 'system';

interface HeaderProps {
  coreCompleted: number;
  coreTotal: number;
  theme: Theme;
  onToggleTheme: () => void;
}

export default function Header({ coreCompleted, coreTotal, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-bold text-blue-800 dark:text-blue-400">Pete Plan Tracker</h1>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <ProgressBar completed={coreCompleted} total={coreTotal} />
    </header>
  );
}

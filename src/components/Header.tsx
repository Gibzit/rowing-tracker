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
    <header className="sticky top-0 z-10 bg-white dark:bg-gradient-to-br dark:from-[#0f2942] dark:to-[#134e4a] border-b-2 border-gray-200 dark:border-b-teal-600 px-4 py-3 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <img src={import.meta.env.BASE_URL + 'icon.svg'} alt="" className="w-7 h-7 rounded-lg" />
          <h1 className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-300">Ido's Rowing Tracker</h1>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <ProgressBar completed={coreCompleted} total={coreTotal} />
    </header>
  );
}

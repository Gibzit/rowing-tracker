interface OptionalToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export default function OptionalToggle({ visible, onToggle }: OptionalToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full min-h-[44px] text-sm text-blue-600 dark:text-blue-400 font-medium py-2 px-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors mb-3 touch-manipulation"
    >
      {visible ? 'Hide optional sessions (Day 4 & 5)' : 'Show optional sessions (Day 4 & 5)'}
    </button>
  );
}

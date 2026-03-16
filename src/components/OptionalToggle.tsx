interface OptionalToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export default function OptionalToggle({ visible, onToggle }: OptionalToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full min-h-[44px] text-sm text-teal-600 dark:text-teal-400 font-medium py-2 px-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors mb-3 touch-manipulation"
    >
      {visible ? 'Hide optional sessions (Day 4 & 5)' : 'Show optional sessions (Day 4 & 5)'}
    </button>
  );
}

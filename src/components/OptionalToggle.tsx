interface OptionalToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export default function OptionalToggle({ visible, onToggle }: OptionalToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={visible}
      className="w-full min-h-[44px] text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 py-3 px-4 rounded-2xl bg-teal-50 dark:bg-[#00d2ff]/5 hover:bg-teal-100 dark:hover:bg-[#00d2ff]/10 transition-colors mb-4 touch-manipulation"
    >
      {visible ? 'Hide optional sessions (Day 4 & 5)' : 'Show optional sessions (Day 4 & 5)'}
    </button>
  );
}

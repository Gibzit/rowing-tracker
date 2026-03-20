interface GenerateWeekBannerProps {
  nextWeek: number;
  onGenerate: () => void;
}

export default function GenerateWeekBanner({ nextWeek, onGenerate }: GenerateWeekBannerProps) {
  return (
    <div className="mx-4 my-4 p-4 rounded-lg border-2 border-dashed border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20">
      <div className="text-center">
        <p className="text-sm font-extrabold text-teal-700 dark:text-teal-300 mb-1 uppercase tracking-wide">
          All 24 Weeks Complete
        </p>
        <p className="text-xs text-teal-600 dark:text-teal-400 mb-3">
          Ready for more? Generate Week {nextWeek} with intermediate/advanced workouts.
        </p>
        <button
          onClick={onGenerate}
          className="min-h-[44px] px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors touch-manipulation"
        >
          Generate Week {nextWeek}
        </button>
      </div>
    </div>
  );
}

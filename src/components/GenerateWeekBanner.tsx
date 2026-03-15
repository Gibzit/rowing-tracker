interface GenerateWeekBannerProps {
  nextWeek: number;
  onGenerate: () => void;
}

export default function GenerateWeekBanner({ nextWeek, onGenerate }: GenerateWeekBannerProps) {
  return (
    <div className="mx-4 my-4 p-4 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">
      <div className="text-center">
        <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-1">
          🎉 All 24 weeks complete!
        </p>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-3">
          Ready for more? Generate Week {nextWeek} with intermediate/advanced workouts.
        </p>
        <button
          onClick={onGenerate}
          className="min-h-[44px] px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors touch-manipulation"
        >
          Generate Week {nextWeek}
        </button>
      </div>
    </div>
  );
}

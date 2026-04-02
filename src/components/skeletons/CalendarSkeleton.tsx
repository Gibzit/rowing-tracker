export default function CalendarSkeleton() {
  return (
    <div className="p-5">
      <div className="rounded-2xl bg-white dark:bg-[#0f1b33] p-4">
        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-[#1a2640] mb-4" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gray-100 dark:bg-[#1a2640]"
              style={{
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 1.5s infinite ${i * 30}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

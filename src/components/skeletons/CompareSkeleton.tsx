export default function CompareSkeleton() {
  return (
    <div className="p-5">
      <div className="rounded-2xl bg-white dark:bg-[#0f1b33] p-4">
        <div className="h-3 w-28 rounded bg-gray-200 dark:bg-[#1a2640] mb-4" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-white/[0.06] last:border-0">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-[#1a2640]" />
            <div
              className="flex-1 h-3 rounded bg-gray-100 dark:bg-[#1a2640]"
              style={{
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

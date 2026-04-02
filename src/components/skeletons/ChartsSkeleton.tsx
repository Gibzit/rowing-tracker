export default function ChartsSkeleton() {
  return (
    <div className="space-y-4 p-5">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-[#0f1b33] p-4">
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-[#1a2640] mb-4" />
          <div
            className="h-48 rounded-lg bg-gray-100 dark:bg-[#1a2640]"
            style={{
              backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        </div>
      ))}
    </div>
  );
}

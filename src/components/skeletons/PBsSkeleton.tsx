export default function PBsSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {[100, 80, 90, 70, 60].map((w, i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-[#0f1b33] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1a2640]" />
          <div className="flex-1">
            <div
              className="h-3 rounded bg-gray-200 dark:bg-[#1a2640] mb-2"
              style={{
                width: `${w}%`,
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
            <div className="h-2 w-16 rounded bg-gray-100 dark:bg-[#1a2640]" />
          </div>
        </div>
      ))}
    </div>
  );
}

import { useEffect } from 'react';

interface WeekCelebrationProps {
  weekNumber: number;
  onDone: () => void;
}

const confettiColors = ['#0d9488', '#06b6d4', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function WeekCelebration({ weekNumber, onDone }: WeekCelebrationProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      onClick={onDone}
    >
      {/* Confetti particles */}
      {confettiColors.map((color, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${15 + i * 12}%`,
            top: '30%',
            width: 8,
            height: 8,
            borderRadius: i % 2 === 0 ? '50%' : '2px',
            backgroundColor: color,
            animation: `confettiFall ${0.8 + i * 0.15}s ease-in ${i * 0.08}s forwards`,
          }}
        />
      ))}
      {confettiColors.map((color, i) => (
        <span
          key={`b-${i}`}
          className="absolute"
          style={{
            left: `${55 + i * 7}%`,
            top: '25%',
            width: 6,
            height: 10,
            borderRadius: '2px',
            backgroundColor: color,
            animation: `confettiFall ${0.9 + i * 0.12}s ease-in ${i * 0.1}s forwards`,
          }}
        />
      ))}

      {/* Celebration card */}
      <div
        className="bg-white dark:bg-[#0f2438] rounded-2xl p-6 shadow-2xl ring-1 ring-white/10 text-center pointer-events-auto"
        style={{ animation: 'weekCelebrate 0.4s ease-out' }}
      >
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Week {weekNumber} Complete!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Great work — keep it going!
        </p>
      </div>
    </div>
  );
}

import { useEffect } from 'react';

interface WeekCelebrationProps {
  weekNumber: number;
  onDone: () => void;
}

const confettiColors = ['#00d2ff', '#a5e7ff', '#fabd00', '#34c06a', '#5b6baa', '#007ea0'];

export default function WeekCelebration({ weekNumber, onDone }: WeekCelebrationProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      onClick={onDone}
    >
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

      <div
        className="bg-white dark:bg-[#0f1b33] rounded-2xl p-6 shadow-2xl text-center pointer-events-auto"
        style={{ animation: 'weekCelebrate 0.4s ease-out', boxShadow: '0 0 40px rgba(0,210,255,0.1)' }}
      >
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-sm font-display font-extrabold text-gray-900 dark:text-[#dae2fd] uppercase tracking-wide">
          Week {weekNumber} Complete
        </h2>
        <p className="text-xs text-[#5a6580] mt-1">
          Great work -- keep it going!
        </p>
      </div>
    </div>
  );
}

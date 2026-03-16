import { useEffect, useState } from 'react';

interface PBCelebrationProps {
  label: string;
  pace: string;
  onDone: () => void;
}

export default function PBCelebration({ label, pace, onDone }: PBCelebrationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
      <div
        className="bg-white dark:bg-[#0f2438] rounded-2xl p-6 shadow-2xl ring-1 ring-white/10 text-center animate-[pbPop_0.4s_ease-out]"
        style={{ maxWidth: 280 }}
      >
        <div className="text-5xl mb-2">🏆</div>
        <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-1">New Personal Best!</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pace}/500m</p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { AchievementDef } from '../utils/achievements';

interface AchievementCelebrationProps {
  achievement: AchievementDef;
  onDone: () => void;
}

export default function AchievementCelebration({ achievement, onDone }: AchievementCelebrationProps) {
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
        <div className="text-5xl mb-2">{achievement.icon}</div>
        <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mb-1">Achievement Unlocked!</p>
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{achievement.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
      </div>
    </div>
  );
}

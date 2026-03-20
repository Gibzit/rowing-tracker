import { useEffect, useState } from 'react';
import type { AchievementDef } from '../utils/achievements';
import AchievementIcon from './AchievementIcon';

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
      <div
        className="bg-white dark:bg-[#0C1926] rounded-2xl p-6 shadow-2xl ring-1 ring-teal-500/20 text-center animate-[pbPop_0.4s_ease-out]"
        style={{ maxWidth: 280 }}
      >
        <div className="flex justify-center mb-2">
          <AchievementIcon id={achievement.id} className="w-12 h-12" />
        </div>
        <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-[0.12em]">Achievement Unlocked</p>
        <p className="text-base font-extrabold text-gray-900 dark:text-gray-100 mb-1">{achievement.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{achievement.description}</p>
      </div>
    </div>
  );
}

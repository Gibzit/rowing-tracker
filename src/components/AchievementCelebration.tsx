import { useEffect, useRef, useState } from 'react';
import type { AchievementDef } from '../utils/achievements';
import AchievementIcon from './AchievementIcon';

interface AchievementCelebrationProps {
  achievement: AchievementDef;
  onDone: () => void;
}

export default function AchievementCelebration({ achievement, onDone }: AchievementCelebrationProps) {
  const [visible, setVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { overlayRef.current?.focus(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer"
      onClick={onDone}
      onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onDone(); }}
      tabIndex={0}
      role="alertdialog"
      aria-label="Celebration"
    >
      <div
        className="bg-white dark:bg-[#1a2640] rounded-2xl p-6 shadow-2xl text-center animate-[pbPop_0.4s_ease-out]"
        style={{ maxWidth: 280, boxShadow: '0 0 40px rgba(250,189,0,0.15)' }}
      >
        <div className="flex justify-center mb-2">
          <AchievementIcon id={achievement.id} className="w-12 h-12" />
        </div>
        <p className="text-xs font-bold text-[#fabd00] mb-1 uppercase" style={{ letterSpacing: '0.05em' }}>Achievement Unlocked</p>
        <p className="text-base font-display font-extrabold text-gray-900 dark:text-[#dae2fd] mb-1">{achievement.name}</p>
        <p className="text-xs text-[#5a6580]">{achievement.description}</p>
      </div>
    </div>
  );
}

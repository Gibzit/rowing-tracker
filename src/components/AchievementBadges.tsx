import { useState } from 'react';
import { ACHIEVEMENTS } from '../utils/achievements';
import type { UnlockedAchievement } from '../utils/achievements';
import AchievementIcon from './AchievementIcon';

interface AchievementBadgesProps {
  achievements: UnlockedAchievement[];
}

export default function AchievementBadges({ achievements }: AchievementBadgesProps) {
  const [expanded, setExpanded] = useState(false);
  const unlockedIds = new Set(achievements.map((a) => a.id));
  const unlockedCount = unlockedIds.size;

  return (
    <div className="mx-5 mb-5">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`Achievements: ${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`}
        className="w-full flex items-center gap-2.5 bg-white dark:bg-[#0f1b33] rounded-2xl px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a2640] touch-manipulation"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          {unlockedCount === 0 ? (
            <span className="text-[10px] text-[#5a6580] uppercase font-bold" style={{ letterSpacing: '0.08em' }}>Milestones</span>
          ) : (
            <div className="flex gap-1 overflow-hidden">
              {ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).map((a) => (
                <span key={a.id} className="shrink-0" title={a.name} aria-label={a.name} role="img">
                  <AchievementIcon id={a.id} className="w-5 h-5" />
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] font-mono font-bold text-[#5a6580] shrink-0">
          {unlockedCount}/{ACHIEVEMENTS.length}
        </span>
        <span className="text-[#5a6580] text-sm shrink-0" aria-hidden="true">
          {expanded ? '\u25B2' : '\u25BC'}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedIds.has(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  unlocked
                    ? 'bg-white dark:bg-[#0f1b33]'
                    : 'bg-gray-50 dark:bg-[#060e20] opacity-50'
                }`}
              >
                <span className={`shrink-0 ${unlocked ? '' : 'grayscale opacity-50'}`}>
                  <AchievementIcon id={a.id} className="w-6 h-6" />
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-[10px] font-bold leading-tight uppercase ${
                      unlocked
                        ? 'text-gray-900 dark:text-[#dae2fd]'
                        : 'text-gray-400 dark:text-[#404b66]'
                    }`}
                    style={{ letterSpacing: '0.05em' }}
                  >
                    {a.name}
                  </p>
                  <p
                    className={`text-[9px] leading-tight mt-0.5 ${
                      unlocked
                        ? 'text-[#5a6580]'
                        : 'text-gray-400 dark:text-[#404b66]'
                    }`}
                  >
                    {a.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

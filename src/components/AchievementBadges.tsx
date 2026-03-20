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
    <div className="mx-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`Achievements: ${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`}
        className="w-full flex items-center gap-2 bg-white dark:bg-[#0C1926] border border-gray-200 dark:border-[#1A3350] rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-[#132940] touch-manipulation"
      >
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
          {unlockedCount === 0 ? (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">No badges yet</span>
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
        <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 shrink-0">
          {unlockedCount}/{ACHIEVEMENTS.length}
        </span>
        <span className="text-gray-400 dark:text-gray-500 text-sm shrink-0" aria-hidden="true">
          {expanded ? '\u25B2' : '\u25BC'}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedIds.has(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                  unlocked
                    ? 'bg-white dark:bg-[#0C1926] border-teal-200 dark:border-teal-800/50'
                    : 'bg-gray-50 dark:bg-[#050C14] border-gray-200 dark:border-[#132940] opacity-50'
                }`}
              >
                <span className={`shrink-0 ${unlocked ? '' : 'grayscale opacity-50'}`}>
                  <AchievementIcon id={a.id} className="w-6 h-6" />
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-[10px] font-bold leading-tight uppercase tracking-wider ${
                      unlocked
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {a.name}
                  </p>
                  <p
                    className={`text-[9px] leading-tight mt-0.5 ${
                      unlocked
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-600'
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

import { useState } from 'react';
import { ACHIEVEMENTS } from '../utils/achievements';
import type { UnlockedAchievement } from '../utils/achievements';

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
        className="w-full flex items-center gap-2 bg-white dark:bg-[#0f2438] border border-gray-200 dark:border-[#1e3a5f] rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a3550] touch-manipulation"
      >
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
          {unlockedCount === 0 ? (
            <span className="text-sm text-gray-400 dark:text-gray-500">No badges yet</span>
          ) : (
            <div className="flex gap-0.5 overflow-hidden">
              {ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).map((a) => (
                <span key={a.id} className="text-lg shrink-0" title={a.name} aria-label={a.name} role="img">
                  {a.icon}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
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
                    ? 'bg-white dark:bg-[#0f2438] border-teal-200 dark:border-teal-800/50'
                    : 'bg-gray-50 dark:bg-[#0a1520] border-gray-200 dark:border-[#1a3050] opacity-50'
                }`}
              >
                <span className={`text-2xl shrink-0 ${unlocked ? '' : 'grayscale'}`}>
                  {a.icon}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      unlocked
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {a.name}
                  </p>
                  <p
                    className={`text-[10px] leading-tight mt-0.5 ${
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

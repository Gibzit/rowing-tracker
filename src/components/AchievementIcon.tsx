import type { AchievementId } from '../utils/achievements';

interface AchievementIconProps {
  id: AchievementId;
  className?: string;
}

const ICONS: Record<AchievementId, string[]> = {
  // Rowing oar
  'first-stroke': [
    'M4 21l1-1 4.5-4.5',
    'M14 7l-2.5 2.5',
    'M17 4l-6 6 4 4 6-6-4-4z',
    'M3 22l2-2',
  ],
  // Crossed swords
  'week-warrior': [
    'M14.5 17.5L3 6V3h3l11.5 11.5',
    'M13 7L6 14',
    'M8 2l2 2-2 2',
    'M16 22l-2-2 2-2',
    'M22 8l-2 2-2-2',
    'M2 16l2-2 2 2',
  ],
  // Medal
  'halfway-hero': [
    'M7.21 15L2.66 7.14a2 2 0 01.13-2.2L4.4 2.8A2 2 0 016 2h12a2 2 0 011.6.8l1.6 2.14a2 2 0 01.14 2.2L16.79 15',
    'M12 15a4 4 0 100 8 4 4 0 000-8z',
    'M12 18h.01',
  ],
  // Trophy
  'marathon-rower': [
    'M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7',
    'M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7',
    'M4 22h16',
    'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22',
    'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22',
    'M18 2H6v7a6 6 0 0012 0V2Z',
  ],
  // Lightning bolt
  'speed-demon': [
    'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  ],
  // Crown
  'consistency-king': [
    'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z',
    'M3 20h18',
  ],
  // Flame
  'streak-master': [
    'M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1012 0c0-1.532-1-3.5-2-5-1 2-3 2-4 2z',
  ],
  // Target
  'bonus-hunter': [
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    'M12 18a6 6 0 100-12 6 6 0 000 12z',
    'M12 14a2 2 0 100-4 2 2 0 000 4z',
  ],
  // Bar chart
  'data-nerd': [
    'M18 20V10',
    'M12 20V4',
    'M6 20v-6',
  ],
  // Diamond
  'perfect-week': [
    'M6 3h12l4 6-10 13L2 9l4-6z',
    'M2 9h20',
    'M12 22L8.5 9 12 3l3.5 6L12 22',
  ],
};

// Color palette for each achievement
const ICON_COLORS: Record<AchievementId, string> = {
  'first-stroke': 'text-teal-500',
  'week-warrior': 'text-red-500',
  'halfway-hero': 'text-amber-500',
  'marathon-rower': 'text-amber-500',
  'speed-demon': 'text-yellow-500',
  'consistency-king': 'text-amber-400',
  'streak-master': 'text-orange-500',
  'bonus-hunter': 'text-red-500',
  'data-nerd': 'text-cyan-500',
  'perfect-week': 'text-cyan-400',
};

export default function AchievementIcon({ id, className }: AchievementIconProps) {
  const paths = ICONS[id];
  if (!paths) return null;

  const colorClass = ICON_COLORS[id] || 'text-gray-500';
  const sizeClass = className || 'w-6 h-6';

  return (
    <svg
      className={`${sizeClass} ${colorClass}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

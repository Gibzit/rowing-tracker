import type { SessionDescriptor } from '../data/trainingPlan';

/**
 * Pool of workout templates for generating weeks 25+.
 * These are intermediate/advanced workouts that cycle through
 * progressively, giving variety while building on the Pete Plan foundation.
 */

interface WorkoutTemplate {
  label: string;
  description: string;
}

const DISTANCE_WORKOUTS: WorkoutTemplate[] = [
  { label: '10000m', description: 'Steady-state at your best 10k pace. Aim for a negative split over the second half.' },
  { label: '12000m', description: 'Long steady row. Keep rate ≤24spm and focus on stroke consistency.' },
  { label: '30min', description: 'Row for 30min at a challenging but sustainable pace. Track your distance.' },
  { label: '10000m', description: 'Start 3s slower than PB pace, build to PB pace by 5000m, then push the final 2000m.' },
  { label: '12000m', description: 'Strict 20spm for the full distance. Focus on power per stroke rather than rate.' },
  { label: '45min', description: 'Extended steady-state session. Great aerobic base builder. Keep a consistent split.' },
  { label: '15000m', description: 'Your longest row yet. Pace conservatively — start 5s slower than 10k pace and hold steady.' },
  { label: '30min', description: 'Rate-capped at 22spm. Focus on generating power through the legs and core.' },
];

const INTERVAL_WORKOUTS: WorkoutTemplate[] = [
  { label: '8 x 500m / 2min rest', description: 'Target your best 500m interval pace from recent weeks. Hold it for 7 reps, push the last.' },
  { label: '5 x 1500m / 3min rest', description: 'Find your sweet spot between 1000m and 2000m pace. Keep all reps within 2s of each other.' },
  { label: '4 x 2000m / 4min rest', description: 'Aim for your best 2000m interval pace. Negative split each rep if possible.' },
  { label: '6 x 1000m / 2min rest', description: 'Start at your 5k pace. Try to hold it for all 6 reps — a real test of fitness.' },
  { label: '3 x 3000m / 5min rest', description: 'Longer intervals for endurance. Target a pace between your 5k and 10k pace.' },
  { label: '10 x 500m / 90s rest', description: 'Short rest challenges recovery. Hold a consistent pace across all 10 reps.' },
  { label: '4 x 1500m / 3min rest', description: 'Match your best 1500m interval pace from earlier weeks. Push the final rep.' },
  { label: '2 x 5000m / 5min rest', description: 'Two hard 5k efforts. Row the second one faster than the first.' },
];

const OPTIONAL_DISTANCE: WorkoutTemplate[] = [
  { label: '10000m', description: 'Easy session — keep rate ≤22spm. Focus on technique and recovery.' },
  { label: '8000m', description: 'Moderate effort at 10k pace. A good bridge session between hard days.' },
  { label: '20min', description: 'Free pace — use this to experiment with rate and split combinations.' },
  { label: '3 x 10min / 2min rest', description: 'Steady-state with breaks. Aim for your 30min pace or slightly faster.' },
];

const OPTIONAL_INTERVAL: WorkoutTemplate[] = [
  { label: '6 x 500m / 2min rest', description: 'Familiar format. Compare with your Week 1 pace and see how far you have come.' },
  { label: '5 x 800m / 2min rest', description: 'Hold a consistent pace for 4 reps, then push the last one hard.' },
  { label: '4 x 1000m / 3min rest', description: 'Use your recent 1000m interval pace. Maintain form throughout all reps.' },
  { label: '4 x 2000m / 4min rest', description: 'Match your best pace on reps 1-3, go all-out on rep 4.' },
];

/**
 * Generate a week of workouts for week number `weekNum` (25+).
 * Uses a deterministic rotation through the workout pools based on
 * the week number, so the same week always gets the same workouts.
 */
export function generateWeekSessions(weekNum: number): SessionDescriptor[] {
  const idx = weekNum - 25; // 0-based index into pools

  const d1 = DISTANCE_WORKOUTS[idx % DISTANCE_WORKOUTS.length];
  const d2 = INTERVAL_WORKOUTS[idx % INTERVAL_WORKOUTS.length];
  const d3 = DISTANCE_WORKOUTS[(idx + 4) % DISTANCE_WORKOUTS.length]; // offset to get variety
  const d4 = OPTIONAL_DISTANCE[idx % OPTIONAL_DISTANCE.length];
  const d5 = OPTIONAL_INTERVAL[idx % OPTIONAL_INTERVAL.length];

  return [
    { weekNumber: weekNum, dayNumber: 1, label: d1.label, description: d1.description, isOptional: false },
    { weekNumber: weekNum, dayNumber: 2, label: d2.label, description: d2.description, isOptional: false },
    { weekNumber: weekNum, dayNumber: 3, label: d3.label, description: d3.description, isOptional: false },
    { weekNumber: weekNum, dayNumber: 4, label: d4.label, description: d4.description, isOptional: true },
    { weekNumber: weekNum, dayNumber: 5, label: d5.label, description: d5.description, isOptional: true },
  ];
}

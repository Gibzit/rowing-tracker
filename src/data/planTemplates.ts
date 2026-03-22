import { TRAINING_PLAN } from './trainingPlan';
import type { TrainingPlan } from '../utils/storage';

export const PETE_PLAN_ID = 'pete-plan';

/** The default Pete Plan as a TrainingPlan struct. Used as a template for new plan creation. */
export function createPetePlanTemplate(): TrainingPlan {
  return {
    id: PETE_PLAN_ID,
    name: 'Pete Plan',
    description: 'A progressive 24-week rowing training plan focusing on steady distance and interval work.',
    createdAt: new Date().toISOString(),
    sessions: [...TRAINING_PLAN],
    history: [],
  };
}

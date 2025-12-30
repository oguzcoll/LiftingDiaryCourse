'use server';

import { createWorkout } from '@/data/workouts';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  startedAt: z.date(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validated = createWorkoutSchema.parse(input);
  const workout = await createWorkout(validated);

  revalidatePath('/dashboard');

  return { success: true, workoutId: workout.id };
}

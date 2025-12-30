import { db } from '@/db';
import { workouts } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, gte, lt } from 'drizzle-orm';
import { startOfDay, endOfDay } from 'date-fns';

export async function getUserWorkoutsByDate(date: Date) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return await db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.startedAt, dayStart),
      lt(workouts.startedAt, dayEnd)
    ),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
    orderBy: (workouts, { asc }) => [asc(workouts.startedAt)],
  });
}

export async function createWorkout(data: {
  name?: string;
  startedAt: Date;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name: data.name,
      startedAt: data.startedAt,
    })
    .returning();

  return workout;
}

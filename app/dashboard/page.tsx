import { format, differenceInMinutes } from 'date-fns';
import { getUserWorkoutsByDate } from '@/data/workouts';
import { DatePicker } from '@/components/date-picker';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const dateParam = params.date;
  const date = dateParam ? new Date(dateParam) : new Date();

  const workouts = await getUserWorkoutsByDate(date);

  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Header Section */}
        <div className='space-y-2'>
          <h1 className='text-4xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground'>
            Track your lifting progress and view your workout history
          </p>
        </div>

        {/* Date Picker Section */}
        <div className='flex items-center gap-4'>
          <DatePicker />
        </div>

        {/* Workouts Section */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-semibold tracking-tight'>
              Workouts for {format(date, 'do MMM yyyy')}
            </h2>
            <span className='text-sm text-muted-foreground'>
              {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'}
            </span>
          </div>

          {/* Workout List */}
          {workouts.length > 0 ? (
            <div className='grid gap-4'>
              {workouts.map((workout) => {
                const duration =
                  workout.completedAt && workout.startedAt
                    ? differenceInMinutes(
                        workout.completedAt,
                        workout.startedAt
                      )
                    : null;
                const completedTime = workout.completedAt
                  ? format(workout.completedAt, 'hh:mm a')
                  : 'In progress';

                return (
                  <Card key={workout.id}>
                    <CardHeader>
                      <div className='flex items-start justify-between'>
                        <div className='space-y-1'>
                          <CardTitle>
                            {workout.name || 'Untitled Workout'}
                          </CardTitle>
                          <CardDescription>
                            Completed at {completedTime}
                            {duration !== null && ` • ${duration} minutes`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {workout.workoutExercises.map((workoutExercise) => {
                          const totalSets = workoutExercise.sets.length;
                          const completedSets = workoutExercise.sets.filter(
                            (set) => set.completed
                          ).length;

                          return (
                            <div
                              key={workoutExercise.id}
                              className='flex items-center justify-between border-l-2 border-primary/20 pl-4 py-2'
                            >
                              <div className='space-y-1'>
                                <p className='font-medium'>
                                  {workoutExercise.exercise.name}
                                </p>
                                <p className='text-sm text-muted-foreground'>
                                  {completedSets} of {totalSets} sets completed
                                </p>
                                <div className='text-xs text-muted-foreground space-y-0.5'>
                                  {workoutExercise.sets.map((set) => (
                                    <div key={set.id}>
                                      Set {set.setNumber}: {set.reps} reps
                                      {set.weightKg && ` @ ${set.weightKg} kg`}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className='py-8'>
                <p className='text-center text-muted-foreground'>
                  No workouts logged for this date
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Mock workout data for UI demonstration
const mockWorkouts = [
  {
    id: '1',
    name: 'Morning Strength Training',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 185 },
      { name: 'Squats', sets: 4, reps: 10, weight: 225 },
      { name: 'Deadlifts', sets: 3, reps: 6, weight: 275 },
    ],
    duration: 65,
    completedAt: '09:30 AM',
  },
  {
    id: '2',
    name: 'Evening Cardio',
    exercises: [
      { name: 'Running', sets: 1, reps: 1, weight: 0 },
      { name: 'Jump Rope', sets: 3, reps: 100, weight: 0 },
    ],
    duration: 30,
    completedAt: '06:15 PM',
  },
];

export default function DashboardPage() {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your lifting progress and view your workout history
          </p>
        </div>

        {/* Date Picker Section */}
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[280px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'do MMM yyyy') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Workouts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Workouts for {format(date, 'do MMM yyyy')}
            </h2>
            <span className="text-sm text-muted-foreground">
              {mockWorkouts.length} {mockWorkouts.length === 1 ? 'workout' : 'workouts'}
            </span>
          </div>

          {/* Workout List */}
          {mockWorkouts.length > 0 ? (
            <div className="grid gap-4">
              {mockWorkouts.map((workout) => (
                <Card key={workout.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle>{workout.name}</CardTitle>
                        <CardDescription>
                          Completed at {workout.completedAt} • {workout.duration} minutes
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {workout.exercises.map((exercise, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between border-l-2 border-primary/20 pl-4 py-2"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{exercise.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {exercise.sets} sets × {exercise.reps} reps
                              {exercise.weight > 0 && ` @ ${exercise.weight} lbs`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
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

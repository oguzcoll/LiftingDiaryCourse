'use client';

import { useState } from 'react';
import { createWorkoutAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function NewWorkoutPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const startedAtValue = formData.get('startedAt') as string;

      const result = await createWorkoutAction({
        name: name || undefined,
        startedAt: startedAtValue ? new Date(startedAtValue) : new Date(),
      });

      if (result.success) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to create workout:', error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">New Workout</h1>
          <p className="text-muted-foreground">
            Start a new workout session
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
            <CardDescription>
              Enter the details for your workout. You can add exercises after creating the workout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Workout Name (Optional)</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Chest Day, Leg Day"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  Leave blank for an untitled workout
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startedAt">Start Time</Label>
                <Input
                  id="startedAt"
                  name="startedAt"
                  type="datetime-local"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  When did you start this workout?
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating...' : 'Create Workout'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

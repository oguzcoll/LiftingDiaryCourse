# Data Mutations

## ⚠️ CRITICAL: Data Mutation Rules

This document outlines the **mandatory** data mutation patterns for this application. These rules are non-negotiable and must be followed without exception.

## Rule 1: Server Actions ONLY

**ALL data mutations (create, update, delete) MUST be done via Server Actions.**

Server Actions are the ONLY approved way to mutate data in this application.

### ✅ CORRECT - Server Action

```typescript
// app/workouts/actions.ts
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
  // Validate input
  const validated = createWorkoutSchema.parse(input);

  // Call data helper
  const workout = await createWorkout(validated);

  // Revalidate cache
  revalidatePath('/dashboard');

  return { success: true, workoutId: workout.id };
}
```

### ❌ INCORRECT - DO NOT DO THIS

```typescript
// ❌ Route Handler - NEVER mutate data this way
// app/api/workouts/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const workout = await db.insert(workouts).values(body);
  return Response.json(workout);
}

// ❌ Client-side mutation - NEVER do this
'use client';
export default function CreateWorkout() {
  async function handleSubmit() {
    await fetch('/api/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// ❌ Direct DB call in Server Action - NEVER do this
'use server';
export async function createWorkout(data: any) {
  // ❌ Don't query DB directly in Server Action
  return await db.insert(workouts).values(data);
}
```

## Rule 2: Colocated actions.ts Files

**ALL Server Actions MUST be defined in colocated `actions.ts` files.**

Server Actions should be placed in `actions.ts` files within the same directory as the components that use them.

### File Structure

```
app/
├── dashboard/
│   ├── page.tsx              # Dashboard page
│   ├── actions.ts            # Dashboard-related actions
│   └── components/
│       └── workout-card.tsx
├── workouts/
│   ├── [id]/
│   │   ├── page.tsx          # Workout detail page
│   │   ├── actions.ts        # Workout detail actions
│   │   └── edit/
│   │       ├── page.tsx      # Edit workout page
│   │       └── actions.ts    # Edit workout actions
│   ├── new/
│   │   ├── page.tsx          # New workout page
│   │   └── actions.ts        # New workout actions
│   └── actions.ts            # General workout actions
```

### Colocation Benefits

- **Discoverability**: Actions are next to the components that use them
- **Organization**: Related mutations are grouped together
- **Maintainability**: Easier to refactor and understand data flow
- **Code Splitting**: Next.js can optimize bundle sizes

## Rule 3: Typed Parameters (NO FormData)

**Server Action parameters MUST be explicitly typed. DO NOT use FormData.**

All Server Actions must accept strongly-typed parameters, never FormData directly.

### ✅ CORRECT - Typed Parameters

```typescript
// app/workouts/actions.ts
'use server';

import { z } from 'zod';

const updateWorkoutSchema = z.object({
  workoutId: z.number(),
  name: z.string().min(1).optional(),
  completedAt: z.date().optional(),
});

type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  const validated = updateWorkoutSchema.parse(input);
  const workout = await updateWorkout(validated);
  return { success: true, workout };
}
```

### ❌ INCORRECT - FormData Parameter

```typescript
// ❌ NEVER DO THIS
'use server';

export async function updateWorkoutAction(formData: FormData) {
  const name = formData.get('name');
  const workoutId = formData.get('workoutId');
  // ... NO type safety, NO validation
}
```

### Client Usage

```typescript
'use client';

import { updateWorkoutAction } from './actions';

export function WorkoutForm({ workoutId }: { workoutId: number }) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Convert FormData to typed object
    await updateWorkoutAction({
      workoutId,
      name: formData.get('name') as string,
      completedAt: new Date(),
    });
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Rule 4: Zod Validation REQUIRED

**ALL Server Actions MUST validate their input using Zod schemas.**

Every Server Action must validate its parameters before processing. This is non-negotiable.

### Validation Pattern

```typescript
'use server';

import { z } from 'zod';
import { createSet } from '@/data/sets';

// 1. Define Zod schema
const createSetSchema = z.object({
  workoutExerciseId: z.number().int().positive(),
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z.number().positive().optional(),
  completed: z.boolean().default(true),
});

// 2. Infer TypeScript type from schema
type CreateSetInput = z.infer<typeof createSetSchema>;

// 3. Server Action with validation
export async function createSetAction(input: CreateSetInput) {
  // Validate and parse input
  const validated = createSetSchema.parse(input);

  // Call data helper with validated data
  const set = await createSet(validated);

  // Revalidate cache
  revalidatePath('/workouts/[id]', 'page');

  return { success: true, set };
}
```

### Error Handling

```typescript
'use server';

import { z } from 'zod';

export async function deleteWorkoutAction(input: { workoutId: number }) {
  try {
    // Validate input
    const { workoutId } = z
      .object({ workoutId: z.number() })
      .parse(input);

    // Perform mutation
    await deleteWorkout(workoutId);

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input: ' + error.errors[0].message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

## Rule 5: Data Directory Helpers for DB Operations

**Server Actions MUST call helper functions in `/data` directory. Never query the database directly in Server Actions.**

The `/data` directory contains helper functions that wrap Drizzle ORM calls and handle authorization.

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│ actions.ts (Server Actions)                                  │
│ • Validate input with Zod                                    │
│ • Call data helpers                                          │
│ • Revalidate cache                                           │
│ • Return success/error responses                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ /data helpers (Database Operations)                          │
│ • Check authentication with auth()                           │
│ • Perform authorization checks                               │
│ • Execute Drizzle ORM queries                                │
│ • Return data or throw errors                                │
└─────────────────────────────────────────────────────────────┘
```

### Example: Creating Data

```typescript
// data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';

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
```

```typescript
// app/workouts/new/actions.ts
'use server';

import { createWorkout } from '@/data/workouts';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const createWorkoutSchema = z.object({
  name: z.string().min(1).optional(),
  startedAt: z.date(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validated = createWorkoutSchema.parse(input);
  const workout = await createWorkout(validated);

  revalidatePath('/dashboard');
  redirect(`/workouts/${workout.id}`);
}
```

### Example: Updating Data

```typescript
// data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

export async function updateWorkout(data: {
  workoutId: number;
  name?: string;
  completedAt?: Date;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify ownership before updating
  const existing = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(eq(workouts.id, data.workoutId), eq(workouts.userId, userId)),
  });

  if (!existing) {
    throw new Error('Workout not found or access denied');
  }

  const [updated] = await db
    .update(workouts)
    .set({
      name: data.name,
      completedAt: data.completedAt,
      updatedAt: new Date(),
    })
    .where(
      and(eq(workouts.id, data.workoutId), eq(workouts.userId, userId))
    )
    .returning();

  return updated;
}
```

```typescript
// app/workouts/[id]/actions.ts
'use server';

import { updateWorkout } from '@/data/workouts';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const updateWorkoutSchema = z.object({
  workoutId: z.number(),
  name: z.string().min(1).optional(),
  completedAt: z.date().optional(),
});

type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  const validated = updateWorkoutSchema.parse(input);
  const workout = await updateWorkout(validated);

  revalidatePath(`/workouts/${workout.id}`);
  revalidatePath('/dashboard');

  return { success: true, workout };
}
```

### Example: Deleting Data

```typescript
// data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

export async function deleteWorkout(workoutId: number) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify ownership before deleting
  const existing = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  });

  if (!existing) {
    throw new Error('Workout not found or access denied');
  }

  await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));

  return { success: true };
}
```

```typescript
// app/workouts/[id]/actions.ts
'use server';

import { deleteWorkout } from '@/data/workouts';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const deleteWorkoutSchema = z.object({
  workoutId: z.number(),
});

export async function deleteWorkoutAction(input: { workoutId: number }) {
  const { workoutId } = deleteWorkoutSchema.parse(input);

  await deleteWorkout(workoutId);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
```

## Rule 6: Authorization in Data Helpers

**ALL data mutation helpers MUST verify user authorization.**

Every mutation helper in `/data` must:

1. Call `await auth()` to get the current user ID
2. Verify the user is authenticated
3. Verify the user owns the resource being modified
4. Throw an error if authorization fails

### Authorization Checklist

- [ ] Function calls `await auth()` to get `userId`
- [ ] Function throws error if `userId` is null
- [ ] For updates/deletes: function verifies resource ownership before mutation
- [ ] All database queries filter by `userId` where applicable
- [ ] No way to bypass authorization with parameters

### Security Example

```typescript
// data/sets.ts
import { db } from '@/db';
import { sets, workoutExercises, workouts } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

export async function updateSet(data: {
  setId: number;
  reps?: number;
  weightKg?: number;
  completed?: boolean;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify the set belongs to a workout owned by the user
  const set = await db.query.sets.findFirst({
    where: eq(sets.id, data.setId),
    with: {
      workoutExercise: {
        with: {
          workout: true,
        },
      },
    },
  });

  if (!set) {
    throw new Error('Set not found');
  }

  if (set.workoutExercise.workout.userId !== userId) {
    throw new Error('Access denied');
  }

  // Now safe to update
  const [updated] = await db
    .update(sets)
    .set({
      reps: data.reps,
      weightKg: data.weightKg,
      completed: data.completed,
    })
    .where(eq(sets.id, data.setId))
    .returning();

  return updated;
}
```

## Rule 7: Cache Revalidation

**Server Actions MUST revalidate affected cache paths after mutations.**

After every successful mutation, revalidate the Next.js cache to ensure users see updated data.

### Revalidation Patterns

```typescript
'use server';

import { revalidatePath } from 'next/cache';

// Pattern 1: Revalidate specific page
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const workout = await createWorkout(input);

  revalidatePath('/dashboard');

  return { success: true, workout };
}

// Pattern 2: Revalidate multiple paths
export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  const workout = await updateWorkout(input);

  revalidatePath('/dashboard');
  revalidatePath(`/workouts/${workout.id}`);

  return { success: true, workout };
}

// Pattern 3: Revalidate dynamic routes
export async function deleteWorkoutExerciseAction(input: DeleteInput) {
  await deleteWorkoutExercise(input);

  // Revalidate all workout detail pages
  revalidatePath('/workouts/[id]', 'page');

  return { success: true };
}
```

### Common Revalidation Scenarios

| Mutation Type | Paths to Revalidate |
|---------------|---------------------|
| Create workout | `/dashboard` |
| Update workout | `/dashboard`, `/workouts/[id]` |
| Delete workout | `/dashboard` |
| Create exercise | `/workouts/[id]`, `/exercises` |
| Update set | `/workouts/[id]` |

## Common Patterns

### Pattern 1: Simple Create

```typescript
// data/workouts.ts
export async function createWorkout(data: { name?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const [workout] = await db
    .insert(workouts)
    .values({ userId, name: data.name, startedAt: new Date() })
    .returning();

  return workout;
}

// app/workouts/new/actions.ts
'use server';

export async function createWorkoutAction(input: { name?: string }) {
  const validated = z.object({ name: z.string().optional() }).parse(input);
  const workout = await createWorkout(validated);
  revalidatePath('/dashboard');
  redirect(`/workouts/${workout.id}`);
}
```

### Pattern 2: Update with Ownership Check

```typescript
// data/workouts.ts
export async function updateWorkout(data: {
  workoutId: number;
  name: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Check ownership
  const existing = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(eq(workouts.id, data.workoutId), eq(workouts.userId, userId)),
  });

  if (!existing) throw new Error('Workout not found');

  const [updated] = await db
    .update(workouts)
    .set({ name: data.name, updatedAt: new Date() })
    .where(eq(workouts.id, data.workoutId))
    .returning();

  return updated;
}
```

### Pattern 3: Delete with Cascading

```typescript
// data/workouts.ts
export async function deleteWorkout(workoutId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const existing = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  });

  if (!existing) throw new Error('Workout not found');

  // Cascading deletes handled by DB schema (onDelete: 'cascade')
  await db.delete(workouts).where(eq(workouts.id, workoutId));

  return { success: true };
}
```

### Pattern 4: Batch Operations

```typescript
// data/sets.ts
export async function createMultipleSets(data: {
  workoutExerciseId: number;
  sets: Array<{ reps: number; weightKg?: number }>;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Verify workout exercise belongs to user
  const workoutExercise = await db.query.workoutExercises.findFirst({
    where: eq(workoutExercises.id, data.workoutExerciseId),
    with: { workout: true },
  });

  if (!workoutExercise || workoutExercise.workout.userId !== userId) {
    throw new Error('Access denied');
  }

  // Create all sets
  const createdSets = await db
    .insert(sets)
    .values(
      data.sets.map((set, index) => ({
        workoutExerciseId: data.workoutExerciseId,
        setNumber: index + 1,
        reps: set.reps,
        weightKg: set.weightKg,
      }))
    )
    .returning();

  return createdSets;
}
```

## Why These Rules Exist

### Server Actions Only

- **Type Safety**: Full TypeScript support from client to server
- **Security**: No need to expose API routes or endpoints
- **Progressive Enhancement**: Forms work without JavaScript
- **Developer Experience**: Colocation and simple imports

### Colocated actions.ts Files

- **Discoverability**: Easy to find actions related to a page
- **Organization**: Logical grouping of related mutations
- **Code Splitting**: Better bundle optimization
- **Maintainability**: Easier to refactor and understand

### Typed Parameters (No FormData)

- **Type Safety**: Catch errors at compile time
- **Autocomplete**: Better IDE support
- **Validation**: Easier to validate with Zod
- **Testability**: Easier to unit test

### Zod Validation Required

- **Runtime Safety**: Validate data at runtime
- **Error Messages**: Clear, helpful validation errors
- **Type Inference**: Generate TypeScript types from schemas
- **Security**: Prevent invalid data from reaching the database

### Data Directory Helpers

- **Reusability**: Same logic for Server Components and Server Actions
- **Security**: Centralized authorization checks
- **Maintainability**: Database logic separated from UI logic
- **Testing**: Helper functions can be tested independently

### Authorization in Data Helpers

- **Privacy**: Users can only modify their own data
- **Security**: Prevent unauthorized access and modifications
- **Compliance**: Required for privacy regulations
- **Trust**: Users expect their data to be secure

### Cache Revalidation

- **Fresh Data**: Users always see the latest data
- **Performance**: Leverage Next.js caching for speed
- **Consistency**: Prevent stale data issues
- **User Experience**: No manual page refreshes needed

## Summary

1. ✅ Use Server Actions for ALL mutations
2. ✅ Define Server Actions in colocated `actions.ts` files
3. ✅ Use typed parameters (NO FormData)
4. ✅ Validate ALL inputs with Zod schemas
5. ✅ Call helper functions in `/data` directory
6. ✅ Verify authorization in data helpers
7. ✅ Revalidate cache after mutations
8. ❌ Never mutate data in Route Handlers
9. ❌ Never mutate data in Client Components
10. ❌ Never query database directly in Server Actions
11. ❌ Never skip input validation
12. ❌ Never skip authorization checks

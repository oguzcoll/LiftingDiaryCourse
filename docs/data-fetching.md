# Data Fetching

## ⚠️ CRITICAL: Data Fetching Rules

This document outlines the **mandatory** data fetching patterns for this application. These rules are non-negotiable and must be followed without exception.

## Rule 1: Server Components Only

**ALL data fetching MUST be done via Server Components.**

### ✅ CORRECT

```typescript
// app/dashboard/page.tsx
import { getUserWorkouts } from '@/data/workouts';

export default async function DashboardPage() {
  const workouts = await getUserWorkouts();

  return (
    <div>
      {workouts.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
```

### ❌ INCORRECT - DO NOT DO THIS

```typescript
// ❌ Route Handler - NEVER fetch data this way
// app/api/workouts/route.ts
export async function GET() {
  const workouts = await db.query.workouts.findMany();
  return Response.json(workouts);
}

// ❌ Client Component - NEVER fetch data this way
'use client';
export default function Dashboard() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetch('/api/workouts')
      .then(res => res.json())
      .then(setWorkouts);
  }, []);

  return <div>...</div>;
}

// ❌ Server Action - NEVER fetch data this way
'use server';
export async function getWorkouts() {
  return await db.query.workouts.findMany();
}
```

## Rule 2: Data Directory Helper Functions

**ALL database queries MUST be performed through helper functions in the `/data` directory.**

Never query the database directly in your components. Always create a dedicated helper function.

### File Structure

```
/data
  ├── workouts.ts       # Workout-related queries
  ├── exercises.ts      # Exercise-related queries
  ├── programs.ts       # Program-related queries
  └── users.ts          # User-related queries
```

### Helper Function Pattern

```typescript
// data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

export async function getUserWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    orderBy: (workouts, { desc }) => [desc(workouts.createdAt)],
  });
}

export async function getWorkoutById(workoutId: number) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const workout = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)  // ← CRITICAL: Always filter by userId
      ),
  });

  if (!workout) {
    throw new Error('Workout not found');
  }

  return workout;
}
```

## Rule 3: Use Drizzle ORM - NO Raw SQL

**ALL database queries MUST use Drizzle ORM. Raw SQL is forbidden.**

### ✅ CORRECT - Drizzle ORM

```typescript
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Query builder
const results = await db.query.workouts.findMany({
  where: eq(workouts.userId, userId),
  with: {
    exercises: true,
  },
});

// Select API
const results = await db
  .select()
  .from(workouts)
  .where(eq(workouts.userId, userId))
  .orderBy(desc(workouts.createdAt));
```

### ❌ INCORRECT - Raw SQL

```typescript
// ❌ NEVER DO THIS
const results = await db.execute(
  sql`SELECT * FROM workouts WHERE user_id = ${userId}`
);
```

## Rule 4: User Data Isolation

**Users MUST ONLY be able to access their own data. This is a critical security requirement.**

Every data fetching function MUST:

1. Get the current user's ID using `auth()` from Clerk
2. Check if the user is authenticated
3. Filter ALL queries by `userId`
4. Never expose data from other users

### Security Checklist

- [ ] Function calls `await auth()` to get `userId`
- [ ] Function checks if `userId` exists (throws if not)
- [ ] Query filters by `eq(table.userId, userId)`
- [ ] No way to bypass the userId filter with parameters
- [ ] Related data (joins) also respects userId boundaries

### Example: Secure Data Fetching

```typescript
// data/exercises.ts
import { db } from '@/db';
import { exercises, workouts } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

export async function getExercisesByWorkoutId(workoutId: number) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // First verify the workout belongs to the user
  const workout = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      ),
  });

  if (!workout) {
    throw new Error('Workout not found or access denied');
  }

  // Now fetch exercises for this workout
  return await db.query.exercises.findMany({
    where: eq(exercises.workoutId, workoutId),
  });
}
```

## Common Patterns

### Pattern 1: List User's Resources

```typescript
export async function getUserResources() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  return await db.query.resources.findMany({
    where: eq(resources.userId, userId),
  });
}
```

### Pattern 2: Get Single Resource by ID

```typescript
export async function getResourceById(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const resource = await db.query.resources.findFirst({
    where: (resources, { eq, and }) =>
      and(
        eq(resources.id, id),
        eq(resources.userId, userId)
      ),
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  return resource;
}
```

### Pattern 3: Resources with Related Data

```typescript
export async function getWorkoutWithExercises(workoutId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const workout = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      ),
    with: {
      exercises: true,
    },
  });

  if (!workout) {
    throw new Error('Workout not found');
  }

  return workout;
}
```

## Why These Rules Exist

### Server Components Only

- **Performance**: Data fetching happens on the server, closer to the database
- **Security**: Database credentials and business logic never exposed to client
- **SEO**: Content is rendered on the server and available to search engines
- **Simplicity**: No need for API routes, loading states, or client-side caching

### Data Directory Helpers

- **Reusability**: Same query logic can be used across multiple pages
- **Security**: Auth checks are centralized and can't be forgotten
- **Maintainability**: Database logic is separated from UI logic
- **Testing**: Helper functions can be tested independently

### Drizzle ORM Only

- **Type Safety**: Full TypeScript support with autocomplete
- **SQL Injection Prevention**: Parameterized queries by default
- **Migration Safety**: Schema changes are type-checked
- **Developer Experience**: Easier to read and write than raw SQL

### User Data Isolation

- **Privacy**: Users can't access other users' private data
- **Compliance**: Required for GDPR, CCPA, and other privacy regulations
- **Trust**: Users expect their data to be secure
- **Liability**: Data breaches have serious legal and financial consequences

## What About Mutations?

For creating, updating, and deleting data, use **Server Actions**, not Server Components.

Server Actions documentation: *(to be created)*

## Summary

1. ✅ Fetch data in Server Components
2. ✅ Use helper functions in `/data` directory
3. ✅ Use Drizzle ORM (never raw SQL)
4. ✅ Always filter by current user's ID
5. ❌ Never fetch data in Route Handlers
6. ❌ Never fetch data in Client Components
7. ❌ Never fetch data in Server Actions
8. ❌ Never query the database directly in components

# Authentication Standards

This document outlines the coding standards and best practices for authentication in this application.

## Overview

This application uses **Clerk** for all authentication and user management. Clerk provides a complete authentication system with:

- Email/password authentication
- Social OAuth providers (Google, GitHub, etc.)
- Session management
- User profile management
- Pre-built UI components

## Critical Rules

### ✅ DO

- **Always use `clerkMiddleware()`** - This is the current, supported middleware function
- **Import from correct packages**:
  - Client components: `@clerk/nextjs`
  - Server code: `@clerk/nextjs/server`
- **Use async/await** for all server-side auth methods
- **Protect routes** using middleware configuration or conditional rendering
- **Handle loading states** when using auth in client components

### ❌ DO NOT

- **Never use `authMiddleware()`** - This is deprecated and will break your app
- **Never import server utilities in client components** - This will cause build errors
- **Never assume userId exists** - Always check for null/undefined
- **Never hardcode user IDs** - Always get them from Clerk's auth methods
- **Never skip auth checks** - Always verify authentication before accessing protected resources

## Middleware Configuration

The application uses Clerk middleware to protect routes. This is configured in `/middleware.ts`:

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**Important**: The middleware runs on all routes except:
- Next.js internals (`_next`)
- Static files (images, fonts, etc.)

## Server-Side Authentication

### Server Components

For Server Components, use the `auth()` function to get the current user's ID:

```typescript
import { auth } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user-specific data using userId
  const userData = await getUserData(userId);

  return <div>Welcome, {userData.name}</div>;
}
```

### Server Actions

For Server Actions, always verify authentication before performing any operations:

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';

export async function createWorkout(data: WorkoutInput) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Create workout associated with userId
  const workout = await db.workout.create({
    data: {
      ...data,
      userId,
    },
  });

  return workout;
}
```

### Route Handlers (API Routes)

For API routes, use `auth()` to verify the request is authenticated:

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch and return user data
  const data = await fetchUserData(userId);
  return NextResponse.json(data);
}
```

## Client-Side Authentication

### Using Clerk Components

Clerk provides pre-built React components for common auth UI patterns:

```typescript
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton mode="modal">
          <button>Sign In</button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button>Sign Up</button>
        </SignUpButton>
      </SignedOut>

      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </header>
  );
}
```

### Conditional Rendering

Use `<SignedIn>` and `<SignedOut>` to conditionally render content:

```typescript
import { SignedIn, SignedOut } from '@clerk/nextjs';

export function HomePage() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <Dashboard />
      </SignedIn>
    </>
  );
}
```

### Using the useUser Hook

For client components that need user data:

```typescript
'use client';

import { useUser } from '@clerk/nextjs';

export function ProfileWidget() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return <div>Hello, {user.firstName}!</div>;
}
```

**Important**: Always check `isLoaded` before checking `isSignedIn` or accessing `user`.

## User Data Access

### Getting User ID

The user ID is the primary identifier you'll use to associate data with users:

```typescript
// Server Component
const { userId } = await auth();

// Client Component
const { user } = useUser();
const userId = user?.id;
```

### Getting User Profile Information

Clerk provides access to user profile data:

```typescript
'use client';

import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user } = useUser();

  return (
    <div>
      <img src={user?.imageUrl} alt="Profile" />
      <h2>{user?.fullName}</h2>
      <p>{user?.primaryEmailAddress?.emailAddress}</p>
    </div>
  );
}
```

### Available User Properties

Common properties available on the `user` object:
- `id` - Unique user identifier
- `firstName`, `lastName`, `fullName`
- `primaryEmailAddress?.emailAddress`
- `imageUrl` - Profile picture URL
- `username`
- `createdAt`, `updatedAt`

## Route Protection Patterns

### Pattern 1: Redirect if Not Authenticated

```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <div>Protected Content</div>;
}
```

### Pattern 2: Show Sign-In Prompt

```typescript
import { auth } from '@clerk/nextjs/server';

export default async function OptionalAuthPage() {
  const { userId } = await auth();

  if (!userId) {
    return <SignInPrompt />;
  }

  return <ProtectedContent />;
}
```

### Pattern 3: Client-Side Protection

```typescript
'use client';

import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function ClientProtectedPage() {
  return (
    <>
      <SignedOut>
        <div>
          <p>Please sign in to continue</p>
          <SignInButton />
        </div>
      </SignedOut>

      <SignedIn>
        <ProtectedContent />
      </SignedIn>
    </>
  );
}
```

## Environment Variables

Required environment variables (in `.env.local`):

```bash
# Clerk API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Important**:
- Never commit `.env.local` to version control
- The `NEXT_PUBLIC_` prefix makes the key available to the browser
- The secret key should NEVER be exposed to the client

## Common Patterns

### Fetching User-Specific Data

```typescript
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';

export async function getUserWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const workouts = await db.query.workouts.findMany({
    where: (workouts, { eq }) => eq(workouts.userId, userId),
  });

  return workouts;
}
```

### Creating User-Associated Records

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { workouts } from '@/db/schema';

export async function createWorkout(name: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const [workout] = await db.insert(workouts).values({
    name,
    userId,
    createdAt: new Date(),
  }).returning();

  return workout;
}
```

### Protecting API Routes

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await req.json();

  // Process request with authenticated userId
  const result = await processData(userId, body);

  return NextResponse.json(result);
}
```

## Sign-In and Sign-Up Flows

### Using Pre-Built Components

The simplest approach is to use Clerk's pre-built components:

```typescript
import { SignInButton, SignUpButton } from '@clerk/nextjs';

export function AuthButtons() {
  return (
    <div>
      <SignInButton mode="modal">
        <button>Sign In</button>
      </SignInButton>

      <SignUpButton mode="modal">
        <button>Sign Up</button>
      </SignUpButton>
    </div>
  );
}
```

### Custom Sign-In Pages

If you need custom sign-in pages, configure them in Clerk dashboard and create routes:
- `/sign-in/[[...sign-in]]/page.tsx` for sign-in
- `/sign-up/[[...sign-up]]/page.tsx` for sign-up

```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  );
}
```

## Testing and Development

### Development Mode

Clerk works in development mode out of the box. Use the development keys from your Clerk dashboard.

### Test Users

Create test users in your Clerk dashboard for development and testing.

### Local Development

Ensure `.env.local` is properly configured before running the dev server:

```bash
npm run dev
```

## Troubleshooting

### Common Issues

1. **"Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()"**
   - Ensure `middleware.ts` is at the root of your project
   - Verify you're using `clerkMiddleware()`, not `authMiddleware()`

2. **"Cannot use Server-Only functions in a Client Component"**
   - Make sure you're importing from `@clerk/nextjs` in client components
   - Only use `@clerk/nextjs/server` in server components and server actions

3. **User data is undefined**
   - Check that the user is actually signed in
   - Verify `isLoaded` is true before accessing user data
   - Ensure middleware is properly configured

## Security Best Practices

1. **Always validate userId** - Never trust client-provided user IDs
2. **Use userId for data access** - Filter all queries by the authenticated userId
3. **Protect sensitive routes** - Use server-side auth checks, not just client-side
4. **Keep secrets secret** - Never expose CLERK_SECRET_KEY to the client
5. **Validate permissions** - Check user permissions before allowing operations
6. **Use HTTPS in production** - Clerk requires HTTPS for production deployments

## Additional Resources

- [Clerk Next.js Documentation](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Component Reference](https://clerk.com/docs/components/overview)
- [Clerk API Reference](https://clerk.com/docs/reference/clerkjs)

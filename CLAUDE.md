# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: Documentation-First Development

**BEFORE generating ANY code, you MUST:**

1. **Check the `/docs` directory** for relevant documentation files
2. **Read and understand** the applicable documentation thoroughly
3. **Follow the patterns and best practices** outlined in the docs
4. **Ensure your implementation aligns** with the documented architecture and conventions

The `/docs` directory contains authoritative guidance on:

- Architecture patterns and design decisions
- API conventions and data models
- Component structures and styling guidelines
- Integration patterns for external services
- Best practices specific to this project

- /docs/ui.md
- /docs/data-fetching.md
- /docs/data-mutations.md
- /docs/auth.md

**Never write code without first consulting the relevant documentation.** If documentation is missing for a feature you're implementing, consider creating it first or asking the user about expected patterns.

## Project Overview

This is a Next.js 16.1.1 application for a lifting diary/course, bootstrapped with `create-next-app`. It uses:

- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- ESLint 9 with Next.js configuration
- App Router architecture (Next.js App Directory)
- Clerk for authentication and user management

## Development Commands

### Running the Development Server

```bash
npm run dev
```

Development server runs at http://localhost:3000 with hot reload enabled.

### Building for Production

```bash
npm run build
```

Creates an optimized production build in `.next/` directory.

### Running Production Build

```bash
npm run start
```

Starts the production server (must run `npm run build` first).

### Linting

```bash
npm run lint
```

Runs ESLint to check for code quality issues. Configuration is in `eslint.config.mjs`.

## Project Structure

### App Directory (`app/`)

This project uses Next.js App Router. All routes and pages are defined in the `app/` directory:

- `app/layout.tsx` - Root layout component that wraps all pages. Configures Geist fonts (sans and mono) and global metadata.
- `app/page.tsx` - Home page component (route: `/`)
- `app/globals.css` - Global styles with Tailwind CSS directives

### Configuration Files

- `next.config.ts` - Next.js configuration (currently minimal)
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*` maps to root)
- `eslint.config.mjs` - ESLint configuration using Next.js presets
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS
- `middleware.ts` - Clerk authentication middleware using `clerkMiddleware()`
- `.env.local` - Environment variables for Clerk API keys (not tracked in git)

### Static Assets

- `public/` - Static files served at root URL (SVG icons, images)
- `app/favicon.ico` - Application favicon

## Architecture Notes

### Routing

Uses Next.js App Router (not Pages Router). To add new routes:

- Create folders in `app/` directory
- Add `page.tsx` for route components
- Add `layout.tsx` for nested layouts (optional)

### Styling

- Tailwind CSS 4 is configured via PostCSS
- Dark mode support is enabled (uses `dark:` class variants)
- Custom fonts: Geist Sans and Geist Mono loaded from Google Fonts

### TypeScript

- Strict mode enabled
- Path alias `@/*` available for imports from root
- JSX uses new React 19 `react-jsx` transform (no need to import React)

### Fonts

The project uses two Geist fonts configured in `app/layout.tsx`:

- Geist Sans (variable: `--font-geist-sans`)
- Geist Mono (variable: `--font-geist-mono`)

Both fonts are loaded with Latin subset only and applied via CSS variables on the body element.

## Development Notes

### Adding New Pages

Create new routes by adding directories and `page.tsx` files in the `app/` directory. The file system defines the routing structure.

### Tailwind Configuration

Tailwind 4 uses PostCSS plugin architecture. Global styles and Tailwind directives are in `app/globals.css`.

### ESLint Configuration

Uses flat config format (ESLint 9) with Next.js core web vitals and TypeScript presets. Build output directories are ignored.

## Authentication with Clerk

This application uses Clerk for authentication and user management.

### Setup

1. **Middleware**: `middleware.ts` at root uses `clerkMiddleware()` from `@clerk/nextjs/server`
2. **Provider**: `<ClerkProvider>` wraps the entire app in `app/layout.tsx`
3. **Environment Variables**: Required keys in `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### Getting Clerk API Keys

1. Visit [Clerk Dashboard](https://dashboard.clerk.com/last-active?path=api-keys)
2. Copy your Publishable Key and Secret Key
3. Add them to `.env.local` (replace placeholder values)

### Clerk Components Used

- `<SignInButton>` - Triggers sign-in flow
- `<SignUpButton>` - Triggers sign-up flow
- `<UserButton>` - Shows user profile menu when signed in
- `<SignedIn>` - Renders children only when user is authenticated
- `<SignedOut>` - Renders children only when user is not authenticated

### Server-Side Auth

To access auth data on the server (e.g., in Server Components, Route Handlers, or Server Actions):

```typescript
import { auth } from '@clerk/nextjs/server';

export default async function ServerComponent() {
  const { userId } = await auth();
  // Use userId to fetch user-specific data
}
```

### Important Notes

- NEVER use `authMiddleware()` - it's deprecated. Use `clerkMiddleware()` instead
- Always import from `@clerk/nextjs` for components and `@clerk/nextjs/server` for server utilities
- The middleware matcher is configured to skip Next.js internals and static files
- All auth methods from `@clerk/nextjs/server` must be used with `async/await`

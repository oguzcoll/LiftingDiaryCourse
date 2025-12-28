# UI Coding Standards

This document outlines the UI coding standards and conventions that **MUST** be followed throughout this entire project.

## UI Component Library

### shadcn/ui Components ONLY

**CRITICAL RULE**: This project uses **shadcn/ui components exclusively** for all user interface elements.

- ✅ **DO**: Use shadcn/ui components for all UI needs
- ❌ **DO NOT**: Create custom UI components
- ❌ **DO NOT**: Use any other UI component libraries

### Component Usage

All UI components must be sourced from the [shadcn/ui library](https://ui.shadcn.com/). When you need a new component:

1. Install it using the shadcn CLI: `npx shadcn@latest add [component-name]`
2. Import and use the component from `@/components/ui/`
3. Customize via Tailwind classes or component props only

**Examples of shadcn/ui components**:
- `Button`, `Input`, `Card`, `Dialog`, `Select`, `Checkbox`, `RadioGroup`
- `Accordion`, `Alert`, `Avatar`, `Badge`, `Calendar`, `Table`
- `Tabs`, `Tooltip`, `Dropdown Menu`, `Sheet`, `Toast`, and more

### Forbidden Practices

**NEVER** create custom UI components from scratch. If you need functionality not available in shadcn/ui:

1. First, check if shadcn/ui has a component that can be adapted
2. Use composition of existing shadcn/ui components
3. Only if absolutely necessary, consult the project maintainer

## Date Formatting

### date-fns Library

All date formatting **MUST** be done using the [date-fns](https://date-fns.org/) library.

- ✅ **DO**: Use `date-fns` for all date formatting and manipulation
- ❌ **DO NOT**: Use native JavaScript date methods for formatting
- ❌ **DO NOT**: Use other date libraries (moment.js, dayjs, etc.)

### Standard Date Format

Dates must be formatted with the following pattern:

**Format**: `do MMM yyyy`

**Examples**:
- `1st Sep 2025`
- `2nd Aug 2025`
- `3rd Jan 2026`
- `4th Jun 2024`

**Implementation**:

```typescript
import { format } from 'date-fns';

const formattedDate = format(new Date(), 'do MMM yyyy');
// Output: "1st Sep 2025"
```

### Key Points

- Ordinal day indicator (1st, 2nd, 3rd, 4th, etc.)
- Abbreviated month name (3 letters, first letter capitalized)
- Full 4-digit year
- Separated by spaces

## Additional Guidelines

### Styling

- Use Tailwind CSS classes for styling shadcn/ui components
- Follow the existing Tailwind configuration in the project
- Maintain consistency with the design system defined by shadcn/ui

### Accessibility

- shadcn/ui components come with built-in accessibility features
- Always use semantic HTML and proper ARIA attributes as provided by shadcn/ui
- Test keyboard navigation and screen reader compatibility

### TypeScript

- Use TypeScript types provided by shadcn/ui components
- Ensure proper type safety when passing props to components

## Enforcement

These standards are **mandatory** for all code contributions to this project. Code reviews will reject any pull requests that violate these guidelines.

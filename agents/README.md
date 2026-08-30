# Turistar Development Guide for AI Agents

This directory contains documentation for AI agents working on the Turistar codebase.

## Quick Navigation

- **[Rules](rules/)** - Modular engineering rules and best practices
- **[Commands](commands.md)** - Build, test, and development commands
- **[Architecture Overview](#architecture-overview)** - System structure and patterns

## Getting Started

This repository is a Next.js application (App Router) using Npm workspace. The main app code lives under `src/`.

### Key Directories

- `src/app/` - Main Next.js application
- `supabase/` - Database schema and migrations
- `src/shared/ui/` - Shared UI components
- `src/features/` - Feature-specific code

## Architecture Overview

### Database Layer

- **Supabase ORM** with PostgreSQL
- Schema in `supabase/schema.supabase`
- Always use explicit column selection for better performance
- Never expose secrets or privileged keys field in API responses

### API Layer

- Zod for API schema validation and type inference.
- Routers in `<feature>/server/api`
- Authentication handled via Supabase Auth

### Frontend

- **Next.js 15+** with App Router in some areas
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- Leaflet for maps and itinerary UX.

## Common Patterns

### Error Handling

- Use early returns to reduce nesting
- Throw descriptive errors with proper error codes
- Prefer composition over prop drilling

### Performance

- Avoid O(n²) logic in backend code
- Minimize Day.js usage in performance-critical paths
- Fetch only what you need from Supabase with explicit `.select("col1, col2")`

### Security

- Never commit secrets or API keys
- Always validate input data
- Use proper authentication checks
- Never expose sensitive credential fields

## Testing Strategy

- **Unit tests** with Vitest
- **Integration tests** for complex workflows
- **E2E tests** with Playwright
- Test files use `.test.ts` or `.spec.ts` extensions

## Pull Request Guidelines

For large PRs (>500 lines or >10 files):

- Split by feature boundaries
- Separate database migrations, backend logic, frontend components
- Create dependency chains that can be merged sequentially
- Pattern: Database → Backend → Frontend → Tests

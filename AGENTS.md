# Turistar Development Guide for AI Agents

You are a senior engineer working in a pnpm-managed Next.js project. You prioritize type safety, security, and small, reviewable diffs.

## Do

- Use explicit column selection in Supabase queries for performance and security (avoid `select('*')`)
- Use `import type { X }` for TypeScript type imports
- Use early returns to reduce nesting: `if (!planner) return null;`
- Use descriptive errors with context (include the operation and identifiers involved)
- Use conventional commits: `feat:`, `fix:`, `refactor:`
- Create PRs in draft mode by default
- Run `pnpm typecheck:ci` before concluding CI failures are unrelated to your changes
- Import directly from source files, not barrel files (e.g., `shared/ui/components/button` not `shared/ui`)
- Use `date-fns` or native `Date` instead of Day.js
- Put permission checks in `page.tsx`, never in `layout.tsx`
- Use `ast-grep` for searching if available; otherwise use `rg` (ripgrep), then fall back to `grep`

## Don't

- Never use `as any` - use proper type-safe solutions instead
- Never expose `SUPABASE_SERVICE_ROLE_KEY` anywhere client-side or in logs
- Never commit secrets or API keys
- Never put business logic in repositories - that belongs in Services
- Never use barrel imports from index.ts files
- Never skip running type checks before pushing
- Never create large PRs (>500 lines or >10 files) - split them instead

## Commands

### File-scoped (preferred for speed)

```bash
# Type check - always run on changed files
pnpm typecheck:ci

# Lint and format single file
npx biome check --write path/to/file.tsx

# Unit test specific file
pnpm test -- path/to/file.test.ts

# Unit test specific file + specific test
pnpm test -- path/to/file.test.ts -t "specific test name"

# Integration test specific file
pnpm test -- path/to/file.integration.test.ts

# Integration test specific file + specific test
pnpm test -- path/to/file.integration.test.ts -t "specific test name"

# E2E test specific file
pnpm e2e -- path/to/file.e2e.ts

# E2E test specific file + specific test
pnpm e2e -- path/to/file.e2e.ts --grep "specific test name"
```

### Project-wide (use sparingly)

```bash
# Development
pnpm dev                 # Start dev server

# Build & check
pnpm build               # Build all packages
pnpm lint:fix            # Lint and format all
pnpm typecheck           # Type check all

# Tests
pnpm test                # All unit tests
pnpm e2e                 # All E2E tests

# Database
pnpm gen:types           # Regenerate types after schema changes
```

## Boundaries

### Always do

- Run type check on changed files
- Run relevant tests and biome check
- Use explicit column selection in Supabase queries
- Follow conventional commits for PR titles
- Follow **[repository rules](agents/rules/)**

### Ask first

- Adding new dependencies
- Schema changes to `supabase/schema.supabase`
- Changes affecting multiple features
- Deleting files
- Running full build or E2E suites

### Never do

- Commit secrets, API keys, or `.env` files
- Expose `SUPABASE_SERVICE_ROLE_KEY` in any query
- Use `as any` type casting
- Force push or rebase shared branches
- Modify generated files directly

## Project Structure

```text
app/                         # Main Next.js application
supabase/                    # Database schema (schema.supabase) and migrations
shared/ui/                   # Shared UI components
features/                    # Feature-specific code
shared/lib/                  # Shared utilities
```

### Key files

- Routes: `app/` (App Router)
- Database schema: `supabase/schema.supabase`

## Tech Stack

- **Framework**: Next.js 15+ (App Router in some areas)
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL with Supabase ORM
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Testing**: Vitest (unit), Playwright (E2E)
- **i18n**: next-i18next

## Code Examples

### Good error handling

```typescript
// Good - Descriptive error with context
throw new Error(`Unable to save planner: planId=${planId} userId=${userId}`);

// Bad - Generic error
throw new Error('Save failed');
```

### Good Supabase query

```typescript
// Good - Use explicit columns for performance and security
const { data, error } = await supabase
  .from('planners')
  .select('id, title, starts_at, ends_at')
  .eq('id', planId)
  .single();

// Bad - Include fetches all fields including sensitive ones
const { data: bad } = await supabase.from('planners').select('*').eq('id', planId);
```

### Good imports

```typescript
// Good - Type imports and direct paths
import type { Planner } from '@/shared/types/planner';
import { Button } from '@/shared/ui/button';

// Bad - Regular import for types, barrel imports
import { Planner } from '@/shared/types';
import { Button } from '@/shared/ui';
```

## PR Checklist

- [ ] Title follows conventional commits: `feat(scope): description`
- [ ] Type check passes: `pnpm typecheck:ci`
- [ ] Lint passes: `pnpm lint`
- [ ] Relevant tests pass
- [ ] Diff is small and focused (<500 lines, <10 files)
- [ ] No secrets or API keys committed
- [ ] Created as draft PR

## When Stuck

- Ask a clarifying question before making large speculative changes
- Propose a short plan for complex tasks
- Open a draft PR with notes if unsure about approach
- Fix type errors before test failures - they're often the root cause
- If you see missing enum/type errors run `pnpm gen:types` and restart the TypeScript server

## Extended Documentation

For detailed information, see the `agents/` directory:

- **[agents/README.md](agents/README.md)** - Architecture overview and patterns
- **[agents/rules/](agents/rules/)** - Modular engineering rules (performance, architecture, data layer, security, patterns, etc.)
- **[agents/commands.md](agents/commands.md)** - Complete command reference

# Turistar

**Plan trips together with a visual itinerary, an interactive map, and a shared budget.**

Turistar is a free, open-source travel planner for turning ideas into a day-by-day plan. Organize
activities with drag and drop, map every stop, keep trip costs visible, invite collaborators, and
publish a read-only itinerary when it is ready to share.

[Open Turistar](https://turistar.me) ·
[Explore a public itinerary](https://turistar.me/p/xGAJQ3na6Zlh) ·
[Read the architecture guide](ARCHITECTURE.md)

![Turistar planner with a day-by-day itinerary, map, and budget](./.github/assets/preview_01.png)

## What you can do

| Capability | What it provides |
| --- | --- |
| Visual itineraries | Arrange activities by day and drag them within or between days as plans change. |
| Place search and maps | Find destinations with Geoapify and see geocoded activities as markers on an interactive map. |
| Trip budgets | Set a total budget, add expenses by category, and see spending and the remaining amount. |
| Realtime collaboration | Add existing Turistar users to a plan and sync day and activity edits through Supabase Realtime. |
| Controlled sharing | Keep plans private by default, then publish a read-only itinerary under a public URL. |
| Responsive, accessibility-aware UI | Use semantic controls, keyboard-managed dialogs, and layouts designed for mobile and desktop. |

## Architecture highlights

Turistar keeps the product experience simple while using a versioned collaboration model behind the
planner:

- **Vertical slices** keep UI, domain logic, services, repositories, and tests close to each feature.
- **Versioned event log** records day and activity mutations as immutable planner events.
- **Materialized snapshots** hydrate the latest itinerary without replaying the full history on every load.
- **Optimistic updates** apply local edits immediately, with rollback and refetch when persistence fails.
- **Version gap detection** reloads state when a client misses an event or receives an unexpected version.
- **Supabase Realtime** delivers new planner events to authenticated editors.
- **RLS-backed permissions** separate owners, admins, members, and anonymous readers; plans are private by default.

See [ARCHITECTURE.md](ARCHITECTURE.md) and the feature documentation under
[`src/features`](src/features/README.md) for the detailed data flow.

## Engineering quality

- TypeScript runs in strict mode.
- Biome handles linting and formatting.
- Vitest covers components, hooks, services, repositories, and route handlers.
- Playwright exercises the core planner, drag and drop, map, budget, members, sharing, and auth flows.
- GitHub Actions runs lint, typecheck, unit tests, coverage upload, and the production build.
- CodeQL and Dependency Review provide automated security checks.
- Lighthouse CI checks the public homepage for performance, accessibility, best practices, and SEO.

## Tech stack

- Next.js 16 and React 19
- TypeScript, Tailwind CSS, and Base UI
- Supabase Auth, PostgreSQL, Row Level Security, and Realtime
- TanStack Query and Zod
- DnD Kit
- Leaflet and React Leaflet
- Geoapify place search
- Vitest and Playwright

## Getting started

### Prerequisites

- Node.js 24
- pnpm 10 or newer (`corepack enable`)

### Local setup

1. Clone the repository:

   ```bash
   git clone https://github.com/andre-lmarinho/turistar.git
   cd turistar
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the local Supabase stack and create your environment file from [`.env.example`](.env.example):

   ```bash
   supabase start
   cp .env.example .env.local
   ```

   The public Supabase values in `.env.example` target the local stack. If server-only operations need the service-role key, copy `SERVICE_ROLE_KEY` from:

   ```bash
   supabase status -o env
   ```

   Keep the local service-role key only in `.env.local`.

   Configure any remaining service keys as needed:

   | Variable | Scope | Purpose |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Client and server | Supabase project URL. |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client and server | Public key used by browser and server clients under RLS. |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged operations that must bypass RLS. Never expose it to the browser or logs. |
   | `GEOAPIFY_KEY` | Server only | Place search, details, and geocoding requests. |

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Development commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start/reuse local Supabase, apply pending migrations, and start Next.js. |
| `pnpm db:migrate` | Apply pending local migrations without resetting data. |
| `pnpm db:reset` | Recreate the local database and apply migrations plus `supabase/seed.sql`. |
| `pnpm db:stop` | Stop the local Supabase stack while preserving its data. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Run the production build locally. |
| `pnpm lint` | Check the repository with Biome. |
| `pnpm lint:fix` | Apply Biome-safe lint and formatting fixes. |
| `pnpm typecheck:ci` | Generate Next.js route types and run TypeScript without emitting files. |
| `pnpm test` | Run the Vitest suite. |
| `pnpm e2e` | Run the Playwright suite. |

Before opening a pull request, run:

```bash
pnpm lint
pnpm typecheck:ci
pnpm test
```

Run Playwright separately when changing an end-to-end product flow:

```bash
pnpm e2e
```

## Project structure

```text
src/app/       Next.js routes and route handlers
src/features/  Feature-oriented product slices
src/modules/   Route-level UI composition
src/shared/    Shared UI, adapters, types, and utilities
supabase/      Database schema, migrations, RPCs, and RLS policies
tests/e2e/     Playwright end-to-end coverage
```

Repository conventions live in [AGENTS.md](AGENTS.md), with the modular rules under
[`agents/rules`](agents/rules/README.md).

## Testing and coverage

Vitest enables V8 coverage in CI and writes `coverage/lcov.info` for Codecov. To reproduce that
locally:

```bash
CI=true pnpm test
```

The health endpoint is available at `GET /health` and returns the application status plus the
version from `package.json`.

## Deployment

Turistar is a standard Next.js application and can be deployed to Vercel or another compatible
platform. Configure the Supabase and Geoapify environment variables above, and set the deployment's
public domain to `https://turistar.me`.

For a local Vercel build:

```bash
pnpm vercel:pull
pnpm vercel:build
```

## License

Turistar is open source under the [GNU Affero General Public License v3.0](LICENSE).

Built by [André Marinho](https://andremarinho.me/).

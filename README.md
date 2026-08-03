# Turistar: Drag-and-Drop Travel Planner

A free, open-source travel planner built with Next.js and React. Create a trip from a destination and dates, arrange activities with drag-and-drop, view stops on a map, track costs, and plan with friends.

- Live App: https://turistar.me

## Table of Contents

- [About the Project](#about-the-project)
- [Snapshots](#snapshots-of-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Testing](#testing)
- [Health Endpoint](#health-endpoint)
- [Deployment](#deployment)
- [Developer Guide](#developer-guide)
- [License](#license)

## About the Project

Turistar is a UX-focused travel planner built with DnD Kit, Base UI and the Next.js 16 App Router.

A Map View lets you preview your itinerary locations on an interactive map.

---

## Snapshots of the Project

![Turistar Planner Screenshot](./.github/assets/preview_01.png)

---

## Key Features

- Welcome Form: enter your trip dates to start a new plan.
- Planner Board: drag activities between days or add blank cards to build your schedule.
- Destination Search: quickly find attractions with Geoapify-powered search and autocomplete.
- Map View: see all planned attractions on an interactive map.
- Persistent Storage: all planner changes, including budget, are saved to Supabase.
- Responsive Design: use the planner across mobile and desktop layouts.
- Shared Planning: invite members to collaborate and publish read-only itineraries when they are ready.
- Public Trips: browse itineraries that travelers have chosen to publish.

---

## Tech Stack

- Next.js 16 (App Router)
- React & TypeScript
- Tailwind CSS for styling
- @dnd-kit/core & @dnd-kit/sortable for drag-and-drop
- Base UI primitives wrapped by shared UI components
- TanStack Query for data fetching
- date-fns and react-day-picker for date handling
- leaflet & react-leaflet for the map view
- Vercel or Netlify for hosting

---

## Project Structure

- `ARCHITECTURE.md`: architecture notes and data flow.
- `/src`: Application source code
  - `/app`: Next.js app directory with pages and API routes
  - `/features`: Product capabilities such as plans, activities, budgets, members, and search
  - `/shared`: Shared UI components, hooks, utilities, and types
  - `/modules`: Route-level UI composition, including the marketing site
- `/public`: Static assets served directly

Routes live in `src/app`; authenticated dashboards use `/u/{slug}` and plans use `/p/{identifier}`.

---

## Getting Started

Prerequisites: Node.js v24+ and pnpm (`corepack enable`)

1. Clone the repo

   ```bash
   git clone https://github.com/andre-lmarinho/travel-planner.git
   cd travel-planner
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Configure environment

   Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side secret used by actions that require privileged Supabase access)
   - `GEOAPIFY_KEY` (server-only)
   - `NEXT_PUBLIC_SITE_URL` (`https://turistar.me` in production)

   ### Supabase Auth configuration

   Supabase Auth depends on the following variables:

   | Variable                        | Scope           | Purpose                                                                                                                                                              |
   | ------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | Client & Server | Base URL for your Supabase project.                                                                                                                                  |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public anon key that allows the browser client to authenticate.                                                                                                      |
   | `SUPABASE_SERVICE_ROLE_KEY`     | Server only     | Optional service role key for server actions that need to call privileged RPCs (e.g., inserting server-generated plans). Keep this secret out of the browser bundle. |

4. Start the dev server

   ```bash
   pnpm dev
   ```

   Visit http://localhost:3000

   Authenticated users land on `/u/{yourSlug}`, which lists their itineraries and links to the planner at `/p/{planId}`.
   Signed-in users who visit `/login` or `/signup` return to their dashboard. Unauthenticated visitors following private
   dashboard links are sent to `/login`; published plans remain available as read-only pages under `/p/{publicSlug}`.

### Development Workflow

1. Install dependencies with `pnpm install`.
2. Start the dev server using `pnpm dev`.
3. Run the linter and formatter via `pnpm lint:fix`.
4. Run the type checker with `pnpm typecheck`.
5. Ensure all tests pass with `pnpm test`.

---

## Scripts

- `pnpm dev` – start development server
- `pnpm build` – compile for production
- `pnpm start` – run production build locally
- `pnpm lint` – run Biome lint
- `pnpm lint:fix` – run Biome lint and format
- `pnpm format` – format repository files
- `pnpm test` – run unit tests

### Local Vercel build

```bash
pnpm vercel:pull
pnpm vercel:build
```

---

## Testing

Vitest runs unit tests with `pnpm test`; Playwright runs E2E tests with `pnpm e2e`.

### Coverage reporting

- The Vitest configuration enables coverage automatically in CI, so `pnpm test` on GitHub Actions produces the `coverage/` directory with `lcov.info`.
- To generate coverage locally, run `CI=true pnpm test` (or export `CI=true` in your shell) to mirror the CI environment.
- Private forks need to create a Codecov token from [Codecov repository settings](https://app.codecov.io/) and add it as `CODECOV_TOKEN` in their fork's GitHub repository secrets so the CI job can upload coverage results.

---

## Health Endpoint

- Path: `/health`
- Method: `GET`
- Response: `{ "status": "ok", "version": "<package.json version>" }`

Example:

```bash
curl -s http://localhost:3000/health
```

---

## Deployment

Deploy to Vercel or Netlify:

1. Push your code to GitHub.
2. Import the repository in your hosting service (https://vercel.com/new or https://app.netlify.com/start).
3. Add the required environment variables:
   - `GEOAPIFY_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (`https://turistar.me` in production)
4. Click "Deploy" – the platform will build and preview automatically.

References:

- Next.js Deployment Docs: https://nextjs.org/docs/app/building-your-application/deploying
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com/

---

## Developer Guide

For project conventions, see [AGENTS.md](AGENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md) and [agents/commands.md](agents/commands.md).

---

## License

This project is open-source under the [GNU Affero General Public License v3.0](LICENSE).

---

Built by André Marinho. Feel free to star this repo if you find it useful!

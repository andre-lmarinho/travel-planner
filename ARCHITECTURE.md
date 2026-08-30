# Architecture

## Purpose

Turistar follows a **vertical slice** approach. Each feature (or slice) owns its user interface, state, services and domain logic. The `src/app` layer contains only the Next.js router and thin wiring to feature entry points. This keeps responsibilities local and makes features easier to understand and evolve.

## Folder layout

| Folder         | Contents                                                                                                                                                    | Notes                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/app`      | Next.js App Router routes and route handlers. Routes should stay thin, re-export feature entry points, or compose a small set of feature sections.         | Keep this layer thin; it wires pages to feature modules.            |
| `src/features` | Feature modules. Each slice contains its own `components/`, `hooks/`, `services/`, `domain/` and `server/` folders. Domain logic and state live here.       | Organize by capability, not by technical layer.                     |
| `src/shared`   | Framework adapters, UI atoms and pure utilities reused by multiple slices. Avoid putting domain-specific helpers here.                                      | Keep this small; if only one slice uses it, leave it in that slice. |
| `src/modules`  | Route-level UI compositions that coordinate feature components.                                                                                                  | Keep this layer thin and free of domain logic.                       |
| `public`       | Static assets served by Next.js.                                                                                                                            | —                                                                   |

## Core decisions

- **Routing** – Routes delegate to feature entry points. The `src/app` folder is a wiring layer and should not contain feature logic.

- **State ownership** – Each slice owns its local state and business rules. Cross-slice state is synchronized via shared adapters only when necessary.

- **Collaboration model** – Day and activity edits flow through an event-driven, realtime model with optimistic updates and snapshots. A monotonic version counter detects version gaps; clients recover by fetching the latest snapshot and replaying newer events.

- **Sharing and access control** – Existing Turistar users can be added to a plan by email. Membership tiers are `admin` and `member` (the owner lives on `plans.user_id`). Published plans are readable through `public_slug`; editing requires ownership or membership. Permission checks are enforced in the UI, server/RPCs, and RLS (including realtime).

- **Drag and drop** – Drag-and-drop interactions use DnD Kit. The logic for sensors, drag handles and sortable lists is encapsulated inside planner feature hooks and composition components.

- **Search** – The planner uses Geoapify for destination search and autocomplete. Requests are routed through `/api/places/*` (for example `/api/places/search`) with client hooks providing a typed interface.

## Conventions

- **Feature-owned orchestration** – Each feature exports a single entry component consumed by the App Router. UI compositions and domain orchestrators live in `components/`.

- **Shared stays minimal** – If only one feature consumes a helper, keep it inside that feature. Promote utilities to `src/shared` only when they are reused across slices.

- **UI structure inside a slice** – Organize `components/` by capability (for example `dnd`, `budget`, `map`). Place small widgets in a `ui/` subfolder. Shared atoms reused across slices live in `src/shared/ui`.

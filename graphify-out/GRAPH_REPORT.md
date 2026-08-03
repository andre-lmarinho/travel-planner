# Graph Report - travel-planner  (2026-08-03)

## Corpus Check
- 401 files · ~146,687 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1828 nodes · 3604 edges · 162 communities (106 shown, 56 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eda1806e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PlanRepository.ts
- MembersSection.tsx
- Navbar/index.tsx
- supabaseErrors.ts
- biome.json
- PlannerWorkspace.tsx
- ActivitySearchInput.tsx
- compilerOptions
- activity/types.ts
- 20260711120819_baseline_schema.sql
- createSupabaseServerClient
- details/route.ts
- address/route.ts
- supabase.ts
- PlannerContext.tsx
- plannerUi.ts
- form/index.ts
- devDependencies
- resolveNextPath
- FeatureCarousel.tsx
- diffEvents.ts
- PlannersSection.tsx
- supabase/index.ts
- clientEnv.ts
- forgot-password-reset-view.tsx
- GeoapifyService.ts
- city-country/route.ts
- scripts
- events/types.ts
- validUsername
- Features Architecture
- login-view.tsx
- supabaseSsr.ts
- MockQueryBuilder
- class-variance-authority
- validation.ts
- formatSupabaseError
- eventReducer.ts
- VisibilitySection.tsx
- Quick Reference
- cn
- Modules Architecture
- Button
- DayPlan
- uiux-interface-guidelines.md
- Turistar: Drag-and-Drop Travel Planner
- Privacy Policy
- mocks.ts
- package.json
- MockSupabaseClientImpl
- Terms of Use
- signup-view.tsx
- snapshotsSchemas.ts
- SharePlannerDialog.tsx
- Accordion.tsx
- Turistar Development Guide for AI Agents
- useInlineOutsideSubmit.ts
- forgot-password-view.tsx
- Travel Planner Development Guide for AI Agents
- InspirationsSection.tsx
- dependencies
- Button.tsx
- react-jsx.d.ts
- public.get_user_planners
- getPlannerExperience.ts
- LoadingScreen.tsx
- schema.supabase.sql
- env.ts
- MapBoard.tsx
- PlannerContext.test.tsx
- health/route.ts
- Build, Test & Development Commands
- SnapshotsRepository.ts
- Structure (in this exact order)
- useLocalStorage.ts
- MockRealtimeChannel
- vitest.setup.tsx
- EventsRepository.ts
- clsx
- date-fns
- @dnd-kit/core
- @dnd-kit/modifiers
- Sections
- @dnd-kit/utilities
- framer-motion
- pre-commit
- jsdom
- @mdx-js/mdx
- next
- @next/mdx
- react
- react-day-picker
- react-dom
- react-hook-form
- react-leaflet
- @sindresorhus/slugify
- @supabase/auth-js
- @supabase/ssr
- @supabase/supabase-js
- tailwind-merge
- @tanstack/react-query
- zod
- @playwright/test
- tailwindcss
- @testing-library/jest-dom
- tw-animate-css
- @types/react-dom
- vite
- suggestionHooks.test.ts
- clientEnv.test.ts
- .queryTable
- EmojiTicker.tsx
- Tooltip.tsx
- Project Design Context
- Snapshots Feature
- Repository Method Naming Conventions
- Key Concepts
- PlannerCreationForm.tsx
- Architecture
- Budget Feature
- Profile Feature
- @dnd-kit/sortable
- Boundaries
- Code Examples
- PULL_REQUEST_TEMPLATE.md
- Activity Board Feature
- Activity Dialog Feature
- Auth Feature
- Members Feature
- Planner Feature
- Search Feature
- Activity Feature
- ActivityForm.tsx
- Map Feature
- architecture-page-level-auth.md
- architecture-vertical-slices.md
- data-prefer-select-over-include.md
- data-repository-pattern.md
- patterns-composition-over-prop-drilling.md
- patterns-early-returns.md
- quality-file-naming-conventions.md
- quality-simplicity.md
- security-supabase-key-protection.md
- _template.md
- testing-coverage-requirements.md
- @mdx-js/loader
- DestinationsMap.tsx
- createGeoapifySuggestionHook.ts

## God Nodes (most connected - your core abstractions)
1. `createSupabaseServerClient()` - 63 edges
2. `cn()` - 60 edges
3. `formatSupabaseError()` - 51 edges
4. `DayPlan` - 45 edges
5. `Activity` - 38 edges
6. `scripts` - 19 edges
7. `Database` - 19 edges
8. `Button` - 18 edges
9. `MockQueryBuilder` - 18 edges
10. `resolveNextPath()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `proxy()` --calls--> `buildCsp()`  [EXTRACTED]
  proxy.ts → securityHeaders.ts
- `ActivityFormProps` --references--> `Activity`  [EXTRACTED]
  src/features/activityDialog/components/ActivityForm.tsx → src/features/activity/types.ts
- `UseSuggestionSelectOptions` --references--> `Activity`  [EXTRACTED]
  src/features/activityDialog/hooks/useSuggestionSelect.ts → src/features/activity/types.ts
- `DayUpdatedPayload` --references--> `DayPlan`  [EXTRACTED]
  src/features/events/types.ts → src/features/activity/types.ts
- `ToggleButtonInner()` --calls--> `cn()`  [EXTRACTED]
  src/shared/ui/button/ToggleButton.tsx → src/shared/utils/cn.ts

## Import Cycles
- None detected.

## Communities (162 total, 56 thin omitted)

### Community 0 - "PlanRepository.ts"
Cohesion: 0.12
Nodes (27): NEXT_NOT_FOUND, NEXT_REDIRECT, PLAN, PUBLIC_PLAN, PUBLIC_RECORD, fetchPlanByIdWithMembers(), fetchPlanBySlug(), fetchPlanIdentityById() (+19 more)

### Community 1 - "MembersSection.tsx"
Cohesion: 0.05
Nodes (52): getInviteErrorMessage(), InviteForm(), { addMemberMutateAsync, mockUseShareMembers, mockUsePlannerContext }, getTierOptions(), isTier(), LEAVE_OPTION, MemberMenuOption, MemberMutations (+44 more)

### Community 2 - "Navbar/index.tsx"
Cohesion: 0.05
Nodes (32): !!**/.next, dynamic, metadata, metadata, ClientProviders(), MARKETING_ROUTES, Footer(), LEGAL_LINKS (+24 more)

### Community 3 - "supabaseErrors.ts"
Cohesion: 0.06
Nodes (56): GET(), POST(), GET(), buildProfileUpsertError(), BuildProfileUpsertErrorParams, buildSlugBase(), ensureProfile, EnsureProfileOptions (+48 more)

### Community 4 - "biome.json"
Cohesion: 0.05
Nodes (42): css, parser, next, react, files, ignoreUnknown, includes, formatter (+34 more)

### Community 5 - "PlannerWorkspace.tsx"
Cohesion: 0.07
Nodes (40): BudgetBoard, Props, CategoryChart(), BudgetRowInputs(), ExpenseTable(), isValidCategoryKey(), Summary(), SummaryProps (+32 more)

### Community 6 - "ActivitySearchInput.tsx"
Cohesion: 0.20
Nodes (15): ActivitySearchInput(), ActivitySearchInputProps, LocationSearchInput(), LocationSearchInputProps, SuggestionCombobox(), SuggestionComboboxBaseProps, SuggestionComboboxProps, SuggestionComboboxPropsWithMap (+7 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (32): **/*.d.ts, dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, src (+24 more)

### Community 8 - "activity/types.ts"
Cohesion: 0.09
Nodes (31): ACTIVITY_COLORS, ACTIVITY_COPY, EMPTY_ACTIVITY_TITLE, ColorResult, useActivityColors(), useCardColors(), Activity, ActivityColor (+23 more)

### Community 9 - "20260711120819_baseline_schema.sql"
Cohesion: 0.13
Nodes (21): plan_first_destinations, public.add_plan_member_by_email(), public.append_plan_events(), public.budget_entries, public.create_full_plan(), public.destinations, public.get_user_planners(), public.is_plan_admin() (+13 more)

### Community 10 - "createSupabaseServerClient"
Cohesion: 0.13
Nodes (18): ExchangePayload, POST(), GET(), BudgetEntryInput, createBudgetEntry(), deleteBudgetEntry(), getPlanBudget(), updateBudgetEntry() (+10 more)

### Community 11 - "details/route.ts"
Cohesion: 0.19
Nodes (9): dynamic, GET(), handleLocalDetails(), runtime, { mockFetchGeoapifyPlaceDetails, mockFetchWikidataImage }, DEFAULT_PLAN_COVER_IMAGE, WIKIDATA_IMAGE_WIDTH, fetchWikidataImage() (+1 more)

### Community 12 - "address/route.ts"
Cohesion: 0.15
Nodes (13): dynamic, GET(), handleAddressAutocomplete(), runtime, { mockValidateGeoapifyQuery, mockFetchGeoapifyAddressAutocomplete }, dynamic, GET(), handleLocalSearch() (+5 more)

### Community 13 - "supabase.ts"
Cohesion: 0.13
Nodes (15): CreatePlanOptions, CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Tables (+7 more)

### Community 14 - "PlannerContext.tsx"
Cohesion: 0.22
Nodes (17): addActivity(), addActivityAtIndex(), cloneDays(), findActivityDay(), getActivity(), moveActivityPosition(), moveActivityToDay(), removeActivity() (+9 more)

### Community 15 - "plannerUi.ts"
Cohesion: 0.16
Nodes (15): authenticateE2EUser(), baseURL, E2E_USER_ID, E2E_USER_SLUG, goToDashboard(), goToPlanner(), getPlannerDatePicker(), goToPlannerPage() (+7 more)

### Community 16 - "form/index.ts"
Cohesion: 0.16
Nodes (15): Form(), FormProps, HintsOrErrors(), HintsOrErrorsProps, EmailField, PasswordField, InputError(), InputErrorProps (+7 more)

### Community 17 - "devDependencies"
Cohesion: 0.09
Nodes (23): @biomejs/biome, husky, lint-staged, devDependencies, @biomejs/biome, husky, lint-staged, @tailwindcss/postcss (+15 more)

### Community 18 - "resolveNextPath"
Cohesion: 0.28
Nodes (10): ForgotPasswordResetPage(), metadata, ForgotPasswordPage(), metadata, LoginRoute(), metadata, metadata, SignupRoute() (+2 more)

### Community 19 - "FeatureCarousel.tsx"
Cohesion: 0.14
Nodes (16): FeatureCarousel(), FeatureCarouselFeature, FeatureCarouselProps, FeatureCarouselCard(), FeatureCarouselCardProps, FeatureCarouselNavDots(), FeatureCarouselNavDotsProps, Listener (+8 more)

### Community 20 - "diffEvents.ts"
Cohesion: 0.24
Nodes (16): getDefaultColor(), createBlankActivity(), generateActivityId(), generatePlaceholderId(), isPlaceholder(), sanitizeTitle(), activityEquals(), cloneActivity() (+8 more)

### Community 21 - "PlannersSection.tsx"
Cohesion: 0.14
Nodes (16): metadata, UserDashboardPage(), UserDashboardPageProps, CreatePlannerPlanResult, getUserDestinations(), Row, UserDestination, getUserPlanners() (+8 more)

### Community 22 - "supabase/index.ts"
Cohesion: 0.10
Nodes (21): BudgetEntryRow, createMockSupabaseClient(), createResettableClient(), EqFilters, EventInput, EventRow, getSupabaseMock(), GtFilters (+13 more)

### Community 23 - "clientEnv.ts"
Cohesion: 0.13
Nodes (14): nextConfig, withMDX, config, proxy(), buildCsp(), buildPermissionsPolicy(), getSecurityHeaders(), Header (+6 more)

### Community 24 - "forgot-password-reset-view.tsx"
Cohesion: 0.15
Nodes (15): exchangeResetPasswordSession(), ResetPasswordExchangeResult, SendResetPasswordEmailInput, updatePassword(), UpdatePasswordResult, readResetPasswordParams(), ResetPasswordParams, MIN_PASSWORD_LENGTH (+7 more)

### Community 25 - "GeoapifyService.ts"
Cohesion: 0.29
Nodes (8): ADDRESS_ALLOWED_RESULT_TYPES, ADDRESS_RESULT_PRIORITY, AutocompleteOptions, GeoapifyFeature, GeoapifyFeatureProperties, GeoapifyPlaceDetails, GeoapifyPlaceSearchResult, GeoapifyResponse

### Community 26 - "city-country/route.ts"
Cohesion: 0.32
Nodes (5): dynamic, GET(), handleCityCountryAutocomplete(), runtime, { mockFetchGeoapifyAutocomplete }

### Community 27 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, check:vercel, dev, dev:e2e, e2e, format, gen:types (+11 more)

### Community 28 - "events/types.ts"
Cohesion: 0.08
Nodes (38): AppendBody, POST(), GET(), supabaseMocks, usePlanCollaboration(), UsePlanCollaborationOptions, baseDay, appendEvents() (+30 more)

### Community 29 - "validUsername"
Cohesion: 0.23
Nodes (11): GET(), { mockIsUsernameAvailable }, registerWithPassword(), RegisterWithPasswordInput, RegisterWithPasswordResult, isUsernameAvailable(), MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH (+3 more)

### Community 30 - "Features Architecture"
Cohesion: 0.09
Nodes (21): **Activity Types** - Shared Foundation, **Collaboration**, 🤝 Collaboration Layer, 📢 Content & Sharing, Core Architecture Principles, Data Flow Patterns, **Event System** - Real-time Backbone, Feature Boundaries (+13 more)

### Community 31 - "login-view.tsx"
Cohesion: 0.21
Nodes (12): signInWithPassword(), SignInWithPasswordInput, SignInWithPasswordResult, buildSignupHref(), extractErrorMessage(), getAuthErrorMessage(), mapResetPasswordError(), DEFAULT_VALUES (+4 more)

### Community 32 - "supabaseSsr.ts"
Cohesion: 0.48
Nodes (6): createBrowserClient(), createBuilder(), createMiddlewareClient(), createMockClient(), createServerClient(), QueryBuilder

### Community 35 - "validation.ts"
Cohesion: 0.48
Nodes (4): isValidTitle(), validateForm(), ValidationResult, ActivityFormValues

### Community 36 - "formatSupabaseError"
Cohesion: 0.27
Nodes (15): BudgetEntryInsertPayload, BudgetEntryRow, BudgetPlanRow, BudgetRepositoryOptions, CATEGORY_KEYS, createBudgetEntry(), deleteBudgetEntry(), fetchPlanBudgetEntries() (+7 more)

### Community 37 - "eventReducer.ts"
Cohesion: 0.14
Nodes (20): applyEvent(), applySingleEvent(), cloneActivity(), cloneDay(), ensureDay(), reduceEvents(), sanitizeActivity(), baseDay (+12 more)

### Community 38 - "VisibilitySection.tsx"
Cohesion: 0.25
Nodes (6): { mockUsePlannerContext, mockSetPlanVisibility }, Visibility, VISIBILITY_OPTIONS, VisibilitySection(), setPlanVisibility(), SelectMenuOption

### Community 39 - "Quick Reference"
Cohesion: 0.10
Nodes (19): 1. Architecture (CRITICAL), 2. Code Quality (CRITICAL), 3. Security (CRITICAL), 4. Data Layer (HIGH), 5. API Layer (HIGH), 6. Performance (HIGH), 7. UI/UX (HIGH), 8. Testing (MEDIUM-HIGH) (+11 more)

### Community 40 - "cn"
Cohesion: 0.14
Nodes (18): MenuToggleButton(), MenuToggleButtonProps, H3(), AvatarMenuProps, Avatar(), AvatarProps, Calendar(), CalendarDayButton() (+10 more)

### Community 41 - "Modules Architecture"
Cohesion: 0.11
Nodes (17): **Add a Module When:**, Development Guidelines, **Feature Dependencies**, **Import Rules**, Integration Patterns, **Key Characteristics**, **Module Boundaries**, Module Dependencies Summary (+9 more)

### Community 42 - "Button"
Cohesion: 0.17
Nodes (21): Collaboration(), COLLABORATION_POINTS, CtaFinal(), CtaMid(), HeroHome(), HowItWorks(), PLANNING_STEPS, Inspiration() (+13 more)

### Community 43 - "DayPlan"
Cohesion: 0.11
Nodes (20): DayPlan, ActivityBoard, baseActivity, baseDays, shared, DraggableCardProps, mockDays, useDragHandlers() (+12 more)

### Community 44 - "uiux-interface-guidelines.md"
Cohesion: 0.12
Nodes (16): Animation, Autofocus, Content & Accessibility, Content Handling, Dark Mode & Theming, Design, Feedback, Forms (+8 more)

### Community 45 - "Turistar: Drag-and-Drop Travel Planner"
Cohesion: 0.12
Nodes (17): About the Project, Coverage reporting, Deployment, Developer Guide, Development Workflow, Getting Started, Health Endpoint, Key Features (+9 more)

### Community 47 - "Privacy Policy"
Cohesion: 0.11
Nodes (18): 10. Children, 11. Changes to this policy, 12. Contact, 1. Who operates Turistar, 2.1. Website access, 2.2. Account and profile, 2.3. Trips and collaboration, 2.4. Location search (+10 more)

### Community 48 - "mocks.ts"
Cohesion: 0.18
Nodes (8): buildRpcMock(), buildTableMock(), createMockSupabaseClient(), createQueryChain(), MockRouterOptions, MockSupabaseClientOptions, QueryChain, SUPABASE_ERRORS

### Community 49 - "package.json"
Cohesion: 0.15
Nodes (12): engines, node, pnpm, license, name, packageManager, @tailwindcss/postcss, postcss (+4 more)

### Community 51 - "Terms of Use"
Cohesion: 0.14
Nodes (13): 10. Changes to these Terms, 11. Governing law, 12. Contact, 1. The service, 2. Accounts, 3. Acceptable use, 4. Your content and sharing choices, 5. Open-source software (+5 more)

### Community 52 - "signup-view.tsx"
Cohesion: 0.20
Nodes (10): checkUsernameAvailability(), CheckUsernameAvailabilityResult, buildEmailRedirectUrl(), DEFAULT_VALUES, FEATURES, SignupFeature, signupSchema, SignupValues (+2 more)

### Community 53 - "snapshotsSchemas.ts"
Cohesion: 0.23
Nodes (11): midpoint(), normalizePositions(), toNumber(), ActivityRow, ActivitySchema, DayPlanRow, DayPlanSchema, mapActivity() (+3 more)

### Community 54 - "SharePlannerDialog.tsx"
Cohesion: 0.18
Nodes (11): SharePlannerDialog(), DeletePlanDialog(), DeletePlanDialogProps, ConfirmationDialog(), ConfirmationDialogProps, DialogContent(), DialogContentProps, DialogHeader() (+3 more)

### Community 55 - "Accordion.tsx"
Cohesion: 0.32
Nodes (4): Accordion(), AccordionItem, AccordionProps, items

### Community 56 - "Turistar Development Guide for AI Agents"
Cohesion: 0.14
Nodes (14): API Layer, Architecture Overview, Common Patterns, Database Layer, Error Handling, Frontend, Getting Started, Key Directories (+6 more)

### Community 58 - "forgot-password-view.tsx"
Cohesion: 0.36
Nodes (6): sendResetPasswordEmail(), buildLoginHref(), buildResetPasswordRedirectUrl(), validEmail(), ForgotPasswordView(), AccessShell()

### Community 59 - "Travel Planner Development Guide for AI Agents"
Cohesion: 0.15
Nodes (13): Commands, Do, Don't, Extended Documentation, File-scoped (preferred for speed), graphify, Key files, PR Checklist (+5 more)

### Community 60 - "InspirationsSection.tsx"
Cohesion: 0.43
Nodes (4): Card(), CardProps, CardGrid(), CardGridProps

### Community 61 - "dependencies"
Cohesion: 0.22
Nodes (9): @base-ui/react, @hookform/resolvers, leaflet, lucide-react, dependencies, @base-ui/react, @hookform/resolvers, leaflet (+1 more)

### Community 63 - "Button.tsx"
Cohesion: 0.20
Nodes (8): AnchorButtonProps, ButtonProps, ButtonVariant, buttonVariants, NativeButtonProps, ToggleButton, ToggleButtonInner(), ToggleButtonProps

### Community 64 - "react-jsx.d.ts"
Cohesion: 0.42
Nodes (8): Element, ElementAttributesProperty, ElementChildrenAttribute, ElementClass, IntrinsicAttributes, IntrinsicClassAttributes, IntrinsicElements, JSX

### Community 65 - "public.get_user_planners"
Cohesion: 0.25
Nodes (6): public.plan_members, public.plan_snapshots, public.plans, public.get_user_planners(), current_user_id, user_plan_ids

### Community 66 - "getPlannerExperience.ts"
Cohesion: 0.17
Nodes (18): dynamic, generateMetadata(), PageProps, PlannerPlanPage(), generatePlannerMetadata(), BudgetEntryRow, buildDaysFromRange(), buildReadOnlyExperience() (+10 more)

### Community 68 - "LoadingScreen.tsx"
Cohesion: 0.43
Nodes (4): LoadingScreen(), LoadingScreenProps, Spinner(), SpinnerProps

### Community 69 - "schema.supabase.sql"
Cohesion: 0.46
Nodes (7): public.budget_entries, public.plan_events, public.plan_members, public.plan_snapshots, public.plans, public.profiles, auth.users

### Community 72 - "PlannerContext.test.tsx"
Cohesion: 0.27
Nodes (6): day(), mockUpdatePlanDates, mockUsePlanCollaboration, PersistDays, renderPlannerContext(), updatePlanDates()

### Community 75 - "health/route.ts"
Cohesion: 0.40
Nodes (4): dynamic, GET(), PackageJson, runtime

### Community 76 - "Build, Test & Development Commands"
Cohesion: 0.17
Nodes (12): Build Commands, Build, Test & Development Commands, Database Commands, Development Commands, End-to-End Tests, Environment Setup, Integration Tests, Lint & Type Check (+4 more)

### Community 77 - "SnapshotsRepository.ts"
Cohesion: 0.29
Nodes (8): GET(), fetchSnapshot(), getClient(), SnapshotRow, SnapshotsRepositoryOptions, fetchSnapshot(), PlannerSupabaseClient, SnapshotRowSchema

### Community 79 - "Structure (in this exact order)"
Cohesion: 0.18
Nodes (10): 1. ## What does this PR do?, 2. **Key changes:**, 3. ## How should this be tested?, 4. ## Notes (optional), Example, Output Constraints, Output Format, Patterns (+2 more)

### Community 85 - "EventsRepository.ts"
Cohesion: 0.22
Nodes (10): appendEvents(), AppendEventsOptions, AppendEventsResponse, AppendPlanEventsArgs, EventRow, EventsRepositoryOptions, fetchEvents(), getClient() (+2 more)

### Community 90 - "Sections"
Cohesion: 0.18
Nodes (10): 1. Architecture (architecture), 2. Code Quality (quality), 3. Security (security), 4. Data Layer (data), 5. API Design (api), 6. Performance (performance), 7. Ui/Ux (uiux), 8. Testing (testing) (+2 more)

### Community 132 - "EmojiTicker.tsx"
Cohesion: 0.47
Nodes (4): EmojiTicker(), Item, POOL, GridMask()

### Community 133 - "Tooltip.tsx"
Cohesion: 0.47
Nodes (3): Tooltip(), TooltipPosition, TooltipProps

### Community 134 - "Project Design Context"
Cohesion: 0.20
Nodes (9): Avoid, Components, Constraints, Decisions, Must, Project, Project Design Context, Sources (+1 more)

### Community 137 - "Snapshots Feature"
Cohesion: 0.25
Nodes (7): Data Flow, Dependencies, Event Sourcing Integration, Key Concepts, Overview, Snapshots Feature, State Loading

### Community 138 - "Repository Method Naming Conventions"
Cohesion: 0.29
Nodes (6): Repository Method Naming Conventions, Rule 1: Don't include the repository's entity name in method names, Rule 2: Use `include` or similar keywords for methods that fetch relational data, Rule 3: Keep methods generic and reusable - avoid use-case-specific names, Rule 4: No business logic in repositories, Summary

### Community 139 - "Key Concepts"
Cohesion: 0.29
Nodes (6): Conflict Resolution, Event Sourcing, Events Feature, Key Concepts, Real-time Sync, Snapshots

### Community 140 - "PlannerCreationForm.tsx"
Cohesion: 0.15
Nodes (18): getDefaultRange(), PlannerCreationForm(), PlannerCreationFormProps, Visibility, VISIBILITY_OPTIONS, createPlan(), DestinationInfo, resolveCountryFromGeoapify() (+10 more)

### Community 141 - "Architecture"
Cohesion: 0.33
Nodes (5): Architecture, Conventions, Core decisions, Folder layout, Purpose

### Community 143 - "Budget Feature"
Cohesion: 0.40
Nodes (4): Budget Feature, Categories, Features, State Management

### Community 144 - "Profile Feature"
Cohesion: 0.40
Nodes (4): Data Flow, Dependencies, Features, Profile Feature

### Community 147 - "Boundaries"
Cohesion: 0.50
Nodes (4): Always do, Ask first, Boundaries, Never do

### Community 148 - "Code Examples"
Cohesion: 0.50
Nodes (4): Code Examples, Good error handling, Good imports, Good Supabase query

### Community 149 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.50
Nodes (3): How should this be tested?, Notes (optional and can be deleted if not needed), What does this PR do?

### Community 150 - "Activity Board Feature"
Cohesion: 0.50
Nodes (3): Activity Board Feature, Dependencies, Features

### Community 151 - "Activity Dialog Feature"
Cohesion: 0.50
Nodes (3): Activity Dialog Feature, Dependencies, Features

### Community 152 - "Auth Feature"
Cohesion: 0.50
Nodes (3): Auth Feature, Data Flow, Features

### Community 153 - "Members Feature"
Cohesion: 0.50
Nodes (3): Features, Members Feature, Tiers

### Community 154 - "Planner Feature"
Cohesion: 0.50
Nodes (3): Data Flow, Planner Feature, Workflow summary

### Community 155 - "Search Feature"
Cohesion: 0.50
Nodes (3): Data Flow, Features, Search Feature

### Community 157 - "ActivityForm.tsx"
Cohesion: 0.22
Nodes (10): ACTIVITY_TEXT, ActivityForm, ActivityFormProps, getShortTitle(), SuggestionData, useSuggestionSelect(), UseSuggestionSelectOptions, useActivitySuggestions (+2 more)

### Community 174 - "DestinationsMap.tsx"
Cohesion: 0.25
Nodes (5): MapPin, pinIcon, SUBDOMAINS, DashboardMap(), DestinationsMap

### Community 176 - "createGeoapifySuggestionHook.ts"
Cohesion: 0.32
Nodes (6): createGeoapifySuggestionHook(), SuggestionHookConfig, SuggestionHookOptions, SuggestionHookResult, useDestinationAutocomplete, GEOAPIFY_MIN_QUERY_LENGTH

## Knowledge Gaps
- **661 isolated node(s):** `$schema`, `root`, `tailwindDirectives`, `cssModules`, `lineWidth` (+656 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Database` connect `supabase.ts` to `PlanRepository.ts`, `MembersSection.tsx`, `supabaseSsr.ts`, `supabaseErrors.ts`, `formatSupabaseError`, `createSupabaseServerClient`, `PlannerCreationForm.tsx`, `SnapshotsRepository.ts`, `mocks.ts`, `EventsRepository.ts`, `supabase/index.ts`, `clientEnv.ts`, `forgot-password-reset-view.tsx`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `!!**/.next` connect `Navbar/index.tsx` to `getPlannerExperience.ts`, `biome.json`, `resolveNextPath`, `PlannersSection.tsx`, `clientEnv.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `MembersSection.tsx`, `LoadingScreen.tsx`, `Tooltip.tsx`, `ActivitySearchInput.tsx`, `activity/types.ts`, `Button`, `form/index.ts`, `FeatureCarousel.tsx`, `SharePlannerDialog.tsx`, `InspirationsSection.tsx`, `Button.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `$schema`, `root`, `tailwindDirectives` to the rest of the system?**
  _661 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PlanRepository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11724137931034483 - nodes in this community are weakly interconnected._
- **Should `MembersSection.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05413469735720375 - nodes in this community are weakly interconnected._
- **Should `Navbar/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05027322404371585 - nodes in this community are weakly interconnected._
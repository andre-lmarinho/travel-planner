/**
 * Reusable mock utilities for tests.
 * Import these helpers to reduce boilerplate in test files.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Mock } from "vitest";
import { vi } from "vitest";
import type { Database } from "@/shared/types/supabase";

// ============================================================================
// SUPABASE QUERY CHAIN
// ============================================================================

export interface QueryChain<T> {
  select: Mock<(...args: unknown[]) => QueryChain<T>>;
  insert: Mock<(...args: unknown[]) => QueryChain<T>>;
  update: Mock<(...args: unknown[]) => QueryChain<T>>;
  delete: Mock<() => QueryChain<T>>;
  upsert: Mock<(...args: unknown[]) => QueryChain<T>>;
  eq: Mock<(...args: unknown[]) => QueryChain<T>>;
  gt: Mock<(...args: unknown[]) => QueryChain<T>>;
  neq: Mock<(...args: unknown[]) => QueryChain<T>>;
  in: Mock<(...args: unknown[]) => QueryChain<T>>;
  order: Mock<(...args: unknown[]) => QueryChain<T>>;
  limit: Mock<(...args: unknown[]) => QueryChain<T>>;
  range: Mock<(...args: unknown[]) => QueryChain<T>>;
  single: Mock<() => Promise<{ data: T | null; error: Error | null }>>;
  maybeSingle: Mock<() => Promise<{ data: T | null; error: Error | null }>>;
  /** Thenable support - allows `await supabase.from('table').select()` without terminal method */
  then: <TResult>(
    onfulfilled?: (value: { data: T | null; error: Error | null }) => TResult
  ) => Promise<TResult>;
}

/**
 * Creates a fluent query chain mock for Supabase queries.
 * Supports all common query methods: select, insert, update, delete, eq, order, etc.
 */
export function createQueryChain<T>(data: T | null, error: Error | null = null): QueryChain<T> {
  const result = { data, error };

  const chain: QueryChain<T> = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    // biome-ignore lint/suspicious/noThenProperty: QueryBuilder needs to be thenable to match Supabase API
    then: (onfulfilled) => Promise.resolve(result).then(onfulfilled),
  };

  return chain;
}

// ============================================================================
// SUPABASE CLIENT MOCKS
// ============================================================================

export interface MockSupabaseClientOptions {
  /** Default data for `from()` queries */
  fromData?: Record<string, unknown>;
  /** Default data for `rpc()` calls */
  rpcData?: Record<string, unknown>;
  /** User to return from auth.getUser() */
  user?: { id: string; email?: string } | null;
  /** Session to return from auth.getSession() */
  session?: { user: { id: string } } | null;
}

/**
 * Creates a mock Supabase client with configurable responses.
 */
export function createMockSupabaseClient(options: MockSupabaseClientOptions = {}): SupabaseClient<Database> {
  const { fromData = {}, rpcData = {}, user = null, session = null } = options;

  const from = vi.fn((table: string) => {
    const data = fromData[table] ?? null;
    return createQueryChain(data);
  });

  const rpc = vi.fn((fn: string) => {
    const data = rpcData[fn] ?? null;
    return Promise.resolve({ data, error: null });
  });

  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn().mockResolvedValue({ error: null }) })),
  };

  return {
    from,
    rpc,
    channel: vi.fn(() => channel),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session }, error: null })),
    },
  } as unknown as SupabaseClient<Database>;
}

/**
 * Creates a mock for a single table with specific data/error.
 * Returns the mock client, from function, and query chain for assertions.
 */
export function buildTableMock<T>(table: string, result: { data: T | null; error: Error | null }) {
  const chain = createQueryChain(result.data, result.error);
  const from = vi.fn((tableName: string) => {
    if (tableName === table) return chain;
    return createQueryChain(null, new Error(`Unexpected table: ${tableName}`));
  });

  const supabase = {
    from,
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  } as unknown as SupabaseClient<Database>;

  return { supabase, from, chain };
}

/**
 * Creates a mock for RPC calls with specific responses.
 */
export function buildRpcMock<T>(rpcName: string, result: { data: T | null; error: Error | null }) {
  const rpc = vi.fn((fn: string, _params?: unknown) => {
    if (fn === rpcName) {
      return Promise.resolve(result);
    }
    return Promise.resolve({ data: null, error: new Error(`Unexpected RPC: ${fn}`) });
  });

  const supabase = {
    from: vi.fn(() => createQueryChain(null)),
    rpc,
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  } as unknown as SupabaseClient<Database>;

  return { supabase, rpc };
}

// ============================================================================
// NEXT.JS NAVIGATION MOCKS
// ============================================================================

export interface MockRouterOptions {
  pathname?: string;
  searchParams?: Record<string, string>;
  push?: Mock;
  replace?: Mock;
  refresh?: Mock;
  back?: Mock;
  prefetch?: Mock;
}

/**
 * Creates mock values for next/navigation hooks.
 * Use with vi.mock() to provide configurable navigation mocks.
 */
export function createNavigationMocks(options: MockRouterOptions = {}) {
  const {
    pathname = "/",
    searchParams = {},
    push = vi.fn(),
    replace = vi.fn(),
    refresh = vi.fn(),
    back = vi.fn(),
    prefetch = vi.fn(),
  } = options;

  return {
    useRouter: () => ({ push, replace, refresh, back, prefetch }),
    usePathname: () => pathname,
    useSearchParams: () => new URLSearchParams(searchParams),
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
}

// ============================================================================
// REACT QUERY TEST WRAPPER
// ============================================================================

/**
 * Creates a QueryClient wrapper for testing hooks that use React Query.
 * Returns the wrapper component and the queryClient for cache manipulation.
 *
 * @example
 * ```ts
 * const { wrapper, queryClient } = createQueryWrapper();
 * const { result } = renderHook(() => useMyHook(), { wrapper });
 * ```
 */
export function createQueryWrapper() {
  // Dynamic import to avoid issues when React Query isn't loaded
  const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
  const React = require("react");

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { wrapper, queryClient };
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Creates a Supabase-like error object for testing error handling.
 */
export function createSupabaseError(message: string, code?: string): Error & { code?: string } {
  const error = new Error(message) as Error & { code?: string };
  if (code) error.code = code;
  return error;
}

/**
 * Common Supabase error codes for testing.
 */
export const SUPABASE_ERRORS = {
  NOT_FOUND: createSupabaseError("Row not found", "PGRST116"),
  UNAUTHORIZED: createSupabaseError("JWT expired", "PGRST301"),
  FORBIDDEN: createSupabaseError("Permission denied", "42501"),
  CONFLICT: createSupabaseError("Duplicate key", "23505"),
  NETWORK: createSupabaseError("Network error", "NETWORK_ERROR"),
} as const;

// ============================================================================
// ASYNC HELPERS
// ============================================================================

/**
 * Flushes pending promises. Use after triggering async operations.
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Waits for a condition to be true, with timeout.
 * @param condition - Function that returns true when the condition is met
 * @param options.timeout - Maximum time to wait in ms (default: 1000)
 * @param options.interval - Time between checks in ms (default: 10)
 * @param options.description - Description for error message (default: "condition")
 */
export async function waitForCondition(
  condition: () => boolean,
  { timeout = 1000, interval = 10, description = "condition" } = {}
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error(`waitForCondition timed out waiting for: ${description}`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

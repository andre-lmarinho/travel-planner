/**
 * Simple Supabase mock helpers for unit tests.
 *
 * For more complete mocking (navigation, React Query, etc.), see @tests/utils/mocks.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Mock } from "vitest";
import { vi } from "vitest";

import type { Database } from "@/supabase/types";

// ============================================================================
// QUERY CHAIN
// ============================================================================

export interface QueryChain<T> {
  select: Mock<(...args: unknown[]) => QueryChain<T>>;
  eq: Mock<(...args: unknown[]) => QueryChain<T>>;
  order: Mock<(...args: unknown[]) => QueryChain<T>>;
  limit: Mock<(...args: unknown[]) => QueryChain<T>>;
  maybeSingle: Mock<() => Promise<{ data: T | null; error: Error | null }>>;
  single: Mock<() => Promise<{ data: T | null; error: Error | null }>>;
}

export function createQueryChain<T>(data: T | null, error: Error | null = null): QueryChain<T> {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve({ data, error })),
    single: vi.fn(() =>
      data
        ? Promise.resolve({ data, error: null })
        : Promise.resolve({ data: null, error: error || new Error("Not found") })
    ),
  };
  return chain;
}

// ============================================================================
// SUPABASE CLIENT MOCKS
// ============================================================================

export function createMockSupabaseClient<T = unknown>(
  tableData: Record<string, T[]> = {}
): SupabaseClient<Database> {
  const from = vi.fn((table: string) => {
    const data = tableData[table] || [];
    return createQueryChain<T>(Array.isArray(data) ? (data[0] as T) : null);
  });

  return {
    from,
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  } as unknown as SupabaseClient<Database>;
}

export function createMockSupabaseServerClient(
  mocks: {
    from?: ReturnType<typeof createQueryChain<unknown>>;
    rpc?: { data: unknown; error: Error | null };
  } = {}
): SupabaseClient<Database> {
  return {
    from: vi.fn(() => mocks.from || createQueryChain<unknown>(null)),
    rpc: vi.fn(() => Promise.resolve(mocks.rpc || { data: null, error: null })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  } as unknown as SupabaseClient<Database>;
}

export function buildSupabaseMock<T>(table: string, result: { data: T | null; error: Error | null }) {
  const chain = createQueryChain<T>(result.data, result.error);
  const from = vi.fn((tableName: string) => {
    if (tableName === table) return chain;
    throw new Error(`Unexpected table: ${tableName}`);
  });
  const supabase = { from } as unknown as SupabaseClient<Database>;
  return { supabase, from, chain };
}

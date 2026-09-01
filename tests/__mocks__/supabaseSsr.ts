import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase/types";

type QueryBuilder = {
  select: (...args: unknown[]) => QueryBuilder;
  insert: (...args: unknown[]) => QueryBuilder;
  upsert: (...args: unknown[]) => QueryBuilder;
  update: (...args: unknown[]) => QueryBuilder;
  delete: (...args: unknown[]) => QueryBuilder;
  eq: (...args: unknown[]) => QueryBuilder;
  order: (...args: unknown[]) => QueryBuilder;
  single: () => Promise<{ data: null; error: null }>;
  maybeSingle: () => Promise<{ data: null; error: null }>;
  returns: () => Promise<{ data: null; error: null }>;
};

function createBuilder(): QueryBuilder {
  const builder = {
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    returns: () => Promise.resolve({ data: null, error: null }),
  } as QueryBuilder;

  (["select", "insert", "upsert", "update", "delete", "eq", "order"] as const).forEach((m) => {
    (builder as unknown as Record<string, (...args: unknown[]) => QueryBuilder>)[m] = () => builder;
  });

  return builder;
}

function createMockClient(): SupabaseClient<Database> {
  return {
    from: () => createBuilder(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  } as unknown as SupabaseClient<Database>;
}

export const createBrowserClient = () => createMockClient();
export const createServerClient = () => createMockClient();
export const createMiddlewareClient = () => createMockClient();

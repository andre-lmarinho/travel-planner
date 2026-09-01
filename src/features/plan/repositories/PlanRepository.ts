import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSupabaseError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";
import { isUuid } from "@/shared/lib/uuid";
import type { Database } from "@/shared/types/supabase";

export type PlanIdentity = {
  id: string;
  ownerId: string | null;
};

export type PlanMemberRecord = {
  userId: string;
  tier: string;
};

export type PlanRecord = {
  id: string;
  title: string | null;
  ownerId: string | null;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  isPublic: boolean;
  destinationName: string | null;
};

export type PlanWithMembersRecord = PlanRecord & {
  members: PlanMemberRecord[];
};

export type SnapshotRowRecord = {
  plan_id: string;
  version: number;
  state: unknown;
  updated_at: string;
};

type PlanRepositoryOptions = {
  client?: SupabaseClient<Database>;
};

type PlanMemberRow = {
  user_id: string;
  tier: string;
};

type PlanRow = {
  id: string;
  title: string | null;
  user_id: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  is_public: boolean;
  destination_name: string | null;
};

function getClient(client?: SupabaseClient<Database>): SupabaseClient<Database> {
  return client ?? createSupabaseServerClient();
}

function mapPlanRow(row: PlanRow): PlanRecord {
  return {
    id: row.id,
    title: row.title,
    ownerId: row.user_id,
    budget: row.budget,
    startDate: row.start_date,
    endDate: row.end_date,
    isPublic: row.is_public,
    destinationName: row.destination_name,
  };
}

function mapMembers(rows: PlanMemberRow[] | null): PlanMemberRecord[] {
  if (!rows) {
    return [];
  }

  return rows.map((row) => ({
    userId: row.user_id,
    tier: row.tier,
  }));
}

export async function fetchPlanIdentityById(
  planId: string,
  { client }: PlanRepositoryOptions = {}
): Promise<PlanIdentity | null> {
  const supabase = getClient(client);
  const { data, error } = await supabase.from("plans").select("id, user_id").eq("id", planId).maybeSingle();

  if (error) {
    throw formatSupabaseError({
      operation: "fetchPlanIdentityById",
      identifiers: { planId },
      error,
    });
  }

  if (!data) {
    return null;
  }

  return { id: data.id, ownerId: data.user_id };
}

export async function fetchPlanIdentityBySlug(
  slug: string,
  { client }: PlanRepositoryOptions = {}
): Promise<PlanIdentity | null> {
  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("plans")
    .select("id, user_id")
    .eq("public_slug", slug)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({
      operation: "fetchPlanIdentityBySlug",
      identifiers: { slug },
      error,
    });
  }

  if (!data) {
    return null;
  }

  return { id: data.id, ownerId: data.user_id };
}

export async function resolvePlanIdentity(
  planIdOrSlug: string,
  options?: PlanRepositoryOptions
): Promise<PlanIdentity | null> {
  return isUuid(planIdOrSlug)
    ? fetchPlanIdentityById(planIdOrSlug, options)
    : fetchPlanIdentityBySlug(planIdOrSlug, options);
}

const PLAN_WITH_MEMBERS_SELECT = `
  id,
  title,
  user_id,
  budget,
  start_date,
  end_date,
  is_public,
  destination_name,
  plan_members!left(user_id, tier)
`;

export async function fetchPlanByIdWithMembers(
  planId: string,
  { client }: PlanRepositoryOptions = {}
): Promise<PlanWithMembersRecord | null> {
  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("plans")
    .select(PLAN_WITH_MEMBERS_SELECT)
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({
      operation: "fetchPlanByIdWithMembers",
      identifiers: { planId },
      error,
    });
  }

  if (!data) {
    return null;
  }

  return {
    ...mapPlanRow(data),
    members: mapMembers(data.plan_members),
  };
}

export async function fetchPlanBySlug(
  slug: string,
  { client }: PlanRepositoryOptions = {}
): Promise<PlanWithMembersRecord | null> {
  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("plans")
    .select(PLAN_WITH_MEMBERS_SELECT)
    .eq("public_slug", slug)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({
      operation: "fetchPlanBySlug",
      identifiers: { slug },
      error,
    });
  }

  if (!data) {
    return null;
  }

  return {
    ...mapPlanRow(data),
    members: mapMembers(data.plan_members),
  };
}

// Members-free plan fetch for the public read-only path. Anonymous viewers have no grant on
// plan_members, so embedding it (as fetchPlanBySlug does) would fail with a permission error.
// RLS ("Public plans are readable") returns a row only when is_public = true.
const PUBLIC_PLAN_SELECT = `
  id,
  title,
  user_id,
  budget,
  start_date,
  end_date,
  is_public,
  destination_name
`;

export async function fetchPublicPlanById(
  planId: string,
  { client }: PlanRepositoryOptions = {}
): Promise<PlanRecord | null> {
  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("plans")
    .select(PUBLIC_PLAN_SELECT)
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({ operation: "fetchPublicPlanById", identifiers: { planId }, error });
  }

  return data ? mapPlanRow(data) : null;
}

export async function fetchPublicPlanBySlug(
  slug: string,
  { client }: PlanRepositoryOptions = {}
): Promise<PlanRecord | null> {
  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("plans")
    .select(PUBLIC_PLAN_SELECT)
    .eq("public_slug", slug)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({ operation: "fetchPublicPlanBySlug", identifiers: { slug }, error });
  }

  return data ? mapPlanRow(data) : null;
}

export async function fetchLatestSnapshot(
  planId: string,
  { client }: PlanRepositoryOptions = {}
): Promise<SnapshotRowRecord | null> {
  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("plan_snapshots")
    .select("plan_id, version, state, updated_at")
    .eq("plan_id", planId)
    .order("version", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({
      operation: "fetchLatestSnapshot",
      identifiers: { planId },
      error,
    });
  }

  return data ?? null;
}

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSupabaseError } from "@/lib/errors";
import { isUuid } from "@/lib/uuid";
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

export type UserPlannerSummary = {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string | null;
  publicSlug: string;
  coverImage: string | null;
};

export type PublicPlanSummary = {
  id: string;
  title: string;
  coverImage: string | null;
  publicSlug: string;
};

export type UserDestination = {
  name: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
};

// private row types kept local to the repo; consumers see the mapped *Record types above.

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

type PlanMemberRow = {
  user_id: string;
  tier: string;
};

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
  if (!rows) return [];
  return rows.map((row) => ({ userId: row.user_id, tier: row.tier }));
}

export class PlanRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async fetchPlanIdentityById(planId: string): Promise<PlanIdentity | null> {
    const { data, error } = await this.client
      .from("plans")
      .select("id, user_id")
      .eq("id", planId)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError({ operation: "fetchPlanIdentityById", identifiers: { planId }, error });
    }

    return data ? { id: data.id, ownerId: data.user_id } : null;
  }

  async fetchPlanIdentityBySlug(slug: string): Promise<PlanIdentity | null> {
    const { data, error } = await this.client
      .from("plans")
      .select("id, user_id")
      .eq("public_slug", slug)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError({ operation: "fetchPlanIdentityBySlug", identifiers: { slug }, error });
    }

    return data ? { id: data.id, ownerId: data.user_id } : null;
  }

  async fetchPlanByIdWithMembers(planId: string): Promise<PlanWithMembersRecord | null> {
    const { data, error } = await this.client
      .from("plans")
      .select(
        "id, title, user_id, budget, start_date, end_date, is_public, destination_name, plan_members!left(user_id, tier)"
      )
      .eq("id", planId)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError({ operation: "fetchPlanByIdWithMembers", identifiers: { planId }, error });
    }

    return data ? { ...mapPlanRow(data), members: mapMembers(data.plan_members) } : null;
  }

  async fetchPlanBySlug(slug: string): Promise<PlanWithMembersRecord | null> {
    const { data, error } = await this.client
      .from("plans")
      .select(
        "id, title, user_id, budget, start_date, end_date, is_public, destination_name, plan_members!left(user_id, tier)"
      )
      .eq("public_slug", slug)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError({ operation: "fetchPlanBySlug", identifiers: { slug }, error });
    }

    return data ? { ...mapPlanRow(data), members: mapMembers(data.plan_members) } : null;
  }

  async fetchPublicPlanById(planId: string): Promise<PlanRecord | null> {
    const { data, error } = await this.client
      .from("plans")
      .select("id, title, user_id, budget, start_date, end_date, is_public, destination_name")
      .eq("id", planId)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError({ operation: "fetchPublicPlanById", identifiers: { planId }, error });
    }

    return data ? mapPlanRow(data) : null;
  }

  async fetchPublicPlanBySlug(slug: string): Promise<PlanRecord | null> {
    const { data, error } = await this.client
      .from("plans")
      .select("id, title, user_id, budget, start_date, end_date, is_public, destination_name")
      .eq("public_slug", slug)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError({ operation: "fetchPublicPlanBySlug", identifiers: { slug }, error });
    }

    return data ? mapPlanRow(data) : null;
  }

  async fetchLatestSnapshot(planId: string): Promise<SnapshotRowRecord | null> {
    const { data, error } = await this.client
      .from("plan_snapshots")
      .select("plan_id, version, state, updated_at")
      .eq("plan_id", planId)
      .order("version", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError({ operation: "fetchLatestSnapshot", identifiers: { planId }, error });
    }

    return data ?? null;
  }

  async fetchPlanTitle(planId: string): Promise<string | null> {
    const { data, error } = await this.client.from("plans").select("title").eq("id", planId).single();

    if (error) {
      throw formatSupabaseError({ operation: "fetchPlanTitle", identifiers: { planId }, error });
    }

    return data?.title ?? null;
  }

  async updatePlanTitle(planId: string, newTitle: string): Promise<void> {
    const { error } = await this.client.rpc("update_plan_title", {
      _plan_id: planId,
      _new_title: newTitle,
    });

    if (error) {
      throw formatSupabaseError({ operation: "updatePlanTitle", identifiers: { planId }, error });
    }
  }

  async getUserPlanners(): Promise<UserPlannerSummary[]> {
    const { data, error } = await this.client.rpc("get_user_planners");

    if (error) {
      throw formatSupabaseError({ operation: "getUserPlanners", error });
    }

    const rows = data ?? [];

    return rows.map((row) => {
      const title = row.title ?? row.destination_name ?? "Untitled plan";
      const updatedAt = row.latest_snapshot_at ?? row.created_at ?? null;

      return {
        id: row.id,
        title,
        destination: row.destination_name,
        startDate: row.start_date,
        endDate: row.end_date,
        updatedAt,
        publicSlug: row.public_slug,
        coverImage: row.cover_image,
      };
    });
  }

  async getPublicPlans(): Promise<PublicPlanSummary[]> {
    const { data, error } = await this.client
      .from("plans")
      .select("id, title, cover_image, public_slug")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw formatSupabaseError({ operation: "getPublicPlans", error });
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title ?? "Untitled trip",
      coverImage: row.cover_image,
      publicSlug: row.public_slug,
    }));
  }

  async getUserDestinations(userId: string): Promise<UserDestination[]> {
    const { data: memberships, error: membershipsError } = await this.client
      .from("plan_members")
      .select("plan_id")
      .eq("user_id", userId);

    if (membershipsError) {
      throw formatSupabaseError({
        operation: "getUserDestinations memberships",
        identifiers: { userId },
        error: membershipsError,
      });
    }

    const memberPlanIds = memberships?.map((m) => m.plan_id) ?? [];
    const query = this.client
      .from("plans")
      .select("destination_name, destination_country, latitude, longitude");
    const scopedQuery = memberPlanIds.length
      ? query.or(`user_id.eq.${userId},id.in.(${memberPlanIds.join(",")})`)
      : query.eq("user_id", userId);
    const { data, error } = await scopedQuery.not("destination_name", "is", null);

    if (error) {
      throw formatSupabaseError({ operation: "getUserDestinations", identifiers: { userId }, error });
    }

    const byName = new Map<string, UserDestination>();
    for (const row of data ?? []) {
      const name = row.destination_name?.trim();
      if (!name || byName.has(name)) continue;
      byName.set(name, {
        name,
        country: row.destination_country,
        lat: row.latitude,
        lng: row.longitude,
      });
    }

    return Array.from(byName.values());
  }

  async setPlanVisibility(planId: string, isPublic: boolean): Promise<void> {
    const { error } = await this.client.from("plans").update({ is_public: isPublic }).eq("id", planId);

    if (error) {
      throw formatSupabaseError({
        operation: "setPlanVisibility",
        identifiers: { planId, isPublic: String(isPublic) },
        error,
      });
    }
  }

  async updatePlanDates(planId: string, startDate: string, endDate: string): Promise<void> {
    const { error } = await this.client.rpc("update_plan_dates", {
      _plan_id: planId,
      _start_date: startDate,
      _end_date: endDate,
    });

    if (error) {
      throw formatSupabaseError({ operation: "updatePlanDates", identifiers: { planId }, error });
    }
  }

  async updatePlanCoverImage(planId: string, coverImageUrl: string): Promise<void> {
    try {
      const { error } = await this.client
        .from("plans")
        .update({ cover_image: coverImageUrl })
        .eq("id", planId);

      if (error) {
        console.error("Failed to update plan cover image", { planId, error });
      }
    } catch (error) {
      console.error("Unexpected error updating plan cover image", { planId, error });
    }
  }

  async delete(planId: string): Promise<void> {
    const { error } = await this.client.from("plans").delete().eq("id", planId);

    if (error) {
      throw formatSupabaseError({ operation: "deletePlan", identifiers: { planId }, error });
    }
  }

  async createPlan(params: {
    title: string;
    destName: string;
    destLat?: number;
    destLong?: number;
    destCountry?: string;
    startDate: string;
    endDate: string;
    userId?: string;
    coverImage?: string;
  }): Promise<{ id: string; publicSlug: string }> {
    const { data, error } = await this.client.rpc("create_full_plan", {
      _title: params.title,
      _dest_name: params.destName,
      _dest_lat: params.destLat,
      _dest_long: params.destLong,
      _dest_country: params.destCountry,
      _start_date: params.startDate,
      _end_date: params.endDate,
      _user_id: params.userId ?? undefined,
      _cover_image: params.coverImage ?? undefined,
    });

    if (error || !data) {
      const errorMessage =
        error && typeof error === "object" && "message" in error ? String(error.message) : "Unknown error";
      throw new Error(
        `Failed to create plan: operation=createPlan title="${params.title}" destination="${params.destName}" userId=${params.userId ?? "null"} error=${errorMessage}`
      );
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | { result_plan_id?: string | null; result_public_slug?: string | null }
      | undefined;

    if (!row?.result_plan_id || !row.result_public_slug) {
      throw new Error(
        `Failed to create plan: operation=createPlan title="${params.title}" destination="${params.destName}" userId=${params.userId ?? "null"} error=RPC returned no plan identifiers`
      );
    }

    const { result_plan_id, result_public_slug } = row;

    return { id: result_plan_id, publicSlug: result_public_slug };
  }

  async fetchPlanMetadata(
    identifier: string
  ): Promise<{ title: string | null; destinationName: string | null }> {
    const { data, error } = await this.client
      .from("plans")
      .select("title, destination_name")
      .eq(isUuid(identifier) ? "id" : "public_slug", identifier)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError({ operation: "fetchPlanMetadata", identifiers: { identifier }, error });
    }

    return { title: data?.title ?? null, destinationName: data?.destination_name ?? null };
  }
}

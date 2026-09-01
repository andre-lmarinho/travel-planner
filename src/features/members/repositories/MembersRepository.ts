import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSupabaseError } from "@/lib/errors";
import type { Database } from "@/supabase/types";

import type { AddMemberResult, ShareMember, ShareTier } from "../types";

type ProfileRow = {
  id: string;
  slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type MemberWithProfileRow = {
  user_id: string;
  tier: ShareTier;
  profiles: ProfileRow | null;
};

function mapProfile(row: ProfileRow | null) {
  if (!row) return null;
  return {
    userId: row.id,
    slug: row.slug,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

function mapMember(row: MemberWithProfileRow): ShareMember {
  const profile = mapProfile(row.profiles);
  return {
    userId: row.user_id,
    tier: row.tier,
    slug: profile?.slug ?? null,
    displayName: profile?.displayName ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
  };
}

export class MembersRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async fetchMembers(planId: string): Promise<ShareMember[]> {
    const { data, error } = (await this.client
      .from("plan_members")
      .select(
        "user_id, tier, profiles:profiles!plan_members_user_id_fkey(id, slug, display_name, avatar_url)"
      )
      .eq("plan_id", planId)
      .order("created_at")) as { data: MemberWithProfileRow[] | null; error: unknown };

    if (error) {
      throw formatSupabaseError({
        operation: "fetchMembers",
        identifiers: { planId },
        error,
      });
    }

    return (data ?? []).map(mapMember);
  }

  async addMemberByEmail(planId: string, email: string, tier: ShareTier): Promise<AddMemberResult> {
    type RpcReturn = Database["public"]["Functions"]["add_plan_member_by_email"]["Returns"];

    const { data, error } = (await this.client.rpc("add_plan_member_by_email", {
      _plan_id: planId,
      _email: email,
      _tier: tier,
    })) as { data: RpcReturn | null; error: unknown };

    if (error) {
      throw formatSupabaseError({
        operation: "addMemberByEmail",
        identifiers: { planId, tier },
        error,
      });
    }

    const result = data?.[0];
    if (!result) {
      throw new Error("addMemberByEmail: no result returned");
    }

    return {
      userId: result.user_id,
      tier: result.tier,
    };
  }

  async updateMemberTier(planId: string, userId: string, tier: ShareTier): Promise<void> {
    const { error } = await this.client.rpc("update_plan_member_tier", {
      _plan_id: planId,
      _user_id: userId,
      _tier: tier,
    });

    if (error) {
      throw formatSupabaseError({
        operation: "updateMemberTier",
        identifiers: { planId, userId, tier },
        error,
      });
    }
  }

  async removeMember(planId: string, userId: string): Promise<void> {
    const { error } = await this.client.rpc("remove_plan_member", {
      _plan_id: planId,
      _user_id: userId,
    });

    if (error) {
      throw formatSupabaseError({
        operation: "removeMember",
        identifiers: { planId, userId },
        error,
      });
    }
  }

  async leavePlan(planId: string): Promise<void> {
    const { error } = await this.client.rpc("leave_plan", {
      _plan_id: planId,
    });

    if (error) {
      throw formatSupabaseError({
        operation: "leavePlan",
        identifiers: { planId },
        error,
      });
    }
  }
}

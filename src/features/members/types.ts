import type { Database } from "@/supabase/types";

// Core Types

export type ShareTier = Database["public"]["Enums"]["plan_member_tier"];

export type ShareMember = {
  userId: string;
  tier: ShareTier;
  slug: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ShareMembersData = {
  ownerId: string | null;
  members: ShareMember[];
};

// Action Results

export type AddMemberResult = {
  userId: string;
  tier: ShareTier;
};

// UI Constants

export const SHARE_TIER_OPTIONS = [
  { value: "admin" as const, label: "Admin" },
  { value: "member" as const, label: "Member" },
] as const;

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSupabaseMock } from "@tests/utils/testHelpers";
import { describe, expect, it } from "vitest";

import type { Database } from "@/supabase/types";

import { PlanRepository } from "./PlanRepository";

type PlanIdentityRow = {
  id: string;
  user_id: string | null;
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
  destination_name: string | null;
};

type PlanWithMembersRow = PlanRow & {
  plan_members: PlanMemberRow[] | null;
};

function makeRepo(client: SupabaseClient<Database>): PlanRepository {
  return new PlanRepository(client);
}

describe("PlanRepository", () => {
  describe("fetchPlanIdentityById", () => {
    it("maps the plan identity", async () => {
      const data: PlanIdentityRow = { id: "plan-1", user_id: "owner-1" };
      const { supabase, from, chain: planQuery } = buildSupabaseMock("plans", { data, error: null });

      const result = await makeRepo(supabase).fetchPlanIdentityById("plan-1");

      expect(result).toEqual({ id: "plan-1", ownerId: "owner-1" });
      expect(from).toHaveBeenCalledWith("plans");
      expect(planQuery.select).toHaveBeenCalledWith("id, user_id");
      expect(planQuery.eq).toHaveBeenCalledWith("id", "plan-1");
    });

    it("returns null when no plan exists", async () => {
      const { supabase } = buildSupabaseMock<PlanIdentityRow>("plans", { data: null, error: null });

      const result = await makeRepo(supabase).fetchPlanIdentityById("plan-2");

      expect(result).toBeNull();
    });

    it("throws a formatted error when Supabase fails", async () => {
      const failure = new Error("plan failure");
      const { supabase } = buildSupabaseMock<PlanIdentityRow>("plans", { data: null, error: failure });

      await expect(makeRepo(supabase).fetchPlanIdentityById("plan-3")).rejects.toThrow(
        expect.objectContaining({ operation: "fetchPlanIdentityById" })
      );
    });
  });

  describe("fetchPlanIdentityBySlug", () => {
    it("maps the plan identity by slug", async () => {
      const data: PlanIdentityRow = { id: "plan-10", user_id: "owner-10" };
      const { supabase, from, chain: planQuery } = buildSupabaseMock("plans", { data, error: null });

      const result = await makeRepo(supabase).fetchPlanIdentityBySlug("public-slug");

      expect(result).toEqual({ id: "plan-10", ownerId: "owner-10" });
      expect(from).toHaveBeenCalledWith("plans");
      expect(planQuery.eq).toHaveBeenCalledWith("public_slug", "public-slug");
    });
  });

  describe("fetchPlanByIdWithMembers", () => {
    it("maps plan and members", async () => {
      const data: PlanWithMembersRow = {
        id: "plan-1",
        title: "Trip",
        user_id: "owner-1",
        budget: 100,
        start_date: "2024-01-01",
        end_date: "2024-01-05",
        destination_name: "Berlin",
        plan_members: [{ user_id: "member-1", tier: "admin" }],
      };
      const { supabase, chain: planQuery } = buildSupabaseMock("plans", { data, error: null });

      const result = await makeRepo(supabase).fetchPlanByIdWithMembers("plan-1");

      expect(result).toEqual({
        id: "plan-1",
        title: "Trip",
        ownerId: "owner-1",
        budget: 100,
        startDate: "2024-01-01",
        endDate: "2024-01-05",
        destinationName: "Berlin",
        members: [{ userId: "member-1", tier: "admin" }],
      });
      expect(planQuery.select).toHaveBeenCalledWith(expect.stringContaining("plan_members!left"));
    });

    it("returns null when no plan exists", async () => {
      const { supabase } = buildSupabaseMock<PlanWithMembersRow>("plans", { data: null, error: null });

      const result = await makeRepo(supabase).fetchPlanByIdWithMembers("plan-2");

      expect(result).toBeNull();
    });

    it("throws a formatted error when Supabase fails", async () => {
      const failure = new Error("plan failure");
      const { supabase } = buildSupabaseMock<PlanWithMembersRow>("plans", { data: null, error: failure });

      await expect(makeRepo(supabase).fetchPlanByIdWithMembers("plan-3")).rejects.toThrow(
        expect.objectContaining({ operation: "fetchPlanByIdWithMembers" })
      );
    });
  });

  describe("fetchPlanBySlug", () => {
    it("maps a plan row with members", async () => {
      const data: PlanWithMembersRow = {
        id: "plan-10",
        title: "Public trip",
        user_id: "owner-10",
        budget: 250,
        start_date: "2024-02-01",
        end_date: "2024-02-03",
        destination_name: "Oslo",
        plan_members: [{ user_id: "member-1", tier: "viewer" }],
      };
      const { supabase, chain: planQuery } = buildSupabaseMock("plans", { data, error: null });

      const result = await makeRepo(supabase).fetchPlanBySlug("public-slug");

      expect(result).toEqual({
        id: "plan-10",
        title: "Public trip",
        ownerId: "owner-10",
        budget: 250,
        startDate: "2024-02-01",
        endDate: "2024-02-03",
        destinationName: "Oslo",
        members: [{ userId: "member-1", tier: "viewer" }],
      });
      expect(planQuery.eq).toHaveBeenCalledWith("public_slug", "public-slug");
    });
  });

  describe("getUserPlanners", () => {
    it("maps rows using the rpc result", async () => {
      const rpcData = [
        {
          id: "plan-1",
          title: null,
          start_date: "2024-01-01",
          end_date: "2024-01-05",
          created_at: "2023-12-31T00:00:00Z",
          destination_name: "Lisbon",
          latest_snapshot_at: "2024-01-03T12:00:00Z",
          cover_image: null,
        },
      ];
      const rpc = () => Promise.resolve({ data: rpcData, error: null });
      const supabase = { rpc } as unknown as SupabaseClient<Database>;

      const result = await makeRepo(supabase).getUserPlanners();

      expect(result).toEqual([
        {
          id: "plan-1",
          title: "Lisbon",
          destination: "Lisbon",
          startDate: "2024-01-01",
          endDate: "2024-01-05",
          updatedAt: "2024-01-03T12:00:00Z",

          coverImage: null,
        },
      ]);
    });
  });
});

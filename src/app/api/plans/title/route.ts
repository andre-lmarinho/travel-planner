import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("planId")?.trim();

  if (!planId) {
    return NextResponse.json({ error: "Missing planId." }, { status: 400 });
  }

  try {
    const repo = new PlanRepository(createSupabaseServerClient());
    const title = await repo.fetchPlanTitle(planId);
    return NextResponse.json({ title });
  } catch (error) {
    console.error("Failed to fetch plan title:", { planId }, error);
    return NextResponse.json({ error: "Unable to fetch plan title." }, { status: 500 });
  }
}

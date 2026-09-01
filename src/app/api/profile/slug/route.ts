import { NextResponse } from "next/server";

import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { requireUser, UnauthorizedError } from "@/shared/lib/auth/session";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

export async function GET() {
  try {
    const user = await requireUser();
    const repo = new ProfileRepository(createSupabaseServerClient());
    const slug = await repo.fetchProfileSlugByUserId(user.id);
    return NextResponse.json({ slug });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Unable to fetch profile slug." }, { status: 500 });
  }
}

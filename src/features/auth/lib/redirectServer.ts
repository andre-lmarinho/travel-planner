import "server-only";

import { redirect } from "next/navigation";
import { ensureProfile } from "@/features/auth/lib/ensureProfile";
import { getCurrentUser } from "@/features/auth/lib/session";

export async function redirectIfAuthenticated(nextPath: string | null): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const slug = await ensureProfile();
  redirect(nextPath ?? `/u/${slug}`);
}

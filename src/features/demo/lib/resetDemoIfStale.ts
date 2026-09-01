import "server-only";

import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

// Brings the shared demo world back to its curated baseline when at least an hour
// has passed (self-guarded in SQL by maybe_reset_demo). Safe to call on every demo
// visit: it is a no-op when the demo user is stale-untouched or not due yet.
export async function resetDemoIfStale(): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.rpc("maybe_reset_demo");
  } catch {
    // reset is best-effort on entry (no cron). A visitor whose tab stays
    // open past the hour keeps the stale world until the next entry; add a real
    // scheduler if strict hour-aligned reset is ever required.
  }
}

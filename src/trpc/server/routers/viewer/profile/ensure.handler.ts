import { ensureProfile } from "@/features/auth/lib/ensureProfile";

import type { AuthedTRPCContext } from "../../../createContext";
import type { EnsureProfileInput } from "./ensure.schema";

export async function ensureProfileHandler({
  ctx,
  input: _input,
}: {
  ctx: AuthedTRPCContext;
  input: EnsureProfileInput;
}) {
  return ensureProfile({ client: ctx.supabase });
}

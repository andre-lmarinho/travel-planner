import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/supabase/types";

export type Viewer = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

const isE2E = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_E2E === "1";
const E2E_USER_ID_COOKIE = "e2e-user-id";

async function getE2EUserFromCookies(): Promise<Viewer | null> {
  if (!isE2E) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get(E2E_USER_ID_COOKIE)?.value?.trim();

    if (!userId) {
      return null;
    }

    return {
      id: userId,
      email: `${userId}@e2e.test`,
    };
  } catch {
    return null;
  }
}

export function isAuthSessionMissingError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as { code?: string; message?: string; status?: number };
  const message = maybeError.message?.toLowerCase() ?? "";
  return (
    maybeError.status === 400 &&
    (message.includes("auth session missing") ||
      message.includes("invalid refresh token") ||
      maybeError.code === "refresh_token_not_found")
  );
}

export async function getViewer(
  supabase: SupabaseClient<Database> = createSupabaseServerClient()
): Promise<Viewer | null> {
  const e2eUser = await getE2EUserFromCookies();
  if (e2eUser) {
    return e2eUser;
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isAuthSessionMissingError(error)) return null;
      throw error;
    }

    return data.user
      ? {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        }
      : null;
  } catch (error) {
    if (!isAuthSessionMissingError(error)) {
      throw error;
    }
  }

  return null;
}

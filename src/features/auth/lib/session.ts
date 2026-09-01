import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/supabase/types";

export type SupabaseUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

const isE2E = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_E2E === "1";
const E2E_USER_ID_COOKIE = "e2e-user-id";

async function getE2EUserFromCookies(): Promise<SupabaseUser | null> {
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

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function isAuthSessionMissingError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as { message?: string; status?: number };
  return (
    maybeError.status === 400 &&
    typeof maybeError.message === "string" &&
    maybeError.message.toLowerCase().includes("auth session missing")
  );
}

export async function getCurrentUser(
  supabase: SupabaseClient<Database> = createSupabaseServerClient()
): Promise<SupabaseUser | null> {
  const e2eUser = await getE2EUserFromCookies();
  if (e2eUser) {
    return e2eUser;
  }

  try {
    const { data } = await supabase.auth.getUser();
    return data.user as SupabaseUser | null;
  } catch (error) {
    if (!isAuthSessionMissingError(error)) {
      throw error;
    }
  }

  return null;
}

export async function requireUser(): Promise<SupabaseUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

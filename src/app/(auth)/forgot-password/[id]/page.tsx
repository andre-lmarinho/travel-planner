import type { Metadata } from "next";

import { resolveNextPath } from "@/features/auth/lib/redirect";
import { redirectIfAuthenticated } from "@/features/auth/lib/redirectServer";
import { ResetPasswordView } from "@/modules/auth/forgot-password/forgot-password-reset-view";

export const metadata: Metadata = {
  title: "Reset password | Turistar",
};

export default async function ForgotPasswordResetPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolveNextPath(resolvedSearchParams?.next);

  await redirectIfAuthenticated(nextPath);

  return <ResetPasswordView nextPath={nextPath} />;
}

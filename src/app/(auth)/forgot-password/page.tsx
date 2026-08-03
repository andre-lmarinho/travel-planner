import type { Metadata } from "next";

import { resolveNextPath } from "@/features/auth/lib/redirect";
import { redirectIfAuthenticated } from "@/features/auth/lib/redirectServer";
import { ForgotPasswordView } from "@/modules/auth/forgot-password/forgot-password-view";

export const metadata: Metadata = {
  title: "Forgot your password? | Turistar",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolveNextPath(resolvedSearchParams?.next);

  await redirectIfAuthenticated(nextPath);

  return <ForgotPasswordView nextPath={nextPath} />;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { sendResetPasswordEmail } from "@/features/auth/handlers/sendResetPasswordEmail";
import { buildLoginHref, buildResetPasswordRedirectUrl, resolveNextPath } from "@/features/auth/lib/redirect";
import { getAuthErrorMessage } from "@/features/auth/utils/extractErrorMessage";
import { validEmail } from "@/features/auth/utils/validEmail";
import { Button } from "@/ui/components/button/Button";
import { EmailField, Form } from "@/ui/components/form";
import { AccessShell } from "@/ui/components/layout";

const RESET_PASSWORD_FALLBACK = "Unable to reset password.";

export function ForgotPasswordView({ nextPath }: { nextPath?: string | null }) {
  const safeNextPath = resolveNextPath(nextPath);
  const loginHref = buildLoginHref(safeNextPath);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const formMethods = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });
  const { register, formState } = formMethods;

  const handleSubmit = async ({ email }: { email: string }) => {
    setFormError(null);
    setEmailSent(false);

    try {
      const redirectTo = buildResetPasswordRedirectUrl(safeNextPath, window.location.origin);
      await sendResetPasswordEmail({ email, redirectTo });
      setEmailSent(true);
    } catch (error) {
      setFormError(getAuthErrorMessage(error, RESET_PASSWORD_FALLBACK));
    }
  };

  return (
    <AccessShell
      title="Forgot your password?"
      footer={
        <Link href={loginHref} className="text-foreground hover:underline">
          Back to login
        </Link>
      }>
      <Form form={formMethods} onSubmit={handleSubmit} className="grid gap-6" noValidate>
        <EmailField
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          {...register("email", {
            required: "Email is required.",
            validate: (value) => (validEmail(value) ? true : "Enter a valid email."),
          })}
        />
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}
        {emailSent ? (
          <output className="text-muted-foreground text-sm" aria-live="polite">
            Check your email for a reset link.
          </output>
        ) : null}
        <Button type="submit" disabled={formState.isSubmitting} className="text-base font-semibold">
          {formState.isSubmitting ? "Sending link..." : "Send reset link"}
        </Button>
      </Form>
    </AccessShell>
  );
}

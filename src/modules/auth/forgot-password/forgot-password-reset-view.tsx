"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { exchangeResetPasswordSession } from "@/features/auth/handlers/exchangeResetPasswordSession";
import { updatePassword } from "@/features/auth/handlers/updatePassword";
import { buildLoginHref, resolveNextPath } from "@/features/auth/lib/redirect";
import { mapResetPasswordError } from "@/features/auth/utils/mapResetPasswordError";
import { readResetPasswordParams } from "@/features/auth/utils/readResetPasswordParams";
import { MIN_PASSWORD_LENGTH, validPassword } from "@/features/auth/utils/validPassword";
import { Button } from "@/ui/components/button/Button";
import { Form, PasswordField } from "@/ui/components/form";
import { AccessShell } from "@/ui/components/layout";

const INVALID_LINK_MESSAGE = "Reset link is invalid or has expired.";

function getHashParams(): URLSearchParams | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export function ResetPasswordView({ nextPath }: { nextPath?: string | null }) {
  const searchParams = useSearchParams();
  const safeNextPath = resolveNextPath(nextPath);
  const loginHref = buildLoginHref(safeNextPath);
  const [formError, setFormError] = useState<string | null>(null);
  const [exchangeState, setExchangeState] = useState<"idle" | "validating" | "ready" | "error">("idle");
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const formMethods = useForm<{ password: string }>({
    defaultValues: { password: "" },
  });
  const { register, formState } = formMethods;

  useEffect(() => {
    const hashParams = getHashParams();
    const { code, error } = readResetPasswordParams(searchParams, hashParams);

    if (error) {
      setExchangeState("error");
      setFormError(mapResetPasswordError(error));
      return;
    }

    if (!code) {
      setExchangeState("error");
      setFormError(INVALID_LINK_MESSAGE);
      return;
    }

    let isActive = true;

    async function validateResetCode(resetCode: string) {
      setFormError(null);
      setExchangeState("validating");

      const result = await exchangeResetPasswordSession(resetCode);

      if (!isActive) return;

      if (result.status === "error") {
        setExchangeState("error");
        setFormError(mapResetPasswordError(result.error ?? INVALID_LINK_MESSAGE));
        return;
      }

      setExchangeState("ready");
    }

    void validateResetCode(code);

    return () => {
      isActive = false;
    };
  }, [searchParams]);

  const handleSubmit = async ({ password }: { password: string }) => {
    if (exchangeState !== "ready") {
      setFormError(INVALID_LINK_MESSAGE);
      return;
    }

    setFormError(null);
    setPasswordUpdated(false);

    try {
      const result = await updatePassword(password);
      if (!result.ok) {
        throw result.error;
      }
      setPasswordUpdated(true);
    } catch (error) {
      setFormError(mapResetPasswordError(error));
    }
  };

  return (
    <AccessShell
      title="Reset your password"
      footer={
        <Link href={loginHref} className="text-foreground hover:underline">
          Back to login
        </Link>
      }>
      <Form form={formMethods} onSubmit={handleSubmit} className="grid gap-6" noValidate>
        <PasswordField
          label="New password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          {...register("password", {
            required: "Password is required.",
            validate: (value) =>
              validPassword(value) ? true : `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
          })}
        />
        {exchangeState === "validating" ? (
          <output className="text-muted-foreground text-sm" aria-live="polite">
            Validating reset link...
          </output>
        ) : null}
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}
        {passwordUpdated ? (
          <output className="text-muted-foreground text-sm" aria-live="polite">
            Password updated. You can sign in now.
          </output>
        ) : null}
        <Button
          type="submit"
          disabled={formState.isSubmitting || exchangeState !== "ready"}
          className="text-base font-semibold">
          {formState.isSubmitting ? "Updating password..." : "Update password"}
        </Button>
      </Form>
    </AccessShell>
  );
}

"use client";

import type { FormEventHandler } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePlannerContext } from "@/features/plan/hooks/PlannerContext";
import { Button } from "@/ui/components/button";
import { SelectMenu } from "@/ui/components/select/SelectMenu";

import { useShareMembers } from "../hooks/useShareMembers";
import type { ShareTier } from "../types";
import { SHARE_TIER_OPTIONS } from "../types";

const getInviteErrorMessage = (error: unknown) => {
  const errorCode =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (errorCode === "USER_NOT_REGISTERED") {
    return "This email has no account yet. Ask them to sign up first, then invite again.";
  }

  return "We could not add this member. Please try again.";
};

export function InviteForm({ planId }: { planId: string }) {
  const { canManageMembers } = usePlannerContext();
  const { addMember, isLoading } = useShareMembers(planId, {
    enabled: Boolean(planId),
  });
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<ShareTier>("member");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const successTimeoutRef = useRef<number | null>(null);

  const clearSuccessTimeout = useCallback(() => {
    if (successTimeoutRef.current === null) {
      return;
    }
    window.clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearSuccessTimeout();
    };
  }, [clearSuccessTimeout]);

  const clearMessages = () => {
    setFormError("");
    setFormSuccess("");
    clearSuccessTimeout();
  };

  const showSuccess = (message: string) => {
    setFormSuccess(message);
    setFormError("");
    clearSuccessTimeout();
    successTimeoutRef.current = window.setTimeout(() => {
      setFormSuccess("");
    }, 3000);
  };

  const showError = (message: string) => {
    setFormError(message);
    setFormSuccess("");
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!canManageMembers) {
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showError("Enter a valid email.");
      return;
    }

    try {
      await addMember.mutateAsync({ planIdOrSlug: planId, email: trimmedEmail, tier });
      setEmail("");
      showSuccess("Member added.");
    } catch (error) {
      showError(getInviteErrorMessage(error));
    }
  };

  return (
    <div className="space-y-2">
      <form className="flex w-full flex-nowrap items-center gap-2" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="Email address…"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (formError || formSuccess) {
              clearMessages();
            }
          }}
          className="border-border bg-background text-foreground min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
          disabled={!canManageMembers}
        />
        <SelectMenu
          value={tier}
          options={SHARE_TIER_OPTIONS}
          onChange={setTier}
          disabled={!canManageMembers}
          ariaLabel="Select member role"
          triggerClassName="w-28 shrink-0"
          contentClassName="w-28"
        />
        <Button
          type="submit"
          className="shrink-0"
          disabled={!canManageMembers || addMember.isPending || isLoading}>
          Share
        </Button>
      </form>
      {!canManageMembers ? (
        <p className="text-muted-foreground text-xs">Only admins can invite people.</p>
      ) : null}
      {formSuccess ? (
        <output className="text-foreground block text-xs" aria-live="polite">
          {formSuccess}
        </output>
      ) : null}
      {formError ? (
        <p className="text-destructive text-xs" role="alert">
          {formError}
        </p>
      ) : null}
    </div>
  );
}

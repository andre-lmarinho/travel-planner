"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { getAuthErrorMessage } from "@/features/auth/utils/extractErrorMessage";
import { normalizeUsername, validUsername } from "@/features/auth/utils/validUsername";
import { trpc } from "@/trpc/react";
import { Button } from "@/ui/components/button";
import { Dialog, DialogContent, DialogHeader } from "@/ui/components/dialog";
import { InputField } from "@/ui/components/form";
import { UserRound } from "@/ui/components/icon";

type AccountSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string | null;
  email: string | null;
  slug: string | null;
};

export function AccountSettingsDialog({
  open,
  onOpenChange,
  displayName,
  email,
  slug,
}: AccountSettingsDialogProps) {
  const [name, setName] = useState(displayName ?? "");
  const [username, setUsername] = useState(slug ?? "");
  const [error, setError] = useState<string | null>(null);
  const updateProfile = trpc.viewer.profile.update.useMutation();

  useEffect(() => {
    if (!open) return;
    setName(displayName ?? "");
    setUsername(slug ?? "");
    setError(null);
  }, [displayName, open, slug]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUsername = normalizeUsername(username);
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!validUsername(normalizedUsername)) {
      setError("Use 1 to 28 lowercase letters, numbers, or hyphens.");
      return;
    }

    setError(null);
    try {
      await updateProfile.mutateAsync({ displayName: name.trim(), slug: normalizedUsername });
      onOpenChange(false);
      window.location.assign(`/u/${normalizedUsername}`);
    } catch (cause) {
      setError(getAuthErrorMessage(cause, "Unable to save your settings."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl">
        <DialogHeader title="Account settings" description="Update your name and public profile address." />
        <form onSubmit={handleSubmit} className="grid gap-5 p-5">
          <div className="bg-muted/40 flex items-center gap-3 rounded-xl border p-3">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
              <UserRound className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{email ?? "Signed in"}</p>
              <p className="text-muted-foreground text-xs">Your email cannot be changed here.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <InputField
              id="account-display-name"
              label="Name"
              name="displayName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="What should we call you?"
              maxLength={80}
              required
            />
            <div>
              <InputField
                id="account-username"
                label="Username"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                spellCheck={false}
                maxLength={28}
                required
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Your profile will be available at /u/{normalizeUsername(username) || "your-username"}.
              </p>
            </div>
          </div>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/shared/ui/avatar";
import { Popover, PopoverContent, PopoverTriggerButton } from "@/shared/ui/popover";
import { supabase } from "@/supabase/client";

type AvatarMenuProps = {
  displayName: string | null;
  email: string | null;
};

export function AvatarMenu({ displayName, email }: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTriggerButton
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Account menu"
        className="cursor-pointer p-1">
        <Avatar displayName={displayName} />
      </PopoverTriggerButton>
      <PopoverContent
        className="border-border bg-card text-foreground w-64 space-y-3 rounded-xl border p-4 shadow-lg"
        side="bottom"
        align="end"
        sideOffset={4}>
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Account</h2>
        <div className="flex items-center gap-3">
          <Avatar displayName={displayName} size="lg" />
          <div className="min-w-0">
            <p className="text-sm leading-tight font-semibold">{displayName ?? "Traveler"}</p>
            <p className="text-muted-foreground truncate text-xs">{email ?? "Signed in"}</p>
          </div>
        </div>
        <hr />
        <button
          type="button"
          onClick={handleSignOut}
          className="text-primary hover:text-primary/80 inline-flex w-full cursor-pointer items-center gap-2 text-sm">
          Log out
        </button>
      </PopoverContent>
    </Popover>
  );
}

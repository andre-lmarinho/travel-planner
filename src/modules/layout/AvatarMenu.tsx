"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccountSettingsDialog } from "@/modules/layout/AccountSettingsDialog";
import { supabase } from "@/supabase/client";
import { Avatar } from "@/ui/components/avatar";
import { LogOut, Settings } from "@/ui/components/icon";
import { Popover, PopoverContent, PopoverTriggerButton } from "@/ui/components/popover";

type AvatarMenuProps = {
  displayName: string | null;
  email: string | null;
  slug: string | null;
};

export function AvatarMenu({ displayName, email, slug }: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTriggerButton
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Account menu"
          className="focus-visible:ring-ring flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100">
          <Avatar displayName={displayName} size="lg" />
        </PopoverTriggerButton>

        <PopoverContent
          className="border-border text-foreground w-56 max-w-[calc(100vw-2rem)] rounded-xl border p-2 shadow-md"
          side="bottom"
          align="end"
          sideOffset={8}>
          <div className="flex min-w-0 items-center gap-2 px-3 py-1">
            <Avatar displayName={displayName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName ?? "Traveler"}</p>
              <p className="text-muted-foreground truncate text-xs">{email ?? "Signed in"}</p>
            </div>
          </div>

          <div className="border-border mt-2 grid gap-1 border-t pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
              className="hover:bg-muted/60 focus-visible:ring-ring flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm transition focus-visible:ring-2 focus-visible:outline-none">
              <Settings className="text-muted-foreground size-4" aria-hidden="true" />
              Settings
            </button>
          </div>

          <div className="border-border mt-1 border-t pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="hover:bg-muted/60 focus-visible:ring-ring flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm transition focus-visible:ring-2 focus-visible:outline-none">
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </button>
          </div>

          <div className="text-muted-foreground/70 mt-1 flex items-center justify-center gap-2 border-t pt-2 text-[11px]">
            <Link
              href="/privacy"
              className="hover:text-muted-foreground focus-visible:text-foreground underline-offset-2 hover:underline">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/terms"
              className="hover:text-muted-foreground focus-visible:text-foreground underline-offset-2 hover:underline">
              Terms of use
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      <AccountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        displayName={displayName}
        email={email}
        slug={slug}
      />
    </>
  );
}

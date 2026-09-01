"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import type { ReactElement } from "react";
import { useState } from "react";

import { Button } from "@/ui/components/button/Button";
import { X } from "@/ui/components/icon/lucide-icons";

type ConfirmationDialogProps = {
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
  isPending?: boolean;
};

function ConfirmationDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending = false,
}: ConfirmationDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error("Confirmation action failed:", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger render={trigger} />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="bg-background/80 data-open:animate-in data-closed:animate-out data-open:fade-in data-closed:fade-out fixed inset-0 z-40 backdrop-blur-sm" />
        <AlertDialog.Popup className="bg-background text-popover-foreground data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-72 -translate-x-1/2 -translate-y-1/2 rounded-md border shadow-md outline-hidden">
          <div className="relative flex items-center justify-end p-2">
            <AlertDialog.Title className="absolute inset-0 p-3 text-center text-sm font-medium">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Close
              className="text-muted-foreground hover:bg-muted/60 hover:text-foreground z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-2 transition-colors"
              aria-label="Close">
              <X className="size-4" aria-hidden="true" />
            </AlertDialog.Close>
          </div>
          <div className="space-y-3 p-3 text-sm">
            <AlertDialog.Description render={<p className="text-foreground" />}>
              {description}
            </AlertDialog.Description>
            <Button
              className="bg-destructive hover:bg-destructive/70 w-full text-background"
              onClick={handleConfirm}
              disabled={isPending}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export { ConfirmationDialog };

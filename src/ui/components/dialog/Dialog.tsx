"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type * as React from "react";

import { X } from "@/ui/components/icon";
import { cn } from "@/ui/utils/cn";

const Dialog = DialogPrimitive.Root;

type DialogHeaderProps = {
  title: string;
  description: string;
  visuallyHidden?: boolean;
};

function DialogHeader({ title, description, visuallyHidden = false }: DialogHeaderProps) {
  return (
    <>
      {visuallyHidden ? (
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
      ) : (
        <div className="relative flex items-center justify-between border-b px-4 py-3">
          <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors"
            aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        </div>
      )}
      <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
    </>
  );
}

type DialogContentProps = React.HTMLAttributes<HTMLDivElement>;

function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="bg-foreground/80 data-open:animate-in data-closed:animate-out data-open:fade-in data-closed:fade-out fixed inset-0 z-40 backdrop-blur-sm" />
      <DialogPrimitive.Popup
        className={cn(
          "bg-background text-foreground fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl border shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className
        )}
        {...props}>
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

type DialogTriggerButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

function DialogTriggerButton({ type = "button", ...props }: DialogTriggerButtonProps) {
  return <DialogPrimitive.Trigger type={type} {...props} />;
}

export { Dialog, DialogContent, DialogHeader, DialogTriggerButton };

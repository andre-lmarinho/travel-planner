"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";

import { cn } from "@/ui/utils/cn";

export const toastManager = BaseToast.createToastManager();

export const toast = {
  error: (message: string) => toastManager.add({ title: message, type: "error" }),
  message: (message: string) => toastManager.add({ title: message }),
  success: (message: string) => toastManager.add({ title: message, type: "success" }),
};

function ToastList() {
  const { toasts } = BaseToast.useToastManager();

  return toasts.map((item) => (
    <BaseToast.Root
      key={item.id}
      toast={item}
      className={cn(
        "bg-card text-card-foreground w-80 rounded-lg border p-4 text-sm shadow-lg",
        "data-[type=error]:border-destructive data-[type=error]:text-destructive",
        "data-[type=success]:border-(--success) data-[type=success]:text-(--success)",
        "data-starting-style:opacity-0 data-ending-style:opacity-0 transition-opacity"
      )}>
      <BaseToast.Title className="font-medium" />
      <BaseToast.Description className="text-muted-foreground" />
    </BaseToast.Root>
  ));
}

export function Toaster() {
  return (
    <BaseToast.Provider toastManager={toastManager}>
      <BaseToast.Portal>
        <BaseToast.Viewport className="fixed top-4 left-1/2 z-100 flex -translate-x-1/2 flex-col gap-2">
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}

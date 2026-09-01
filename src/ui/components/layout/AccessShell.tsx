import type { ReactNode } from "react";

import { Logo } from "@/ui/components/logo";

type AccessShellProps = {
  title: string;
  footer: ReactNode;
  children: ReactNode;
};

export function AccessShell({ title, footer, children }: AccessShellProps) {
  return (
    <main className="py-12 bg-card flex min-h-screen flex-col items-stretch justify-center">
      <Logo className="justify-center" href="/" />
      <div className="flex flex-1 items-center justify-center flex-col gap-6">
        <h1 className="text-center text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="border-border w-full bg-background rounded-2xl max-w-md border px-4 py-10 sm:px-10">
          {children}
        </div>
        <p className="text-muted-foreground text-center text-sm">{footer}</p>
      </div>
    </main>
  );
}

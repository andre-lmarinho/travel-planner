import type { ReactNode } from "react";

import { AppBar } from "@/modules/layout/AppBar";

export default function WebAppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppBar />
      {children}
    </>
  );
}

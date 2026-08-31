import type { ReactNode } from "react";

import { AppBar } from "@/modules/planner/layout/AppBar";

export default function WebAppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppBar />
      {children}
    </>
  );
}

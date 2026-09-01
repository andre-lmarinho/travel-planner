import type { ReactNode } from "react";

import { ClientProviders } from "@/app/providers";

import "@/ui/theme.css";
import "leaflet/dist/leaflet.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground flex min-h-screen flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:bg-background focus:p-2">
          Skip to content
        </a>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

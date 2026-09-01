import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@tests": resolve(__dirname, "./tests"),
      "@supabase/ssr": resolve(__dirname, "./tests/__mocks__/supabaseSsr.ts"),
      "@/ui/theme.css": resolve(__dirname, "./tests/__mocks__/empty.css"),
      "leaflet/dist/leaflet.css": resolve(__dirname, "./tests/__mocks__/empty.css"),
      "server-only": resolve(__dirname, "./tests/__mocks__/serverOnly.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: resolve(__dirname, "./vitest.setup.tsx"),
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    coverage: {
      enabled: process.env.CI === "true",
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.{ts,tsx}"],
      thresholds: {
        statements: 45,
        branches: 40,
        functions: 44,
        lines: 45,
      },
    },
  },
});

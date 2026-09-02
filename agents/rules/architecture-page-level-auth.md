---
title: Page-Level Authorization Checks in Next.js
impact: CRITICAL
impactDescription: Prevents unauthorized access to sensitive data
tags: security, nextjs, authorization, architecture
---

## Page-Level Authorization Checks in Next.js

**Impact: CRITICAL (Prevents unauthorized access to sensitive data)**

Resolve authentication in the page or Server Component that renders private data, and authorize each protected Server Action, Route Handler, and tRPC procedure independently. Do not use a layout as the only authorization check: layouts can persist across navigations and do not re-render for every route change.

**Incorrect (auth checks in layout):**

```tsx
// app/admin/layout.tsx - DON'T DO THIS
export default async function AdminLayout({ children }) {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/");
  }
  return <div>{children}</div>;
}
```

**Correct (auth checks in page):**

```tsx
// app/admin/page.tsx
import { redirect } from "next/navigation";
import { getViewer } from "@/features/auth/lib/session";

export default async function AdminPage() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/"); // Or show an error
  }

  // Use a Service for resource membership and role checks.
  // The authenticated Viewer exposes fields such as `id` and `email`.
  return <div>Protected content for {viewer.email ?? viewer.id}</div>;
}
```

**Why layouts are unsafe for auth:**
- Partial rendering means layouts can persist across navigations without re-running their checks.
- APIs, Server Actions, Route Handlers, and tRPC procedures are independent entry points; protected operations must authorize themselves.
- A layout check alone can therefore leave a data or mutation entry point unprotected.

**Key rules:**
- Resolve the session in a restricted `page.tsx` or Server Component with `getViewer()`.
- Keep resource membership and role checks in the owning Service; RLS remains the final authorization boundary.
- Redirect before rendering private UI, but do not duplicate resource policy in pages or proxy.
- Every protected Server Action, Route Handler, and tRPC procedure must authorize its own operation; UI and Proxy checks are not sufficient.
- Proxy only refreshes the Supabase session and emits transport headers; it does not decide access.

Reference: [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/authentication)
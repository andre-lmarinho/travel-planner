# tRPC

This module is the same-origin transport seam for domain operations.

- Procedures validate input and authentication, then delegate to a feature Service.
- Services own application behavior; repositories are the only modules that access Supabase tables or RPCs.
- The context carries one request-scoped Supabase client so authenticated calls retain `auth.uid()` and RLS.
- Route Handlers remain the adapter for callbacks, streaming, health checks, webhooks, and external proxies.

Keep this contract stable. Add a procedure only when it represents a domain operation with a Service behind it.

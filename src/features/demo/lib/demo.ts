// The shared demo account. Public by design: any visitor can enter without
// registering, and everything they do is wiped back to the curated baseline on the
// next demo reset (see maybe_reset_demo).
export const DEMO_EMAIL = "demo@turistar.me";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_SLUG = "demouser";

export function isDemoUser(email: string | null | undefined): boolean {
  return email === DEMO_EMAIL;
}

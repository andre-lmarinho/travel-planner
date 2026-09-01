// Legacy location for the Supabase error factory. Kept so existing imports keep
// working; new code should import from "@/lib/errors".

export type { ErrorIdentifiers, ErrorIdentifierValue } from "@/lib/errors/SupabaseError";
export { formatSupabaseError } from "@/lib/errors/SupabaseError";

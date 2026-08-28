import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client — bypasses RLS entirely.
 *
 * ⚠️ SERVER-ONLY. Never import this from a Client Component or return its
 * data un-shaped to the browser without thinking about what you're exposing.
 *
 * Two narrow, deliberate uses in this codebase (both in src/app/register/):
 *
 * 1. Reading `faculties`/`study_programs` on the public (pre-login) register
 *    page — RLS on those tables only grants SELECT `to authenticated`, not
 *    `anon`, so an unauthenticated visitor can't read them any other way
 *    without an RLS change. The data itself is non-sensitive reference data.
 * 2. Provisioning `public.users`/`public.students` right after Supabase Auth
 *    signUp() — there is no INSERT policy for `authenticated` on either
 *    table (docs/DATABASE_DESIGN.md §4.1/§4.2 flags "who provisions
 *    accounts" as an unresolved OPEN QUESTION), so a newly-registered user
 *    has no RLS-permitted way to create their own profile row.
 *
 * `role` must always be hardcoded to `'mahasiswa'` by the caller when
 * inserting into `users` — this client itself grants no protection against
 * writing anything else, the calling code is what must never do otherwise.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required for registration."
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

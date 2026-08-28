-- Sigradu — close a column-level privilege gap on public.students.
--
-- students_update_own (20260827120300_rls_policies_yudisium.sql) scopes
-- UPDATE to the caller's own row via RLS, but — unlike public.users, which
-- got a matching column-level grant in that same migration — no grant was
-- ever restricted here. Supabase's default privileges give `authenticated`
-- UPDATE on every column of every public table unless explicitly revoked, so
-- a mahasiswa could currently update nim/faculty_id/study_program_id/
-- degree_level on their own students row via a direct REST call (never
-- exercised by any app code — the new Profil pages only ever update
-- public.users.full_name/phone_number, never public.students).
--
-- No column is re-granted: no student-editable field exists on this table
-- for the current feature set, so UPDATE is revoked outright. The RLS policy
-- itself is left in place (harmless without the grant) — only the privilege
-- is tightened.

revoke update on public.students from authenticated;

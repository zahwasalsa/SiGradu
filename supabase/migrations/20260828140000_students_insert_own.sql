-- Sigradu — enables the student profile-completion flow: an existing
-- mahasiswa account (public.users row already provisioned, e.g. created
-- directly in Supabase Auth before the self-register flow existed) can have
-- NO matching public.students row yet. Until now there was no RLS INSERT
-- policy on students at all (the original migration deliberately left this
-- open — "who manages account provisioning" — same open question as
-- users). This closes it for the one case the app now actually implements:
-- the student filling in their OWN academic identity once, via
-- completeStudentProfile() (src/lib/actions/profile.ts) — the same
-- self-reported NIM/faculty/study_program/degree_level pattern already used
-- by registerStudent() at signup time, just usable later too.
--
-- Scoped to the caller's own row only, and only once — a second insert
-- attempt fails on the existing unique user_id constraint, and UPDATE stays
-- fully revoked (20260828100000-era migration) so this is genuinely a
-- one-shot "complete it once" action, never an edit.

create policy "students_insert_own"
  on public.students for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.current_user_role() = 'mahasiswa'
  );

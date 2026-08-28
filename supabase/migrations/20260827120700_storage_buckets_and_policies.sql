-- Sigradu — Storage buckets (private) and storage.objects RLS policies.
-- See docs/STORAGE_DESIGN.md and docs/DATABASE_DESIGN.md §6 (README
-- "Storage bucket yang harus ada").

insert into storage.buckets (id, name, public)
values
  ('yudisium', 'yudisium', false),
  ('hiring', 'hiring', false),
  ('wisuda', 'wisuda', false)
on conflict (id) do nothing;

-- Path convention used by src/lib/storage.ts buildStoragePath():
--   <category>/<studentId>/<timestamp>-<filename>
-- so (storage.foldername(name))[1] = category (ktp/kk/ijazah/dokumen_lain,
-- bukti-kerja, pembayaran, foto, ...) and [2] = the student's `students.id`.
-- Policies below key off segment [2] only — they don't hardcode category
-- names, so a new category subfolder doesn't require a policy change.
-- storage.objects already has RLS enabled by default in Supabase; this
-- migration only adds policies, it does not touch that switch.

-- ============================================================
-- yudisium bucket
-- ============================================================
create policy "storage_yudisium_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'yudisium'
    and (storage.foldername(name))[2] = public.current_student_id()::text
  );

create policy "storage_yudisium_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'yudisium'
    and (storage.foldername(name))[2] = public.current_student_id()::text
  );

-- Mirrors the DB-table policies in 20260827120300_rls_policies_yudisium.sql:
-- admin_fakultas (verification) and kaprodi (read-only, needs to see
-- documents to assess kelayakan yudisium) can both open uploaded files.
create policy "storage_yudisium_admin_fakultas_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'yudisium'
    and public.current_user_role() = 'admin_fakultas'
  );

create policy "storage_yudisium_kaprodi_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'yudisium'
    and public.current_user_role() = 'kaprodi'
  );

-- ============================================================
-- hiring bucket
-- ============================================================
create policy "storage_hiring_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'hiring'
    and (storage.foldername(name))[2] = public.current_student_id()::text
  );

create policy "storage_hiring_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'hiring'
    and (storage.foldername(name))[2] = public.current_student_id()::text
  );

create policy "storage_hiring_admin_bkk_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'hiring'
    and public.current_user_role() = 'admin_bkk'
  );

-- ============================================================
-- wisuda bucket
-- ============================================================
create policy "storage_wisuda_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'wisuda'
    and (storage.foldername(name))[2] = public.current_student_id()::text
  );

create policy "storage_wisuda_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'wisuda'
    and (storage.foldername(name))[2] = public.current_student_id()::text
  );

create policy "storage_wisuda_admin_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'wisuda'
    and public.current_user_role() in ('admin_keuangan', 'admin_kemahasiswaan', 'admin_wisuda')
  );

-- No UPDATE/DELETE policy for anyone on any bucket: the app never replaces a
-- file in place (always uploads under a new timestamped path — see
-- src/lib/storage.ts uploadPrivateFile, upsert: false) and never deletes.
-- Note: superseded uploads (e.g. after "revision needed") are therefore
-- never cleaned up — an accepted storage-cost tradeoff, not a security gap.

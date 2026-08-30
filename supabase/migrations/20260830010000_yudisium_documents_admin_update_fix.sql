-- Sigradu — fix: admin_fakultas clicking "Setujui"/"Revisi" on a yudisium
-- document fails with "permission denied for table yudisium_documents".
--
-- Root cause: 20260827120300_rls_policies_yudisium.sql restricted UPDATE on
-- this table to columns (file_path, file_name, file_size_bytes) — intended
-- to stop a mahasiswa from setting their own document straight to
-- 'approved'. But column-level GRANT/REVOKE applies to the Postgres role
-- `authenticated` as a whole — every app role (mahasiswa, admin_fakultas,
-- kaprodi, ...) shares that single DB role in this architecture, only
-- distinguished via auth.uid()/RLS, never via separate DB roles. So the
-- column restriction silently blocked admin_fakultas from ever updating
-- `status`/`notes` too, not just mahasiswa — GRANT is checked before RLS,
-- so even though updateDocumentStatus() only touches status/notes and the
-- admin_fakultas RLS policy allows it at the row level, the column-level
-- GRANT rejected the request outright before RLS was ever evaluated.
--
-- Fix: restore full column UPDATE privilege (GRANT can't do role-aware
-- restriction here), and move the "mahasiswa can't self-approve" rule into
-- the mahasiswa-only RLS policy's WITH CHECK instead — mirroring the
-- status='pending' requirement already enforced on INSERT.

grant update on public.yudisium_documents to authenticated;

alter policy "yudisium_documents_update_own"
  on public.yudisium_documents
  with check (
    exists (
      select 1 from public.yudisium_applications ya
      where ya.id = application_id
        and ya.student_id = public.current_student_id()
    )
    and status = 'pending'
  );

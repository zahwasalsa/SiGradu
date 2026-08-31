-- Sigradu — two RLS gaps found during Campus Hiring click-testing.

-- 1) Laporan (admin/reports) is gated to MODULE_ROLES.reports = admin_fakultas,
--    admin_bkk, admin_keuangan, admin_kemahasiswaan, admin_wisuda (see
--    src/lib/rbac.ts) — but yudisium_applications_admin_select_all only ever
--    allowed kaprodi/admin_fakultas to SELECT. Every other reports-viewing
--    role saw all-zero counts and an empty table: not because there was no
--    data, but because RLS silently filtered every row out for them.
--    Widened to match the page's own role gate exactly — no new access
--    decision being made here, just closing the gap against a role list
--    that was already decided elsewhere in the app.
alter policy "yudisium_applications_admin_select_all"
  on public.yudisium_applications
  using (
    public.current_user_role() in (
      'kaprodi', 'admin_fakultas', 'admin_bkk', 'admin_keuangan',
      'admin_kemahasiswaan', 'admin_wisuda'
    )
  );

-- 2) job_applications had no UPDATE policy for admin_bkk at all (only
--    select_own/insert_own/update_own for the student, and
--    admin_bkk_select for admin — no admin_bkk_update). There was
--    consequently no way for anyone to ever move a lamaran off "Diproses"
--    into Interview/Diterima/Ditolak, at the database layer or the UI.
create policy "job_applications_admin_bkk_update"
  on public.job_applications for update
  to authenticated
  using (public.current_user_role() = 'admin_bkk')
  with check (public.current_user_role() = 'admin_bkk');

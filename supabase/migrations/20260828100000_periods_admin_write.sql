-- Sigradu — resolve the previously-open "who manages master data" question
-- for public.periods ONLY (docs/DATABASE_DESIGN.md §2.3/§9.2 flagged this
-- as unresolved; faculties/study_programs remain untouched and still have
-- no write policy for anyone — that question stays open).
--
-- Per explicit approval: admin_bkk manages periods of either type;
-- admin_fakultas manages 'yudisium' periods; admin_keuangan/
-- admin_kemahasiswaan/admin_wisuda manage 'wisuda' periods. No DELETE
-- policy — periods are referenced by applications/registrations via FK,
-- deactivating (is_active = false) is the supported way to retire one.

create policy "periods_admin_insert"
  on public.periods for insert
  to authenticated
  with check (
    public.current_user_role() = 'admin_bkk'
    or (public.current_user_role() = 'admin_fakultas' and type = 'yudisium')
    or (public.current_user_role() in ('admin_keuangan', 'admin_kemahasiswaan', 'admin_wisuda') and type = 'wisuda')
  );

create policy "periods_admin_update"
  on public.periods for update
  to authenticated
  using (
    public.current_user_role() = 'admin_bkk'
    or (public.current_user_role() = 'admin_fakultas' and type = 'yudisium')
    or (public.current_user_role() in ('admin_keuangan', 'admin_kemahasiswaan', 'admin_wisuda') and type = 'wisuda')
  )
  with check (
    public.current_user_role() = 'admin_bkk'
    or (public.current_user_role() = 'admin_fakultas' and type = 'yudisium')
    or (public.current_user_role() in ('admin_keuangan', 'admin_kemahasiswaan', 'admin_wisuda') and type = 'wisuda')
  );

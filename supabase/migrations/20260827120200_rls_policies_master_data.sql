-- Sigradu RLS — master/reference data: faculties, study_programs, periods,
-- hiring_thresholds, job_vacancies. See docs/DATABASE_DESIGN.md §2.

-- ============================================================
-- faculties / study_programs / periods
-- ============================================================
-- Read-only reference data for every authenticated user (students need it
-- for their own display; admins need it for filters). No INSERT/UPDATE/
-- DELETE policy is created for ANY role: docs/DATABASE_DESIGN.md §2.1/§2.3/
-- §9.2 explicitly flags "who manages master data" as an unresolved OPEN
-- QUESTION (no super_admin/master-data-owner role exists in this design).
-- Until that's decided, these three tables can only be changed via the
-- Supabase SQL editor or a follow-up migration — not through the app.
create policy "faculties_select_authenticated"
  on public.faculties for select
  to authenticated
  using (true);

create policy "study_programs_select_authenticated"
  on public.study_programs for select
  to authenticated
  using (true);

create policy "periods_select_authenticated"
  on public.periods for select
  to authenticated
  using (true);

-- ============================================================
-- hiring_thresholds — docs §2.4, explicit (not blocked by an open question)
-- ============================================================
create policy "hiring_thresholds_select_authenticated"
  on public.hiring_thresholds for select
  to authenticated
  using (true);

create policy "hiring_thresholds_admin_bkk_insert"
  on public.hiring_thresholds for insert
  to authenticated
  with check (public.current_user_role() = 'admin_bkk' and set_by = auth.uid());

create policy "hiring_thresholds_admin_bkk_update"
  on public.hiring_thresholds for update
  to authenticated
  using (public.current_user_role() = 'admin_bkk')
  with check (public.current_user_role() = 'admin_bkk');

create policy "hiring_thresholds_admin_bkk_delete"
  on public.hiring_thresholds for delete
  to authenticated
  using (public.current_user_role() = 'admin_bkk');

-- ============================================================
-- job_vacancies — docs §2.5, explicit (not blocked by an open question)
-- ============================================================
create policy "job_vacancies_select_authenticated"
  on public.job_vacancies for select
  to authenticated
  using (true);

create policy "job_vacancies_admin_bkk_insert"
  on public.job_vacancies for insert
  to authenticated
  with check (public.current_user_role() = 'admin_bkk' and posted_by = auth.uid());

create policy "job_vacancies_admin_bkk_update"
  on public.job_vacancies for update
  to authenticated
  using (public.current_user_role() = 'admin_bkk')
  with check (public.current_user_role() = 'admin_bkk');

create policy "job_vacancies_admin_bkk_delete"
  on public.job_vacancies for delete
  to authenticated
  using (public.current_user_role() = 'admin_bkk');

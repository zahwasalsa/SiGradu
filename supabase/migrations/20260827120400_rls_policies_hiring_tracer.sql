-- Sigradu RLS — Modul 2 (Campus Hiring & Tracer Study): employment_status,
-- job_applications, employment_proofs, tracer_studies, bypass_logs.
-- See docs/DATABASE_DESIGN.md §5.

-- ============================================================
-- employment_status
-- ============================================================
create policy "employment_status_select_own"
  on public.employment_status for select
  to authenticated
  using (student_id = public.current_student_id());

-- Audit addition: re-enforces CLAUDE.md #7 ("Module 2 is locked until
-- Yudisium is approved") at the RLS layer — src/lib/modules/gating.ts
-- already enforces this in the app, but that's bypassable by a request sent
-- directly to the Supabase REST API. See has_approved_yudisium() in
-- 20260827120000_rls_helpers.sql.
create policy "employment_status_insert_own"
  on public.employment_status for insert
  to authenticated
  with check (
    student_id = public.current_student_id()
    and public.has_approved_yudisium(period_id)
  );

create policy "employment_status_update_own"
  on public.employment_status for update
  to authenticated
  using (student_id = public.current_student_id())
  with check (student_id = public.current_student_id());

create policy "employment_status_admin_bkk_select"
  on public.employment_status for select
  to authenticated
  using (public.current_user_role() = 'admin_bkk');

-- ============================================================
-- job_applications
-- ============================================================
create policy "job_applications_select_own"
  on public.job_applications for select
  to authenticated
  using (
    exists (
      select 1 from public.employment_status es
      where es.id = employment_status_id
        and es.student_id = public.current_student_id()
    )
  );

create policy "job_applications_insert_own"
  on public.job_applications for insert
  to authenticated
  with check (
    exists (
      select 1 from public.employment_status es
      where es.id = employment_status_id
        and es.student_id = public.current_student_id()
    )
  );

create policy "job_applications_update_own"
  on public.job_applications for update
  to authenticated
  using (
    exists (
      select 1 from public.employment_status es
      where es.id = employment_status_id
        and es.student_id = public.current_student_id()
    )
  )
  with check (
    exists (
      select 1 from public.employment_status es
      where es.id = employment_status_id
        and es.student_id = public.current_student_id()
    )
  );

create policy "job_applications_admin_bkk_select"
  on public.job_applications for select
  to authenticated
  using (public.current_user_role() = 'admin_bkk');

-- ============================================================
-- employment_proofs
-- ============================================================
-- Mahasiswa: SELECT + INSERT only — verification is admin_bkk's job (docs
-- §5.3). No student UPDATE policy: matches
-- src/app/(student)/hiring/actions.ts (upload-only, never edits status).
create policy "employment_proofs_select_own"
  on public.employment_proofs for select
  to authenticated
  using (
    exists (
      select 1 from public.employment_status es
      where es.id = employment_status_id
        and es.student_id = public.current_student_id()
    )
  );

-- `status = 'pending'` required explicitly (audit fix) so a crafted INSERT
-- can't set its own proof straight to 'verified'.
create policy "employment_proofs_insert_own"
  on public.employment_proofs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.employment_status es
      where es.id = employment_status_id
        and es.student_id = public.current_student_id()
    )
    and status = 'pending'
  );

create policy "employment_proofs_admin_bkk_select"
  on public.employment_proofs for select
  to authenticated
  using (public.current_user_role() = 'admin_bkk');

create policy "employment_proofs_admin_bkk_update"
  on public.employment_proofs for update
  to authenticated
  using (public.current_user_role() = 'admin_bkk')
  with check (public.current_user_role() = 'admin_bkk');

-- ============================================================
-- tracer_studies
-- ============================================================
create policy "tracer_studies_select_own"
  on public.tracer_studies for select
  to authenticated
  using (student_id = public.current_student_id());

-- Audit addition: same CLAUDE.md #7 re-enforcement as employment_status
-- above — tracer_studies is also a Modul 2 table.
create policy "tracer_studies_insert_own"
  on public.tracer_studies for insert
  to authenticated
  with check (
    student_id = public.current_student_id()
    and status = 'draft'
    and public.has_approved_yudisium(period_id)
  );

-- Same pattern as yudisium_applications: editable only while draft/revision,
-- and the student can only ever move it to 'submitted' — 'approved' is
-- admin_bkk-only (that's the Modul 2 -> Modul 3 gate, CLAUDE.md #8).
create policy "tracer_studies_update_own"
  on public.tracer_studies for update
  to authenticated
  using (student_id = public.current_student_id() and status in ('draft', 'revision'))
  with check (student_id = public.current_student_id() and status in ('draft', 'submitted'));

create policy "tracer_studies_admin_bkk_select"
  on public.tracer_studies for select
  to authenticated
  using (public.current_user_role() = 'admin_bkk');

create policy "tracer_studies_admin_bkk_update"
  on public.tracer_studies for update
  to authenticated
  using (public.current_user_role() = 'admin_bkk')
  with check (public.current_user_role() = 'admin_bkk');

-- ============================================================
-- bypass_logs (append-only — no UPDATE/DELETE policy for anyone)
-- ============================================================
create policy "bypass_logs_select_own"
  on public.bypass_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.employment_status es
      where es.id = employment_status_id
        and es.student_id = public.current_student_id()
    )
  );

create policy "bypass_logs_admin_bkk_select"
  on public.bypass_logs for select
  to authenticated
  using (public.current_user_role() = 'admin_bkk');

create policy "bypass_logs_admin_bkk_insert"
  on public.bypass_logs for insert
  to authenticated
  with check (public.current_user_role() = 'admin_bkk' and bypassed_by = auth.uid());

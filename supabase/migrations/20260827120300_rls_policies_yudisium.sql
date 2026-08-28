-- Sigradu RLS — Modul 1 (Yudisium): users, students, yudisium_applications,
-- yudisium_documents, yudisium_reviews. See docs/DATABASE_DESIGN.md §4.

-- ============================================================
-- users
-- ============================================================
create policy "users_select_own"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

-- Any admin role may look up mahasiswa profiles — needed across every admin
-- module's list/detail pages to display student identity (docs §4.1: "admin
-- dapat SELECT semua baris user dengan role mahasiswa yang relevan dengan
-- modul verifikasinya"). Not scoped further per-module here because `users`
-- itself carries no module/fakultas info to scope by.
create policy "users_admin_select_mahasiswa"
  on public.users for select
  to authenticated
  using (
    public.current_user_role() <> 'mahasiswa'
    and role = 'mahasiswa'
  );

create policy "users_update_own"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Column-level grant restricts what "own row" UPDATE can actually touch:
-- `role` and `is_active` are excluded (role drives all authorization in this
-- app — self-changing it would be a privilege-escalation hole). `email` is
-- excluded too since it's meant to stay synced with auth.users (docs §4.1).
revoke update on public.users from authenticated;
grant update (full_name, phone_number) on public.users to authenticated;

-- No INSERT policy for authenticated/anon: profile rows are created during
-- account provisioning, which currently happens outside the app (no
-- self-signup page — see README). No documented role owns account
-- provisioning (OPEN QUESTION, docs §3.1/§9.2), so this stays service-role/
-- Supabase-dashboard-only for now.
--
-- No UPDATE policy grants role/is_active changes to ANY role, admin included:
-- "who manages accounts/roles" is the same unresolved OPEN QUESTION.

-- ============================================================
-- students
-- ============================================================
create policy "students_select_own"
  on public.students for select
  to authenticated
  using (user_id = auth.uid());

-- docs §4.2: "Semua role admin SELECT (butuh identitas mahasiswa untuk
-- verifikasi lintas modul)" — broad by design, not module-scoped.
create policy "students_admin_select_all"
  on public.students for select
  to authenticated
  using (public.current_user_role() <> 'mahasiswa');

create policy "students_update_own"
  on public.students for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No INSERT policy: same account-provisioning OPEN QUESTION as `users`.

-- ============================================================
-- yudisium_applications
-- ============================================================
create policy "yudisium_applications_select_own"
  on public.yudisium_applications for select
  to authenticated
  using (student_id = public.current_student_id());

create policy "yudisium_applications_insert_own"
  on public.yudisium_applications for insert
  to authenticated
  with check (student_id = public.current_student_id() and status = 'draft');

-- Mahasiswa may only edit while still theirs to edit (draft/revision), and
-- can only ever move it forward to 'submitted' themselves — every other
-- transition (under_review/approved/rejected) is admin-only below. Mirrors
-- the state machine in src/app/(student)/yudisium/actions.ts.
create policy "yudisium_applications_update_own"
  on public.yudisium_applications for update
  to authenticated
  using (student_id = public.current_student_id() and status in ('draft', 'revision'))
  with check (student_id = public.current_student_id() and status in ('draft', 'revision', 'submitted'));

-- ⚠️ OPEN QUESTION (docs/DATABASE_DESIGN.md §9.2, points 1–2): there is no
-- kaprodi<->study_program or admin_fakultas<->faculty mapping table, so this
-- cannot be scoped to "only their own prodi/fakultas" as the business flow
-- implies. This is module-scoped instead (any kaprodi/admin_fakultas vs. ALL
-- yudisium data), matching the documented interim fallback in §9.2 — not a
-- new decision made here. Flagged for your explicit sign-off — see chat.
create policy "yudisium_applications_admin_select_all"
  on public.yudisium_applications for select
  to authenticated
  using (public.current_user_role() in ('kaprodi', 'admin_fakultas'));

create policy "yudisium_applications_admin_fakultas_update"
  on public.yudisium_applications for update
  to authenticated
  using (public.current_user_role() = 'admin_fakultas')
  with check (public.current_user_role() = 'admin_fakultas');

-- ============================================================
-- yudisium_documents
-- ============================================================
create policy "yudisium_documents_select_own"
  on public.yudisium_documents for select
  to authenticated
  using (
    exists (
      select 1 from public.yudisium_applications ya
      where ya.id = application_id
        and ya.student_id = public.current_student_id()
    )
  );

-- `status = 'pending'` is required explicitly here (not left to the column
-- default) so a crafted INSERT can't set its own document straight to
-- 'approved' — audit fix, same class of gap as employment_proofs below.
create policy "yudisium_documents_insert_own"
  on public.yudisium_documents for insert
  to authenticated
  with check (
    exists (
      select 1 from public.yudisium_applications ya
      where ya.id = application_id
        and ya.student_id = public.current_student_id()
        and ya.status in ('draft', 'revision')
    )
    and status = 'pending'
  );

-- Mahasiswa may re-upload (this UPDATEs the row when a document of that type
-- already exists — see uploadYudisiumDocument in
-- src/app/(student)/yudisium/actions.ts) while the application is still
-- editable. The column grant below blocks them from setting their own
-- `status` to 'approved'.
create policy "yudisium_documents_update_own"
  on public.yudisium_documents for update
  to authenticated
  using (
    exists (
      select 1 from public.yudisium_applications ya
      where ya.id = application_id
        and ya.student_id = public.current_student_id()
        and ya.status in ('draft', 'revision')
    )
  )
  with check (
    exists (
      select 1 from public.yudisium_applications ya
      where ya.id = application_id
        and ya.student_id = public.current_student_id()
    )
  );

revoke update on public.yudisium_documents from authenticated;
grant update (file_path, file_name, file_size_bytes) on public.yudisium_documents to authenticated;

-- admin_fakultas verifies documents (SELECT + UPDATE, docs §4.4). Kaprodi
-- gets read-only SELECT too — approved by the project owner on top of the
-- literal doc, because Kaprodi needs to see the uploaded documents to assess
-- "kelayakan yudisium" (PDF §2a). Kaprodi does NOT get UPDATE: verifying
-- document completeness stays admin_fakultas-only, matching
-- ROLES_PERMISSIONS.md ("Kaprodi: melihat pengajuan... memberikan keputusan
-- kelayakan" — viewing, not administrative verification).
create policy "yudisium_documents_admin_fakultas_select"
  on public.yudisium_documents for select
  to authenticated
  using (public.current_user_role() = 'admin_fakultas');

create policy "yudisium_documents_kaprodi_select"
  on public.yudisium_documents for select
  to authenticated
  using (public.current_user_role() = 'kaprodi');

create policy "yudisium_documents_admin_fakultas_update"
  on public.yudisium_documents for update
  to authenticated
  using (public.current_user_role() = 'admin_fakultas')
  with check (public.current_user_role() = 'admin_fakultas');

-- ============================================================
-- yudisium_reviews (append-only — no UPDATE/DELETE policy for anyone)
-- ============================================================
create policy "yudisium_reviews_select_own"
  on public.yudisium_reviews for select
  to authenticated
  using (
    exists (
      select 1 from public.yudisium_applications ya
      where ya.id = application_id
        and ya.student_id = public.current_student_id()
    )
  );

create policy "yudisium_reviews_admin_select_all"
  on public.yudisium_reviews for select
  to authenticated
  using (public.current_user_role() in ('kaprodi', 'admin_fakultas'));

-- Kaprodi may only insert their OWN kaprodi-role decision; reviewer_id and
-- input_by must both be the caller (matches recordKaprodiDecision in
-- src/app/admin/yudisium/actions.ts — no "staff enters on behalf of kaprodi"
-- path is actually implemented in this codebase, so RLS doesn't allow it).
create policy "yudisium_reviews_kaprodi_insert"
  on public.yudisium_reviews for insert
  to authenticated
  with check (
    public.current_user_role() = 'kaprodi'
    and reviewer_role = 'kaprodi'
    and reviewer_id = auth.uid()
    and input_by = auth.uid()
  );

create policy "yudisium_reviews_admin_fakultas_insert"
  on public.yudisium_reviews for insert
  to authenticated
  with check (
    public.current_user_role() = 'admin_fakultas'
    and reviewer_role = 'admin_fakultas'
    and reviewer_id = auth.uid()
    and input_by = auth.uid()
  );

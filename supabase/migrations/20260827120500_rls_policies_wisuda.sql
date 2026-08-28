-- Sigradu RLS — Modul 3 (Wisuda): graduation_registrations,
-- graduation_payments, graduation_book_data. See docs/DATABASE_DESIGN.md §6.

-- ============================================================
-- graduation_registrations
-- ============================================================
create policy "graduation_registrations_select_own"
  on public.graduation_registrations for select
  to authenticated
  using (student_id = public.current_student_id());

-- Audit addition: re-enforces CLAUDE.md #8 ("Module 3 is locked until
-- Tracer & Hiring is approved") at the RLS layer — same reasoning as the
-- Modul 2 gate in 20260827120400 (app-layer check in
-- src/lib/modules/gating.ts is bypassable by a direct REST API request).
create policy "graduation_registrations_insert_own"
  on public.graduation_registrations for insert
  to authenticated
  with check (
    student_id = public.current_student_id()
    and status = 'menunggu_pembayaran'
    and public.has_approved_tracer()
  );

-- Student-initiated transitions only: setting attendance (-> menunggu_pembayaran)
-- and uploading payment (-> menunggu_verifikasi_pembayaran) — matches
-- src/app/(student)/wisuda/actions.ts. Every other status
-- (pembayaran_ditolak, pembayaran_terverifikasi, menunggu_data_buku,
-- revisi_data_buku, data_buku_lengkap, terdaftar_sebagai_wisudawan,
-- wisuda_in_absentia) is admin-only, enforced below — a student can never
-- set any of those themselves, even on their own row.
create policy "graduation_registrations_update_own"
  on public.graduation_registrations for update
  to authenticated
  using (
    student_id = public.current_student_id()
    and status in ('menunggu_kesediaan', 'menunggu_pembayaran', 'pembayaran_ditolak')
  )
  with check (
    student_id = public.current_student_id()
    and status in ('menunggu_pembayaran', 'menunggu_verifikasi_pembayaran')
  );

-- docs §6.1: "admin_keuangan, admin_kemahasiswaan SELECT semua" for context;
-- admin_wisuda gets SELECT + UPDATE (final verification).
create policy "graduation_registrations_admin_select_all"
  on public.graduation_registrations for select
  to authenticated
  using (public.current_user_role() in ('admin_keuangan', 'admin_kemahasiswaan', 'admin_wisuda'));

-- admin_keuangan moves status when verifying/rejecting payment
-- (-> pembayaran_ditolak | pembayaran_terverifikasi | menunggu_data_buku),
-- per src/app/admin/wisuda/actions.ts verifyPayment.
create policy "graduation_registrations_admin_keuangan_update"
  on public.graduation_registrations for update
  to authenticated
  using (public.current_user_role() = 'admin_keuangan')
  with check (public.current_user_role() = 'admin_keuangan');

-- admin_kemahasiswaan moves status when verifying book data
-- (-> data_buku_lengkap | revisi_data_buku), per verifyBookData.
create policy "graduation_registrations_admin_kemahasiswaan_update"
  on public.graduation_registrations for update
  to authenticated
  using (public.current_user_role() = 'admin_kemahasiswaan')
  with check (public.current_user_role() = 'admin_kemahasiswaan');

-- admin_wisuda sets the final status
-- (-> terdaftar_sebagai_wisudawan | wisuda_in_absentia).
create policy "graduation_registrations_admin_wisuda_update"
  on public.graduation_registrations for update
  to authenticated
  using (public.current_user_role() = 'admin_wisuda')
  with check (public.current_user_role() = 'admin_wisuda');

-- ============================================================
-- graduation_payments
-- ============================================================
-- Append-only per attempt (docs §6.2: multiple rows per registration, one
-- per upload; rejected attempts stay for audit). Mahasiswa SELECT/INSERT
-- only, no UPDATE — matches src/app/(student)/wisuda/actions.ts (always
-- INSERTs a new row, never edits an existing one).
create policy "graduation_payments_select_own"
  on public.graduation_payments for select
  to authenticated
  using (
    exists (
      select 1 from public.graduation_registrations gr
      where gr.id = registration_id
        and gr.student_id = public.current_student_id()
    )
  );

-- Audit note: src/app/(student)/wisuda/actions.ts uploadPayment does not
-- itself re-check registration.status server-side (matches the same gap as
-- graduation_book_data above) — restrict to the two states the page UI
-- actually allows upload from (menunggu_pembayaran / pembayaran_ditolak).
create policy "graduation_payments_insert_own"
  on public.graduation_payments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.graduation_registrations gr
      where gr.id = registration_id
        and gr.student_id = public.current_student_id()
        and gr.status in ('menunggu_pembayaran', 'pembayaran_ditolak')
    )
    and status = 'pending'
  );

create policy "graduation_payments_admin_keuangan_select"
  on public.graduation_payments for select
  to authenticated
  using (public.current_user_role() = 'admin_keuangan');

create policy "graduation_payments_admin_keuangan_update"
  on public.graduation_payments for update
  to authenticated
  using (public.current_user_role() = 'admin_keuangan')
  with check (public.current_user_role() = 'admin_keuangan');

-- ============================================================
-- graduation_book_data
-- ============================================================
create policy "graduation_book_data_select_own"
  on public.graduation_book_data for select
  to authenticated
  using (
    exists (
      select 1 from public.graduation_registrations gr
      where gr.id = registration_id
        and gr.student_id = public.current_student_id()
    )
  );

-- Audit note: src/app/(student)/wisuda/actions.ts uploadBookData does not
-- itself re-check registration.status server-side (only the page UI hides
-- the form outside the right window) — this policy is the actual enforcement
-- that the first upload can only happen once payment is verified and the
-- registration is genuinely waiting on book data.
create policy "graduation_book_data_insert_own"
  on public.graduation_book_data for insert
  to authenticated
  with check (
    exists (
      select 1 from public.graduation_registrations gr
      where gr.id = registration_id
        and gr.student_id = public.current_student_id()
        and gr.attendance_choice = 'hadir'
        and gr.status in ('menunggu_data_buku', 'revisi_data_buku')
    )
    and status = 'pending'
  );

-- Mahasiswa may re-upload only while the registration is actually waiting on
-- book data (menunggu_data_buku/revisi_data_buku) — audit tightening: without
-- this, a student could re-edit (and flip status back to 'pending') even
-- after admin_kemahasiswaan already marked the registration
-- 'data_buku_lengkap'. They can never mark their own submission 'complete'
-- either way — that's admin_kemahasiswaan's call only.
create policy "graduation_book_data_update_own"
  on public.graduation_book_data for update
  to authenticated
  using (
    exists (
      select 1 from public.graduation_registrations gr
      where gr.id = registration_id
        and gr.student_id = public.current_student_id()
        and gr.status in ('menunggu_data_buku', 'revisi_data_buku')
    )
  )
  with check (
    exists (
      select 1 from public.graduation_registrations gr
      where gr.id = registration_id
        and gr.student_id = public.current_student_id()
    )
    and status = 'pending'
  );

create policy "graduation_book_data_admin_select"
  on public.graduation_book_data for select
  to authenticated
  using (public.current_user_role() in ('admin_kemahasiswaan', 'admin_wisuda'));

create policy "graduation_book_data_admin_kemahasiswaan_update"
  on public.graduation_book_data for update
  to authenticated
  using (public.current_user_role() = 'admin_kemahasiswaan')
  with check (public.current_user_role() = 'admin_kemahasiswaan');

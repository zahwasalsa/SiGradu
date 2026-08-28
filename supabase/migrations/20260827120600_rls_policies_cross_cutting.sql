-- Sigradu RLS — cross-cutting tables: status_histories, notifications.
-- See docs/DATABASE_DESIGN.md §7.

-- ============================================================
-- status_histories (append-only — no UPDATE/DELETE policy for anyone)
-- ============================================================
-- ⚠️ DEVIATION FROM docs/DATABASE_DESIGN.md §7.1 — flagged for your approval.
--
-- The doc's literal design says INSERT should be "service-role/trigger
-- server-side" only. This codebase has NO service-role client anywhere
-- (verified: no file references SUPABASE_SERVICE_ROLE_KEY) — every
-- status-history write (src/lib/status-history.ts recordStatusChange,
-- called from every module's Server Actions) runs as the AUTHENTICATED
-- user's own session. A literal service-role-only policy would silently
-- break CLAUDE.md rule #10's audit trail for every status change in the
-- app — and the failure would be invisible, because recordStatusChange only
-- console.errors instead of throwing (src/lib/status-history.ts, the
-- catch block around the insert).
--
-- This policy instead allows authenticated INSERT, scoped tightly so it
-- can't be abused to forge history (tightened further per project-owner
-- review — "admin hanya boleh membuat histori sesuai kewenangan role"):
--   - `changed_by` must be the caller themselves (no impersonating another
--     user as the actor);
--   - mahasiswa may only log history for their OWN `student_id`;
--   - each admin role may only log history for the `module` it actually
--     owns, mirroring src/lib/rbac.ts MODULE_ROLES exactly:
--       kaprodi, admin_fakultas        -> module = 'yudisium'
--       admin_bkk                      -> module = 'hiring_tracer'
--       admin_keuangan, admin_kemahasiswaan, admin_wisuda -> module = 'wisuda'
-- No UPDATE/DELETE policy exists for anyone — append-only, matches docs §7.1
-- and satisfies "tidak boleh UPDATE atau DELETE histori".
create policy "status_histories_select_own"
  on public.status_histories for select
  to authenticated
  using (student_id = public.current_student_id());

create policy "status_histories_admin_select_all"
  on public.status_histories for select
  to authenticated
  using (public.current_user_role() <> 'mahasiswa');

create policy "status_histories_insert_scoped"
  on public.status_histories for insert
  to authenticated
  with check (
    changed_by = auth.uid()
    and (
      (public.current_user_role() = 'mahasiswa' and student_id = public.current_student_id())
      or (public.current_user_role() in ('kaprodi', 'admin_fakultas') and module = 'yudisium')
      or (public.current_user_role() = 'admin_bkk' and module = 'hiring_tracer')
      or (public.current_user_role() in ('admin_keuangan', 'admin_kemahasiswaan', 'admin_wisuda') and module = 'wisuda')
    )
  );

-- ============================================================
-- notifications
-- ============================================================
-- Matches docs/DATABASE_DESIGN.md §7.2 literally — no deviation needed here:
-- nothing in the app currently writes to this table (no `.from("notifications")`
-- insert exists anywhere in src/), so INSERT stays service-role-only until
-- the notification feature is actually built (OPEN QUESTION #11: provider/
-- channel not decided).
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own_is_read"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Column grant: recipients may only toggle is_read, not rewrite the message.
revoke update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;

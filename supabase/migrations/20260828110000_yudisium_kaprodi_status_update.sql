-- Sigradu — fix: recordKaprodiDecision() (src/app/admin/yudisium/actions.ts)
-- transitions yudisium_applications.status from 'submitted' to 'under_review'
-- right after inserting the kaprodi's review row. No UPDATE policy exists for
-- kaprodi on yudisium_applications (only admin_fakultas and the owning
-- student have one), so that update silently affects 0 rows under RLS —
-- status stays stuck on 'submitted' forever even though the review itself
-- saved successfully.
--
-- Scoped to exactly the one transition the code performs — kaprodi still
-- cannot set any other status, matching the narrow, state-machine-scoped
-- policy style already used throughout this file.

create policy "yudisium_applications_kaprodi_update"
  on public.yudisium_applications for update
  to authenticated
  using (public.current_user_role() = 'kaprodi' and status = 'submitted')
  with check (public.current_user_role() = 'kaprodi' and status = 'under_review');

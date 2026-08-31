-- Sigradu — revert 20260830020000's job_applications_admin_bkk_update policy.
--
-- Wrong direction: admin_bkk has no way to actually know whether a specific
-- company interviewed/hired a student — that information only exists on the
-- student's side (they're the one dealing with the employer directly).
-- job_applications_update_own (the ORIGINAL migration, unchanged) already
-- lets the student update their own application_status — that's the correct
-- self-report flow. Admin BKK keeps SELECT (job_applications_admin_bkk_select,
-- for monitoring/threshold purposes) but not UPDATE.

drop policy if exists "job_applications_admin_bkk_update" on public.job_applications;

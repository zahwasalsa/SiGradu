-- Sigradu — manual rollback for the 8 migrations dated 20260827120000–
-- 20260827120700 (RLS + storage policies).
--
-- ⚠️ This file is intentionally OUTSIDE supabase/migrations/ so the Supabase
-- CLI never applies it automatically. Run it manually (Supabase SQL editor,
-- or `psql`) ONLY if you need to fully undo this change set.
--
-- Effect: returns the 20 tables to their pre-migration state (RLS off, no
-- policies, original column grants). It does NOT delete any application
-- data or the 3 storage buckets — dropping buckets that may already contain
-- uploaded files is left as a separate, deliberate decision (see the
-- commented-out block at the bottom).
--
-- Safe to run multiple times (every statement uses IF EXISTS). The 83 DROP
-- POLICY statements below were generated directly from the exact policy
-- names created by the 8 migration files, not retyped by hand.

-- ============================================================
-- 1. Drop every policy created by the 8 migrations (explicit, not pattern-matched)
-- ============================================================
drop policy if exists "faculties_select_authenticated" on public.faculties;
drop policy if exists "study_programs_select_authenticated" on public.study_programs;
drop policy if exists "periods_select_authenticated" on public.periods;
drop policy if exists "hiring_thresholds_select_authenticated" on public.hiring_thresholds;
drop policy if exists "hiring_thresholds_admin_bkk_insert" on public.hiring_thresholds;
drop policy if exists "hiring_thresholds_admin_bkk_update" on public.hiring_thresholds;
drop policy if exists "hiring_thresholds_admin_bkk_delete" on public.hiring_thresholds;
drop policy if exists "job_vacancies_select_authenticated" on public.job_vacancies;
drop policy if exists "job_vacancies_admin_bkk_insert" on public.job_vacancies;
drop policy if exists "job_vacancies_admin_bkk_update" on public.job_vacancies;
drop policy if exists "job_vacancies_admin_bkk_delete" on public.job_vacancies;
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_admin_select_mahasiswa" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "students_select_own" on public.students;
drop policy if exists "students_admin_select_all" on public.students;
drop policy if exists "students_update_own" on public.students;
drop policy if exists "yudisium_applications_select_own" on public.yudisium_applications;
drop policy if exists "yudisium_applications_insert_own" on public.yudisium_applications;
drop policy if exists "yudisium_applications_update_own" on public.yudisium_applications;
drop policy if exists "yudisium_applications_admin_select_all" on public.yudisium_applications;
drop policy if exists "yudisium_applications_admin_fakultas_update" on public.yudisium_applications;
drop policy if exists "yudisium_documents_select_own" on public.yudisium_documents;
drop policy if exists "yudisium_documents_insert_own" on public.yudisium_documents;
drop policy if exists "yudisium_documents_update_own" on public.yudisium_documents;
drop policy if exists "yudisium_documents_admin_fakultas_select" on public.yudisium_documents;
drop policy if exists "yudisium_documents_kaprodi_select" on public.yudisium_documents;
drop policy if exists "yudisium_documents_admin_fakultas_update" on public.yudisium_documents;
drop policy if exists "yudisium_reviews_select_own" on public.yudisium_reviews;
drop policy if exists "yudisium_reviews_admin_select_all" on public.yudisium_reviews;
drop policy if exists "yudisium_reviews_kaprodi_insert" on public.yudisium_reviews;
drop policy if exists "yudisium_reviews_admin_fakultas_insert" on public.yudisium_reviews;
drop policy if exists "employment_status_select_own" on public.employment_status;
drop policy if exists "employment_status_insert_own" on public.employment_status;
drop policy if exists "employment_status_update_own" on public.employment_status;
drop policy if exists "employment_status_admin_bkk_select" on public.employment_status;
drop policy if exists "job_applications_select_own" on public.job_applications;
drop policy if exists "job_applications_insert_own" on public.job_applications;
drop policy if exists "job_applications_update_own" on public.job_applications;
drop policy if exists "job_applications_admin_bkk_select" on public.job_applications;
drop policy if exists "employment_proofs_select_own" on public.employment_proofs;
drop policy if exists "employment_proofs_insert_own" on public.employment_proofs;
drop policy if exists "employment_proofs_admin_bkk_select" on public.employment_proofs;
drop policy if exists "employment_proofs_admin_bkk_update" on public.employment_proofs;
drop policy if exists "tracer_studies_select_own" on public.tracer_studies;
drop policy if exists "tracer_studies_insert_own" on public.tracer_studies;
drop policy if exists "tracer_studies_update_own" on public.tracer_studies;
drop policy if exists "tracer_studies_admin_bkk_select" on public.tracer_studies;
drop policy if exists "tracer_studies_admin_bkk_update" on public.tracer_studies;
drop policy if exists "bypass_logs_select_own" on public.bypass_logs;
drop policy if exists "bypass_logs_admin_bkk_select" on public.bypass_logs;
drop policy if exists "bypass_logs_admin_bkk_insert" on public.bypass_logs;
drop policy if exists "graduation_registrations_select_own" on public.graduation_registrations;
drop policy if exists "graduation_registrations_insert_own" on public.graduation_registrations;
drop policy if exists "graduation_registrations_update_own" on public.graduation_registrations;
drop policy if exists "graduation_registrations_admin_select_all" on public.graduation_registrations;
drop policy if exists "graduation_registrations_admin_keuangan_update" on public.graduation_registrations;
drop policy if exists "graduation_registrations_admin_kemahasiswaan_update" on public.graduation_registrations;
drop policy if exists "graduation_registrations_admin_wisuda_update" on public.graduation_registrations;
drop policy if exists "graduation_payments_select_own" on public.graduation_payments;
drop policy if exists "graduation_payments_insert_own" on public.graduation_payments;
drop policy if exists "graduation_payments_admin_keuangan_select" on public.graduation_payments;
drop policy if exists "graduation_payments_admin_keuangan_update" on public.graduation_payments;
drop policy if exists "graduation_book_data_select_own" on public.graduation_book_data;
drop policy if exists "graduation_book_data_insert_own" on public.graduation_book_data;
drop policy if exists "graduation_book_data_update_own" on public.graduation_book_data;
drop policy if exists "graduation_book_data_admin_select" on public.graduation_book_data;
drop policy if exists "graduation_book_data_admin_kemahasiswaan_update" on public.graduation_book_data;
drop policy if exists "status_histories_select_own" on public.status_histories;
drop policy if exists "status_histories_admin_select_all" on public.status_histories;
drop policy if exists "status_histories_insert_scoped" on public.status_histories;
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own_is_read" on public.notifications;
drop policy if exists "storage_yudisium_select_own" on storage.objects;
drop policy if exists "storage_yudisium_insert_own" on storage.objects;
drop policy if exists "storage_yudisium_admin_fakultas_select" on storage.objects;
drop policy if exists "storage_yudisium_kaprodi_select" on storage.objects;
drop policy if exists "storage_hiring_select_own" on storage.objects;
drop policy if exists "storage_hiring_insert_own" on storage.objects;
drop policy if exists "storage_hiring_admin_bkk_select" on storage.objects;
drop policy if exists "storage_wisuda_select_own" on storage.objects;
drop policy if exists "storage_wisuda_insert_own" on storage.objects;
drop policy if exists "storage_wisuda_admin_select" on storage.objects;

-- ============================================================
-- 2. Restore original column-level grants (undo the REVOKE/GRANT narrowing)
-- ============================================================
grant update on public.users to authenticated;
grant update on public.yudisium_documents to authenticated;
grant update on public.notifications to authenticated;

-- ============================================================
-- 3. Disable RLS on all 20 tables
-- ============================================================
alter table public.faculties disable row level security;
alter table public.study_programs disable row level security;
alter table public.periods disable row level security;
alter table public.hiring_thresholds disable row level security;
alter table public.job_vacancies disable row level security;
alter table public.users disable row level security;
alter table public.students disable row level security;
alter table public.yudisium_applications disable row level security;
alter table public.yudisium_documents disable row level security;
alter table public.yudisium_reviews disable row level security;
alter table public.employment_status disable row level security;
alter table public.job_applications disable row level security;
alter table public.employment_proofs disable row level security;
alter table public.tracer_studies disable row level security;
alter table public.bypass_logs disable row level security;
alter table public.graduation_registrations disable row level security;
alter table public.graduation_payments disable row level security;
alter table public.graduation_book_data disable row level security;
alter table public.status_histories disable row level security;
alter table public.notifications disable row level security;

-- ============================================================
-- 4. Drop helper functions
-- ============================================================
drop function if exists public.has_approved_tracer();
drop function if exists public.has_approved_yudisium(uuid);
drop function if exists public.current_student_id();
drop function if exists public.current_user_role();

-- ============================================================
-- 5. Storage buckets — NOT dropped automatically.
-- ============================================================
-- Uncomment only if you're certain no files were uploaded yet (dropping a
-- non-empty bucket via SQL fails unless objects are removed first, which
-- would be a real, irreversible data-deleting action — do that deliberately,
-- not as a reflex part of a "rollback"):
--
-- delete from storage.buckets where id in ('yudisium', 'hiring', 'wisuda');

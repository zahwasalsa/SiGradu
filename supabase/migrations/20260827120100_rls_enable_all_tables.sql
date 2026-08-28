-- Sigradu — enable Row Level Security on all 20 existing tables.
-- No table structure is changed here — this only flips the RLS switch.
-- Until the policy migrations that follow are also applied, every one of
-- these tables becomes fully inaccessible to `anon`/`authenticated` (default
-- deny), which is the safe intermediate state.

alter table public.faculties enable row level security;
alter table public.study_programs enable row level security;
alter table public.periods enable row level security;
alter table public.hiring_thresholds enable row level security;
alter table public.job_vacancies enable row level security;
alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.yudisium_applications enable row level security;
alter table public.yudisium_documents enable row level security;
alter table public.yudisium_reviews enable row level security;
alter table public.employment_status enable row level security;
alter table public.job_applications enable row level security;
alter table public.employment_proofs enable row level security;
alter table public.tracer_studies enable row level security;
alter table public.bypass_logs enable row level security;
alter table public.graduation_registrations enable row level security;
alter table public.graduation_payments enable row level security;
alter table public.graduation_book_data enable row level security;
alter table public.status_histories enable row level security;
alter table public.notifications enable row level security;

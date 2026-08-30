-- Sigradu — fix: createPeriod() failed on every attempt with Postgres error
-- 54001 "stack depth limit exceeded". Root cause: current_user_role() is
-- SECURITY INVOKER and queries public.users, but public.users' own RLS
-- policy users_admin_select_mahasiswa calls current_user_role() again to
-- evaluate itself — self-referential recursion. The original migration
-- assumed Postgres would short-circuit via the self-row policy
-- (users_select_own) before ever needing the admin policy, but that isn't
-- guaranteed by the planner; periods_admin_insert calling
-- current_user_role() three times in one WITH CHECK was enough to blow the
-- stack in practice.
--
-- Standard Supabase-recommended fix: mark these two RLS helper functions
-- SECURITY DEFINER so their internal lookup bypasses RLS on
-- users/students entirely, instead of re-triggering it. This is safe here
-- specifically because both functions are hard-scoped to auth.uid() — they
-- can only ever return the CALLING user's own role/student id, never
-- anyone else's, so there is no privilege-escalation or data-exposure
-- surface from bypassing RLS inside them.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.users where id = auth.uid();
$$;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.students where user_id = auth.uid();
$$;

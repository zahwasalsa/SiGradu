-- Sigradu — RLS helper functions
--
-- Used by every policy file that follows. Both functions are STABLE and
-- SECURITY INVOKER (default — NOT SECURITY DEFINER): they run with the
-- calling user's own privileges and are themselves subject to RLS on
-- `users`/`students`. This is intentional and safe (no privilege escalation
-- path): every role gets a self-row SELECT policy on `users` in the next
-- migration, so `current_user_role()` can always resolve for the caller —
-- including when called recursively from within `users`' own policies. That
-- recursion terminates safely because the inner subquery's `WHERE id =
-- auth.uid()` is satisfied by the self-row policy alone, without needing to
-- re-evaluate the outer (admin) policy. This is the standard, documented
-- Supabase/Postgres RLS pattern for role lookups.

-- DROP first: CREATE OR REPLACE cannot change an existing function's return
-- type, and this file needs to be safely re-runnable from any partial state
-- (manual copy-paste workflow) without erroring on a leftover signature from
-- an earlier attempt.
drop function if exists public.current_user_role();
drop function if exists public.current_student_id();

create or replace function public.current_user_role()
returns text
language sql
stable
set search_path = public
as $$
  select role::text from public.users where id = auth.uid();
$$;

create or replace function public.current_student_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select id from public.students where user_id = auth.uid();
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_student_id() to authenticated;

-- ------------------------------------------------------------------
-- Sequential-gate helpers (CLAUDE.md rules #7/#8: "Module 2 is locked until
-- Yudisium is approved" / "Module 3 is locked until Tracer & Hiring is
-- approved"). These are enforced in the app layer already (see
-- src/lib/modules/gating.ts), but that's not enough on its own: a request
-- sent straight to the Supabase REST API (bypassing the Next.js Server
-- Action entirely) would skip every app-layer check. These two functions
-- let the INSERT policies on Modul 2/3 tables re-check the same two CLAUDE.md
-- rules at the one layer a direct-API request can't bypass — audit addition,
-- not a new business rule (the rule already exists; this is where it's
-- actually enforced).
--
-- Deliberately self-contained (inline the `students` lookup instead of
-- calling current_student_id()): running this file manually one statement
-- block at a time is exactly the workflow it needs to survive, so it
-- shouldn't depend on execution order within the same script.
-- ------------------------------------------------------------------

drop function if exists public.has_approved_yudisium(uuid);
drop function if exists public.has_approved_tracer();

create or replace function public.has_approved_yudisium(check_period_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.yudisium_applications ya
    where ya.student_id = (select id from public.students where user_id = auth.uid())
      and ya.period_id = check_period_id
      and ya.status = 'approved'
  );
$$;

create or replace function public.has_approved_tracer()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.tracer_studies ts
    where ts.student_id = (select id from public.students where user_id = auth.uid())
      and ts.status = 'approved'
  );
$$;

grant execute on function public.has_approved_yudisium(uuid) to authenticated;
grant execute on function public.has_approved_tracer() to authenticated;

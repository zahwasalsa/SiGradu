-- Sigradu — fix: submitTracerStudy() (src/app/(student)/tracer/actions.ts)
-- creates the FIRST tracer_studies row with status='submitted' directly —
-- there is no separate "save as draft" step in this feature's UI/action
-- design (unlike yudisium_applications, which deliberately splits create-
-- draft and submit into two actions). The original INSERT policy required
-- status = 'draft', so every first-time Tracer Study submission was
-- rejected outright by RLS ("new row violates row-level security policy"),
-- always, with no workaround client-side.
--
-- Widened to match the code's actual one-step design: insert may create
-- either 'draft' (kept for forward-compatibility, unused today) or
-- 'submitted'. Everything else about the policy (ownership, Modul 2 gate
-- via has_approved_yudisium) is unchanged.

alter policy "tracer_studies_insert_own"
  on public.tracer_studies
  with check (
    student_id = public.current_student_id()
    and status in ('draft', 'submitted')
    and public.has_approved_yudisium(period_id)
  );

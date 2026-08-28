import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PeriodType } from "@/types/domain";

/**
 * The currently active period for a given type. Multiple periods can exist
 * historically; the active one is the one open for new submissions.
 *
 * OPEN QUESTION (docs/DATABASE_DESIGN.md §2.3): whether Hiring/Tracer runs on
 * its own period cycle or always shares the student's yudisium period is not
 * settled. This helper is used for both "yudisium" and "wisuda" period types;
 * Hiring/Tracer records reuse the student's yudisium `period_id` directly
 * (see lib/modules/gating.ts) rather than looking up a separate active period.
 */
export async function getActivePeriod(supabase: SupabaseClient<Database>, type: PeriodType) {
  const { data } = await supabase
    .from("periods")
    .select("*")
    .eq("type", type)
    .eq("is_active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

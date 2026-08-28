import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Module = "yudisium" | "hiring_tracer" | "wisuda";

/**
 * Records a status change in `status_histories`, per CLAUDE.md rule #10
 * ("Every important status change must create a status history record").
 * Call this from server actions right after updating a status column.
 */
export async function recordStatusChange(
  supabase: SupabaseClient<Database>,
  params: {
    studentId: string;
    module: Module;
    sourceTable: string;
    sourceId: string;
    oldStatus: string | null;
    newStatus: string;
    changedBy: string | null;
    reason?: string | null;
  }
) {
  const { error } = await supabase.from("status_histories").insert({
    student_id: params.studentId,
    module: params.module,
    source_table: params.sourceTable,
    source_id: params.sourceId,
    old_status: params.oldStatus,
    new_status: params.newStatus,
    changed_by: params.changedBy,
    reason: params.reason ?? null,
  });

  if (error) {
    // Don't let audit-log failures silently corrupt the caller's success path,
    // but don't throw either — the primary state change already committed.
    console.error("Failed to record status history:", error);
  }
}

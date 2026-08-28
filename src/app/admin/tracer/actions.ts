"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { recordStatusChange } from "@/lib/status-history";

type ActionResult = { error: string | null };

export async function verifyTracerStudy(input: {
  tracerId: string;
  studentId: string;
  decision: "approved" | "revision";
  notes: string;
  currentStatus: string;
}): Promise<ActionResult> {
  const user = await requireRole(["admin_bkk"]);

  if (input.decision === "revision" && !input.notes.trim()) {
    return { error: "Catatan wajib diisi saat meminta revisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tracer_studies")
    .update({
      status: input.decision,
      review_notes: input.notes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.tracerId);

  if (error) return { error: error.message };

  await recordStatusChange(supabase, {
    studentId: input.studentId,
    module: "hiring_tracer",
    sourceTable: "tracer_studies",
    sourceId: input.tracerId,
    oldStatus: input.currentStatus,
    newStatus: input.decision,
    changedBy: user.id,
    reason: input.notes || null,
  });

  revalidatePath(`/admin/tracer/${input.tracerId}`);
  revalidatePath("/admin/tracer");
  return { error: null };
}

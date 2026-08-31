"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { recordStatusChange } from "@/lib/status-history";
import type { EmploymentProofStatus } from "@/types/domain";

type ActionResult = { error: string | null };

// NOTE: application_status (diproses/interview/diterima/ditolak) is
// self-reported by the STUDENT, not set by admin_bkk — only the student
// actually knows the real-world outcome of their own job application. See
// src/app/(student)/hiring/actions.ts updateMyJobApplicationStatus(). Admin
// BKK only ever SELECTs job_applications, for monitoring/threshold purposes.

export async function verifyEmploymentProof(input: {
  proofId: string;
  employmentStatusId: string;
  status: EmploymentProofStatus;
  notes: string;
}): Promise<ActionResult> {
  const user = await requireRole(["admin_bkk"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("employment_proofs")
    .update({
      status: input.status,
      notes: input.notes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.proofId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/hiring/${input.employmentStatusId}`);
  revalidatePath("/admin/hiring");
  return { error: null };
}

/** PDF §9b — bypass is scoped to the Hiring threshold/bukti-kerja requirement only; Tracer Study stays mandatory. */
export async function bypassHiringThreshold(input: {
  employmentStatusId: string;
  studentId: string;
  reason: string;
}): Promise<ActionResult> {
  const user = await requireRole(["admin_bkk"]);
  if (!input.reason.trim()) return { error: "Alasan bypass wajib diisi." };

  const supabase = await createClient();

  const { error } = await supabase.from("bypass_logs").insert({
    employment_status_id: input.employmentStatusId,
    bypassed_by: user.id,
    reason: input.reason,
  });
  if (error) return { error: error.message };

  await recordStatusChange(supabase, {
    studentId: input.studentId,
    module: "hiring_tracer",
    sourceTable: "employment_status",
    sourceId: input.employmentStatusId,
    oldStatus: null,
    newStatus: "hiring_bypassed",
    changedBy: user.id,
    reason: input.reason,
  });

  revalidatePath(`/admin/hiring/${input.employmentStatusId}`);
  revalidatePath("/admin/hiring");
  return { error: null };
}

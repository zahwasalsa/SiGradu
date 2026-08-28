"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { recordStatusChange } from "@/lib/status-history";
import type { DocumentStatus, ReviewDecision, ReviewMethod } from "@/types/domain";

type ActionResult = { error: string | null };

/** Kaprodi records their eligibility decision (PDF §2a) — required even when the assessment happened manually (e.g. in a prodi meeting). */
export async function recordKaprodiDecision(input: {
  applicationId: string;
  decision: ReviewDecision;
  method: ReviewMethod;
  notes: string;
}): Promise<ActionResult> {
  const user = await requireRole(["kaprodi"]);
  const supabase = await createClient();

  const { error } = await supabase.from("yudisium_reviews").insert({
    application_id: input.applicationId,
    reviewer_role: "kaprodi",
    reviewer_id: user.id,
    review_method: input.method,
    decision: input.decision,
    input_by: user.id,
    notes: input.notes || null,
    decided_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  const { error: statusError } = await supabase
    .from("yudisium_applications")
    .update({ status: "under_review" })
    .eq("id", input.applicationId)
    .eq("status", "submitted");
  if (statusError) return { error: statusError.message };

  revalidatePath(`/admin/yudisium/${input.applicationId}`);
  revalidatePath("/admin/yudisium");
  return { error: null };
}

/** Admin Fakultas sets the final status (PDF §2a) — approved/rejected. */
export async function setFinalDecision(input: {
  applicationId: string;
  studentId: string;
  decision: ReviewDecision;
  method: ReviewMethod;
  notes: string;
  currentStatus: string;
}): Promise<ActionResult> {
  const user = await requireRole(["admin_fakultas"]);
  const supabase = await createClient();

  const { error: reviewError } = await supabase.from("yudisium_reviews").insert({
    application_id: input.applicationId,
    reviewer_role: "admin_fakultas",
    reviewer_id: user.id,
    review_method: input.method,
    decision: input.decision,
    input_by: user.id,
    notes: input.notes || null,
    decided_at: new Date().toISOString(),
  });
  if (reviewError) return { error: reviewError.message };

  const newStatus = input.decision === "lolos" ? "approved" : "rejected";

  const { error: updateError } = await supabase
    .from("yudisium_applications")
    .update({ status: newStatus })
    .eq("id", input.applicationId);
  if (updateError) return { error: updateError.message };

  await recordStatusChange(supabase, {
    studentId: input.studentId,
    module: "yudisium",
    sourceTable: "yudisium_applications",
    sourceId: input.applicationId,
    oldStatus: input.currentStatus,
    newStatus,
    changedBy: user.id,
    reason: input.notes || null,
  });

  revalidatePath(`/admin/yudisium/${input.applicationId}`);
  revalidatePath("/admin/yudisium");
  return { error: null };
}

/** Admin Fakultas requests revision instead of a final decision. */
export async function requestRevision(input: {
  applicationId: string;
  studentId: string;
  notes: string;
  currentStatus: string;
}): Promise<ActionResult> {
  const user = await requireRole(["admin_fakultas"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("yudisium_applications")
    .update({ status: "revision" })
    .eq("id", input.applicationId);
  if (error) return { error: error.message };

  await recordStatusChange(supabase, {
    studentId: input.studentId,
    module: "yudisium",
    sourceTable: "yudisium_applications",
    sourceId: input.applicationId,
    oldStatus: input.currentStatus,
    newStatus: "revision",
    changedBy: user.id,
    reason: input.notes || null,
  });

  revalidatePath(`/admin/yudisium/${input.applicationId}`);
  revalidatePath("/admin/yudisium");
  return { error: null };
}

export async function updateDocumentStatus(input: {
  documentId: string;
  applicationId: string;
  status: DocumentStatus;
  notes: string;
}): Promise<ActionResult> {
  await requireRole(["admin_fakultas"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("yudisium_documents")
    .update({ status: input.status, notes: input.notes || null })
    .eq("id", input.documentId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/yudisium/${input.applicationId}`);
  return { error: null };
}

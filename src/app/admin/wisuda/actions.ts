"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { recordStatusChange } from "@/lib/status-history";

type ActionResult = { error: string | null };

/** Admin Keuangan verifies/rejects the latest payment attempt (PDF §4a). */
export async function verifyPayment(input: {
  paymentId: string;
  registrationId: string;
  studentId: string;
  attendanceChoice: "hadir" | "in_absentia";
  decision: "verified" | "rejected";
  rejectionReason: string;
}): Promise<ActionResult> {
  const user = await requireRole(["admin_keuangan"]);

  if (input.decision === "rejected" && !input.rejectionReason.trim()) {
    return { error: "Alasan penolakan wajib diisi." };
  }

  const supabase = await createClient();

  const { error: paymentError } = await supabase
    .from("graduation_payments")
    .update({
      status: input.decision,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      rejection_reason: input.decision === "rejected" ? input.rejectionReason : null,
    })
    .eq("id", input.paymentId);
  if (paymentError) return { error: paymentError.message };

  const nextStatus =
    input.decision === "rejected"
      ? "pembayaran_ditolak"
      : input.attendanceChoice === "hadir"
        ? "menunggu_data_buku"
        : "pembayaran_terverifikasi";

  const { data: registration } = await supabase
    .from("graduation_registrations")
    .select("status")
    .eq("id", input.registrationId)
    .maybeSingle();

  const { error: regError } = await supabase
    .from("graduation_registrations")
    .update({ status: nextStatus })
    .eq("id", input.registrationId);
  if (regError) return { error: regError.message };

  await recordStatusChange(supabase, {
    studentId: input.studentId,
    module: "wisuda",
    sourceTable: "graduation_registrations",
    sourceId: input.registrationId,
    oldStatus: registration?.status ?? null,
    newStatus: nextStatus,
    changedBy: user.id,
    reason: input.decision === "rejected" ? input.rejectionReason : null,
  });

  revalidatePath(`/admin/wisuda/${input.registrationId}`);
  revalidatePath("/admin/wisuda");
  return { error: null };
}

/** Admin Kemahasiswaan verifies photo/book data (PDF §4b). */
export async function verifyBookData(input: {
  bookDataId: string;
  registrationId: string;
  studentId: string;
  decision: "complete" | "revision_needed";
  notes: string;
}): Promise<ActionResult> {
  const user = await requireRole(["admin_kemahasiswaan"]);

  if (input.decision === "revision_needed" && !input.notes.trim()) {
    return { error: "Catatan revisi wajib diisi." };
  }

  const supabase = await createClient();

  const { error: bookError } = await supabase
    .from("graduation_book_data")
    .update({
      status: input.decision,
      review_notes: input.notes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.bookDataId);
  if (bookError) return { error: bookError.message };

  const nextStatus = input.decision === "complete" ? "data_buku_lengkap" : "revisi_data_buku";

  const { data: registration } = await supabase
    .from("graduation_registrations")
    .select("status")
    .eq("id", input.registrationId)
    .maybeSingle();

  const { error: regError } = await supabase
    .from("graduation_registrations")
    .update({ status: nextStatus })
    .eq("id", input.registrationId);
  if (regError) return { error: regError.message };

  await recordStatusChange(supabase, {
    studentId: input.studentId,
    module: "wisuda",
    sourceTable: "graduation_registrations",
    sourceId: input.registrationId,
    oldStatus: registration?.status ?? null,
    newStatus: nextStatus,
    changedBy: user.id,
    reason: input.notes || null,
  });

  revalidatePath(`/admin/wisuda/${input.registrationId}`);
  revalidatePath("/admin/wisuda");
  return { error: null };
}

/** Admin Wisuda's final verification (PDF §4b end state). */
export async function setFinalGraduationStatus(input: {
  registrationId: string;
  studentId: string;
  attendanceChoice: "hadir" | "in_absentia";
  currentStatus: string;
}): Promise<ActionResult> {
  const user = await requireRole(["admin_wisuda"]);
  const supabase = await createClient();

  const nextStatus =
    input.attendanceChoice === "hadir" ? "terdaftar_sebagai_wisudawan" : "wisuda_in_absentia";

  const { error } = await supabase
    .from("graduation_registrations")
    .update({ status: nextStatus, final_status_set_by: user.id, final_status_at: new Date().toISOString() })
    .eq("id", input.registrationId);
  if (error) return { error: error.message };

  await recordStatusChange(supabase, {
    studentId: input.studentId,
    module: "wisuda",
    sourceTable: "graduation_registrations",
    sourceId: input.registrationId,
    oldStatus: input.currentStatus,
    newStatus: nextStatus,
    changedBy: user.id,
  });

  revalidatePath(`/admin/wisuda/${input.registrationId}`);
  revalidatePath("/admin/wisuda");
  return { error: null };
}

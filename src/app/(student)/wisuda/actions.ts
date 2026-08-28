"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getStudentProgress, isModule3Unlocked } from "@/lib/modules/gating";
import { getActivePeriod } from "@/lib/modules/periods";
import { buildStoragePath, uploadPrivateFile, BUCKETS } from "@/lib/storage";
import { recordStatusChange } from "@/lib/status-history";
import type { AttendanceChoice } from "@/types/domain";

type ActionResult = { error: string | null };

async function getUnlockedRegistrationContext() {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) return { error: "Profil mahasiswa tidak ditemukan." as const };

  const supabase = await createClient();
  const progress = await getStudentProgress(supabase, {
    id: user.student.id,
    studyProgramId: user.student.studyProgramId,
  });

  if (!isModule3Unlocked(progress.hiringTracer.tracerStudy)) {
    return { error: "Modul Wisuda belum terbuka." as const };
  }

  return { error: null, supabase, studentId: user.student.id, userId: user.id, progress };
}

export async function setAttendanceChoice(
  choice: AttendanceChoice,
  notes: string
): Promise<ActionResult> {
  const ctx = await getUnlockedRegistrationContext();
  if (ctx.error) return { error: ctx.error };
  const { supabase, studentId, userId, progress } = ctx;

  let registrationId = progress.wisuda.registration?.id ?? null;
  const oldStatus = progress.wisuda.registration?.status ?? null;

  if (!registrationId) {
    const period = await getActivePeriod(supabase, "wisuda");
    if (!period) return { error: "Tidak ada periode wisuda yang sedang aktif." };

    const { data: inserted, error } = await supabase
      .from("graduation_registrations")
      .insert({
        student_id: studentId,
        period_id: period.id,
        attendance_choice: choice,
        attendance_notes: notes || null,
        status: "menunggu_pembayaran",
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    registrationId = inserted.id;
  } else {
    const { error } = await supabase
      .from("graduation_registrations")
      .update({ attendance_choice: choice, attendance_notes: notes || null, status: "menunggu_pembayaran" })
      .eq("id", registrationId);
    if (error) return { error: error.message };
  }

  await recordStatusChange(supabase, {
    studentId,
    module: "wisuda",
    sourceTable: "graduation_registrations",
    sourceId: registrationId,
    oldStatus,
    newStatus: "menunggu_pembayaran",
    changedBy: userId,
  });

  revalidatePath("/wisuda");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function uploadPayment(formData: FormData): Promise<ActionResult> {
  const ctx = await getUnlockedRegistrationContext();
  if (ctx.error) return { error: ctx.error };
  const { supabase, studentId, userId, progress } = ctx;

  const registration = progress.wisuda.registration;
  if (!registration) return { error: "Isi kesediaan wisuda terlebih dahulu." };

  const amountRaw = String(formData.get("amount") ?? "");
  const paymentDate = String(formData.get("paymentDate") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!amountRaw || !paymentDate || !file || file.size === 0) {
    return { error: "Nominal, tanggal bayar, dan bukti transfer wajib diisi." };
  }

  const path = buildStoragePath(["pembayaran", studentId], file.name);
  try {
    await uploadPrivateFile(supabase, BUCKETS.wisuda, path, file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengunggah bukti bayar." };
  }

  const { error } = await supabase.from("graduation_payments").insert({
    registration_id: registration.id,
    amount: Number(amountRaw),
    payment_date: paymentDate,
    payment_method: paymentMethod || null,
    proof_file_path: path,
  });
  if (error) return { error: error.message };

  const { error: updateError } = await supabase
    .from("graduation_registrations")
    .update({ status: "menunggu_verifikasi_pembayaran" })
    .eq("id", registration.id);
  if (updateError) return { error: updateError.message };

  await recordStatusChange(supabase, {
    studentId,
    module: "wisuda",
    sourceTable: "graduation_registrations",
    sourceId: registration.id,
    oldStatus: registration.status,
    newStatus: "menunggu_verifikasi_pembayaran",
    changedBy: userId,
  });

  revalidatePath("/wisuda");
  revalidatePath("/wisuda/pembayaran");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function uploadBookData(formData: FormData): Promise<ActionResult> {
  const ctx = await getUnlockedRegistrationContext();
  if (ctx.error) return { error: ctx.error };
  const { supabase, studentId, progress } = ctx;

  const registration = progress.wisuda.registration;
  if (!registration) return { error: "Registrasi wisuda tidak ditemukan." };
  if (registration.attendance_choice !== "hadir") {
    return { error: "Data Buku Wisuda hanya untuk yang Bersedia Hadir." };
  }

  const printFullName = String(formData.get("printFullName") ?? "").trim();
  const printDegree = String(formData.get("printDegree") ?? "").trim();
  const capGownSize = String(formData.get("capGownSize") ?? "").trim();
  const quoteText = String(formData.get("quoteText") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!printFullName || !printDegree || !file || file.size === 0) {
    return { error: "Nama, gelar cetak, dan foto formal wajib diisi." };
  }

  const path = buildStoragePath(["foto", studentId], file.name);
  try {
    await uploadPrivateFile(supabase, BUCKETS.wisuda, path, file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengunggah foto." };
  }

  const { data: existing } = await supabase
    .from("graduation_book_data")
    .select("id")
    .eq("registration_id", registration.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("graduation_book_data")
      .update({
        photo_file_path: path,
        print_full_name: printFullName,
        print_degree: printDegree,
        cap_gown_size: capGownSize || null,
        quote_text: quoteText || null,
        status: "pending",
        review_notes: null,
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("graduation_book_data").insert({
      registration_id: registration.id,
      photo_file_path: path,
      print_full_name: printFullName,
      print_degree: printDegree,
      cap_gown_size: capGownSize || null,
      quote_text: quoteText || null,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/wisuda/buku");
  revalidatePath("/wisuda");
  return { error: null };
}

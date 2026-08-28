"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getStudentProgress, isModule2Unlocked } from "@/lib/modules/gating";
import { buildStoragePath, uploadPrivateFile, BUCKETS } from "@/lib/storage";
import type { EmploymentCurrentStatus, EmploymentProofType } from "@/types/domain";

type ActionResult = { error: string | null };

async function getUnlockedContext() {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) return { error: "Profil mahasiswa tidak ditemukan." as const };

  const supabase = await createClient();
  const progress = await getStudentProgress(supabase, {
    id: user.student.id,
    studyProgramId: user.student.studyProgramId,
  });

  if (!isModule2Unlocked(progress.yudisium.application) || !progress.yudisium.application) {
    return { error: "Modul Hiring & Tracer belum terbuka." as const };
  }

  return {
    error: null,
    supabase,
    studentId: user.student.id,
    periodId: progress.yudisium.application.period_id,
  };
}

export async function declareEmploymentStatus(
  currentStatus: EmploymentCurrentStatus
): Promise<ActionResult> {
  const ctx = await getUnlockedContext();
  if (ctx.error) return { error: ctx.error };
  const { supabase, studentId, periodId } = ctx;

  const { data: existing } = await supabase
    .from("employment_status")
    .select("id")
    .eq("student_id", studentId)
    .eq("period_id", periodId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("employment_status")
      .update({ current_status: currentStatus, declared_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("employment_status").insert({
      student_id: studentId,
      period_id: periodId,
      current_status: currentStatus,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/hiring");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function addJobApplication(input: {
  vacancyId: string | null;
  vacancyNameExternal: string | null;
  appliedAt: string;
}): Promise<ActionResult> {
  const ctx = await getUnlockedContext();
  if (ctx.error) return { error: ctx.error };
  const { supabase, studentId, periodId } = ctx;

  if (!input.vacancyId && !input.vacancyNameExternal) {
    return { error: "Pilih lowongan atau isi nama lowongan." };
  }

  const { data: es } = await supabase
    .from("employment_status")
    .select("id")
    .eq("student_id", studentId)
    .eq("period_id", periodId)
    .maybeSingle();

  if (!es) return { error: "Isi status pekerjaan terlebih dahulu." };

  const { error } = await supabase.from("job_applications").insert({
    employment_status_id: es.id,
    vacancy_id: input.vacancyId,
    vacancy_name_external: input.vacancyNameExternal,
    applied_at: input.appliedAt,
  });
  if (error) return { error: error.message };

  revalidatePath("/hiring");
  revalidatePath("/hiring/lamaran");
  revalidatePath("/hiring/lowongan");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function uploadEmploymentProof(formData: FormData): Promise<ActionResult> {
  const ctx = await getUnlockedContext();
  if (ctx.error) return { error: ctx.error };
  const { supabase, studentId, periodId } = ctx;

  const companyName = String(formData.get("companyName") ?? "").trim();
  const businessField = String(formData.get("businessField") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const proofType = String(formData.get("proofType") ?? "") as EmploymentProofType;
  const file = formData.get("file") as File | null;

  if (!companyName || !proofType || !file || file.size === 0) {
    return { error: "Nama perusahaan, jenis bukti, dan berkas wajib diisi." };
  }

  const { data: es } = await supabase
    .from("employment_status")
    .select("id")
    .eq("student_id", studentId)
    .eq("period_id", periodId)
    .maybeSingle();
  if (!es) return { error: "Isi status pekerjaan terlebih dahulu." };

  const path = buildStoragePath(["bukti-kerja", studentId], file.name);
  try {
    await uploadPrivateFile(supabase, BUCKETS.hiring, path, file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengunggah berkas." };
  }

  const { error } = await supabase.from("employment_proofs").insert({
    employment_status_id: es.id,
    company_name: companyName,
    business_field: businessField || null,
    position: position || null,
    start_date: startDate || null,
    proof_type: proofType,
    file_path: path,
  });
  if (error) return { error: error.message };

  revalidatePath("/hiring");
  revalidatePath("/dashboard");
  return { error: null };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getStudentProgress, isModule2Unlocked } from "@/lib/modules/gating";
import { recordStatusChange } from "@/lib/status-history";

type ActionResult = { error: string | null };

export async function submitTracerStudy(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) return { error: "Profil mahasiswa tidak ditemukan." };

  const supabase = await createClient();
  const progress = await getStudentProgress(supabase, {
    id: user.student.id,
    studyProgramId: user.student.studyProgramId,
  });

  if (!isModule2Unlocked(progress.yudisium.application) || !progress.yudisium.application) {
    return { error: "Modul Hiring & Tracer belum terbuka." };
  }
  if (!progress.hiringTracer.hiringRequirementMet) {
    return { error: "Syarat Hiring/Bukti Kerja belum terpenuhi." };
  }

  const periodId = progress.yudisium.application.period_id;

  const currentCondition = String(formData.get("currentCondition") ?? "");
  const waitingTimeRaw = String(formData.get("waitingTimeMonths") ?? "");
  const jobAcquisitionMethod = String(formData.get("jobAcquisitionMethod") ?? "").trim();
  const fieldRelevance = String(formData.get("fieldRelevance") ?? "").trim();
  const competencyUsageLevel = String(formData.get("competencyUsageLevel") ?? "").trim();
  const salaryRange = String(formData.get("salaryRange") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const suggestions = String(formData.get("suggestions") ?? "").trim();

  if (!currentCondition) {
    return { error: "Kondisi saat ini wajib diisi." };
  }

  const payload = {
    current_condition: currentCondition as
      | "bekerja"
      | "wirausaha"
      | "melanjutkan_studi"
      | "belum_bekerja",
    waiting_time_months: waitingTimeRaw ? Number(waitingTimeRaw) : null,
    job_acquisition_method: jobAcquisitionMethod || null,
    field_relevance: fieldRelevance || null,
    competency_usage_level: competencyUsageLevel || null,
    salary_range: salaryRange || null,
    company_name: companyName || null,
    suggestions: suggestions || null,
  };

  const { data: existing } = await supabase
    .from("tracer_studies")
    .select("id, status")
    .eq("student_id", user.student.id)
    .eq("period_id", periodId)
    .maybeSingle();

  const oldStatus = existing?.status ?? null;

  if (existing) {
    const { error } = await supabase
      .from("tracer_studies")
      .update({ ...payload, status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message };

    await recordStatusChange(supabase, {
      studentId: user.student.id,
      module: "hiring_tracer",
      sourceTable: "tracer_studies",
      sourceId: existing.id,
      oldStatus,
      newStatus: "submitted",
      changedBy: user.id,
    });
  } else {
    const { data: inserted, error } = await supabase
      .from("tracer_studies")
      .insert({
        student_id: user.student.id,
        period_id: periodId,
        ...payload,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) return { error: error.message };

    await recordStatusChange(supabase, {
      studentId: user.student.id,
      module: "hiring_tracer",
      sourceTable: "tracer_studies",
      sourceId: inserted.id,
      oldStatus: null,
      newStatus: "submitted",
      changedBy: user.id,
    });
  }

  revalidatePath("/tracer");
  revalidatePath("/dashboard");
  return { error: null };
}

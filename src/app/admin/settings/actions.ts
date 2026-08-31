"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

type ActionResult = { error: string | null };

export async function upsertHiringThreshold(input: {
  periodId: string;
  studyProgramId: string | null;
  minApplications: number;
}): Promise<ActionResult> {
  const user = await requireRole(["admin_bkk"]);
  if (input.minApplications <= 0) return { error: "Threshold harus lebih dari 0." };

  const supabase = await createClient();

  let query = supabase.from("hiring_thresholds").select("id").eq("period_id", input.periodId);
  query = input.studyProgramId
    ? query.eq("study_program_id", input.studyProgramId)
    : query.is("study_program_id", null);
  const { data: existing } = await query.maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("hiring_thresholds")
      .update({ min_applications: input.minApplications, set_by: user.id })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("hiring_thresholds").insert({
      period_id: input.periodId,
      study_program_id: input.studyProgramId,
      min_applications: input.minApplications,
      set_by: user.id,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/settings");
  return { error: null };
}

export async function createVacancy(input: {
  title: string;
  companyName: string;
  description: string;
}): Promise<ActionResult> {
  const user = await requireRole(["admin_bkk"]);
  if (!input.title.trim() || !input.companyName.trim()) {
    return { error: "Judul lowongan dan nama perusahaan wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("job_vacancies").insert({
    title: input.title.trim(),
    company_name: input.companyName.trim(),
    description: input.description.trim() || null,
    posted_by: user.id,
    is_active: true,
  });
  if (error) return { error: "Gagal menyimpan lowongan. Silakan coba lagi." };

  revalidatePath("/admin/settings");
  revalidatePath("/hiring/lowongan");
  return { error: null };
}

export async function setVacancyActive(vacancyId: string, isActive: boolean): Promise<ActionResult> {
  await requireRole(["admin_bkk"]);
  const supabase = await createClient();

  const { error } = await supabase.from("job_vacancies").update({ is_active: isActive }).eq("id", vacancyId);
  if (error) return { error: "Gagal memperbarui lowongan." };

  revalidatePath("/admin/settings");
  revalidatePath("/hiring/lowongan");
  return { error: null };
}

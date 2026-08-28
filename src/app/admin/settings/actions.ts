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

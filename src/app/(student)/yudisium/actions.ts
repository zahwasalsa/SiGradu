"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getActivePeriod } from "@/lib/modules/periods";
import { recordStatusChange } from "@/lib/status-history";
import { buildStoragePath, uploadPrivateFile, BUCKETS } from "@/lib/storage";
import { DOCUMENT_TYPES, type DocumentType } from "@/types/domain";

type ActionResult = { error: string | null };

/** Creates the student's draft application for the active yudisium period, if one doesn't exist yet. */
export async function createDraftApplication(): Promise<ActionResult> {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) return { error: "Profil mahasiswa tidak ditemukan." };

  const supabase = await createClient();
  const period = await getActivePeriod(supabase, "yudisium");
  if (!period) {
    return { error: "Tidak ada periode yudisium yang sedang aktif saat ini." };
  }

  const { data: existing } = await supabase
    .from("yudisium_applications")
    .select("id")
    .eq("student_id", user.student.id)
    .eq("period_id", period.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("yudisium_applications").insert({
      student_id: user.student.id,
      period_id: period.id,
      status: "draft",
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/yudisium");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function uploadYudisiumDocument(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) return { error: "Profil mahasiswa tidak ditemukan." };

  const applicationId = String(formData.get("applicationId") ?? "");
  const documentType = String(formData.get("documentType") ?? "") as DocumentType;
  const file = formData.get("file") as File | null;

  if (!applicationId || !file || file.size === 0) {
    return { error: "Berkas wajib dipilih." };
  }
  if (!DOCUMENT_TYPES.includes(documentType)) {
    return { error: "Jenis dokumen tidak valid." };
  }

  const supabase = await createClient();

  const { data: application } = await supabase
    .from("yudisium_applications")
    .select("id, student_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application || application.student_id !== user.student.id) {
    return { error: "Pengajuan tidak ditemukan." };
  }
  if (application.status !== "draft" && application.status !== "revision") {
    return { error: "Dokumen hanya bisa diunggah saat status Draft atau Revisi." };
  }

  const path = buildStoragePath([documentType, user.student.id], file.name);
  try {
    await uploadPrivateFile(supabase, BUCKETS.yudisium, path, file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengunggah berkas ke storage." };
  }

  const { data: existingDoc } = await supabase
    .from("yudisium_documents")
    .select("id")
    .eq("application_id", applicationId)
    .eq("document_type", documentType)
    .maybeSingle();

  if (existingDoc) {
    const { error } = await supabase
      .from("yudisium_documents")
      .update({
        file_path: path,
        file_name: file.name,
        file_size_bytes: file.size,
        status: "pending",
        notes: null,
      })
      .eq("id", existingDoc.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("yudisium_documents").insert({
      application_id: applicationId,
      document_type: documentType,
      file_path: path,
      file_name: file.name,
      file_size_bytes: file.size,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/yudisium/dokumen");
  revalidatePath("/yudisium");
  return { error: null };
}

export async function submitApplication(applicationId: string): Promise<ActionResult> {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) return { error: "Profil mahasiswa tidak ditemukan." };

  const supabase = await createClient();

  const { data: application } = await supabase
    .from("yudisium_applications")
    .select("id, student_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application || application.student_id !== user.student.id) {
    return { error: "Pengajuan tidak ditemukan." };
  }
  if (application.status !== "draft" && application.status !== "revision") {
    return { error: "Pengajuan ini sudah diajukan sebelumnya." };
  }

  const { count } = await supabase
    .from("yudisium_documents")
    .select("id", { count: "exact", head: true })
    .eq("application_id", applicationId);

  if (!count || count === 0) {
    return { error: "Unggah minimal satu dokumen sebelum mengajukan." };
  }

  const { error } = await supabase
    .from("yudisium_applications")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  await recordStatusChange(supabase, {
    studentId: user.student.id,
    module: "yudisium",
    sourceTable: "yudisium_applications",
    sourceId: applicationId,
    oldStatus: application.status,
    newStatus: "submitted",
    changedBy: user.id,
  });

  revalidatePath("/yudisium");
  revalidatePath("/yudisium/status");
  revalidatePath("/dashboard");
  return { error: null };
}

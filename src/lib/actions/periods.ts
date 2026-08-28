"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { PeriodType, UserRole } from "@/types/domain";

export type PeriodActionState = { error: string | null; success?: boolean };

/**
 * Which period `type` each admin role may create/toggle. Resolves the
 * previously-open "who manages master data" question (docs/DATABASE_DESIGN.md
 * §2.3/§9.2) for `periods` only — per explicit approval. faculties/
 * study_programs remain untouched; that question is still open for them.
 */
const ROLE_ALLOWED_PERIOD_TYPES: Partial<Record<UserRole, PeriodType[]>> = {
  admin_bkk: ["yudisium", "wisuda"],
  admin_fakultas: ["yudisium"],
  admin_keuangan: ["wisuda"],
  admin_kemahasiswaan: ["wisuda"],
  admin_wisuda: ["wisuda"],
};

const ALLOWED_ROLES = Object.keys(ROLE_ALLOWED_PERIOD_TYPES) as UserRole[];

const createPeriodSchema = z
  .object({
    type: z.enum(["yudisium", "wisuda"]),
    name: z.string().trim().min(3, "Nama periode minimal 3 karakter").max(120, "Nama periode terlalu panjang"),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "Tanggal selesai harus setelah tanggal mulai.",
    path: ["endDate"],
  });

/** Creates a new period, active by default (most common case: opening a new intake). */
export async function createPeriod(input: unknown): Promise<PeriodActionState> {
  const user = await requireRole(ALLOWED_ROLES);
  const parsed = createPeriodSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Periksa kembali data yang Anda isi." };
  }

  const allowedTypes = ROLE_ALLOWED_PERIOD_TYPES[user.role] ?? [];
  if (!allowedTypes.includes(parsed.data.type)) {
    return { error: "Anda tidak berwenang membuat periode jenis ini." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("periods").insert({
    type: parsed.data.type,
    name: parsed.data.name,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    is_active: true,
  });

  if (error) {
    return { error: "Gagal menyimpan periode. Silakan coba lagi." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/yudisium");
  revalidatePath("/admin/wisuda");
  return { error: null, success: true };
}

export async function setPeriodActive(
  periodId: string,
  type: PeriodType,
  isActive: boolean
): Promise<PeriodActionState> {
  const user = await requireRole(ALLOWED_ROLES);
  const allowedTypes = ROLE_ALLOWED_PERIOD_TYPES[user.role] ?? [];
  if (!allowedTypes.includes(type)) {
    return { error: "Anda tidak berwenang mengubah periode jenis ini." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("periods").update({ is_active: isActive }).eq("id", periodId);
  if (error) {
    return { error: "Gagal memperbarui periode." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/yudisium");
  revalidatePath("/admin/wisuda");
  return { error: null, success: true };
}

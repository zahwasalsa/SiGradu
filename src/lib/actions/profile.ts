"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireRole } from "@/lib/auth/session";
import { DEGREE_LEVELS } from "@/types/domain";

export type ProfileActionState = { error: string | null; success?: boolean };

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(120, "Nama lengkap terlalu panjang"),
  phoneNumber: z
    .string()
    .trim()
    .max(20, "Nomor HP terlalu panjang")
    .optional()
    .or(z.literal("")),
});

/**
 * Updates only `full_name`/`phone_number` on the caller's own `public.users`
 * row, via the regular (RLS-scoped) client — never the admin/service-role
 * client. RLS (`users_update_own`) plus the column-level grant already in
 * place (`grant update (full_name, phone_number) on public.users`) mean this
 * can never touch `role`, `is_active`, `email`, or any other user's row, even
 * if this action were called with a forged id. `students` (nim, faculty_id,
 * study_program_id, degree_level) is never written here at all.
 */
export async function updateProfile(input: unknown): Promise<ProfileActionState> {
  const user = await requireUser();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Periksa kembali data yang Anda isi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      full_name: parsed.data.fullName,
      phone_number: parsed.data.phoneNumber || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Gagal menyimpan perubahan. Silakan coba lagi." };
  }

  revalidatePath(user.role === "mahasiswa" ? "/profile" : "/admin/profile");
  return { error: null, success: true };
}

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

/**
 * Changes the caller's own password via Supabase Auth's own updateUser()
 * (auth.users), using the current session — not a public.* table, so no
 * RLS/grant is involved here.
 */
export async function changePassword(input: unknown): Promise<ProfileActionState> {
  await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Periksa kembali data yang Anda isi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return { error: "Gagal mengubah password. Silakan coba lagi." };
  }

  return { error: null, success: true };
}

const completeProfileSchema = z.object({
  nim: z.string().trim().min(3, "NIM tidak valid").max(30, "NIM terlalu panjang"),
  facultyId: z.string().uuid("Pilih fakultas"),
  studyProgramId: z.string().uuid("Pilih program studi"),
  degreeLevel: z.enum(DEGREE_LEVELS, { message: "Pilih jenjang" }),
});

/**
 * One-shot completion for a mahasiswa account whose public.students row is
 * missing (e.g. provisioned directly in Supabase Auth before the
 * self-register flow existed). Same self-reported NIM/faculty/study_program/
 * degree_level pattern as registerStudent() at signup — this just lets an
 * already-authenticated account fill it in later. Blocked outright if the
 * row already exists; students_insert_own RLS (self-row only) plus the
 * already-revoked UPDATE grant on students together make this a genuine
 * one-shot action, never an edit.
 */
export async function completeStudentProfile(input: unknown): Promise<ProfileActionState> {
  const user = await requireRole(["mahasiswa"]);
  if (user.student) {
    return { error: "Profil akademik Anda sudah lengkap." };
  }

  const parsed = completeProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Periksa kembali data yang Anda isi." };
  }
  const data = parsed.data;

  const supabase = await createClient();

  // Defense-in-depth: confirm the chosen study program truly belongs to the
  // chosen faculty and matches the chosen degree level — mirrors the same
  // checks in registerStudent().
  const { data: program } = await supabase
    .from("study_programs")
    .select("id, faculty_id, degree_level")
    .eq("id", data.studyProgramId)
    .maybeSingle();

  if (!program || program.faculty_id !== data.facultyId) {
    return { error: "Program studi tidak sesuai dengan fakultas yang dipilih." };
  }
  if (program.degree_level !== data.degreeLevel) {
    return { error: "Jenjang yang dipilih tidak sesuai dengan program studi." };
  }

  const { error } = await supabase.from("students").insert({
    user_id: user.id,
    nim: data.nim,
    faculty_id: data.facultyId,
    study_program_id: data.studyProgramId,
    degree_level: data.degreeLevel,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "NIM sudah terdaftar, atau profil akademik Anda sudah ada. Muat ulang halaman."
        : "Gagal menyimpan profil akademik. Silakan coba lagi.";
    return { error: message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/yudisium");
  revalidatePath("/hiring");
  revalidatePath("/tracer");
  revalidatePath("/wisuda");
  return { error: null, success: true };
}

"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema, type RegisterInput } from "./schema";

export type RegisterState = {
  error: string | null;
  success?: boolean;
  /** True when Supabase requires the student to confirm their email before they can log in. */
  needsEmailConfirmation?: boolean;
};

function mapSupabaseAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "Email sudah terdaftar. Silakan masuk atau gunakan email lain.";
  }
  if (lower.includes("password")) {
    return "Password tidak memenuhi syarat keamanan minimum.";
  }
  if (lower.includes("email") && lower.includes("invalid")) {
    return "Format email tidak valid.";
  }
  // Never leak the raw Supabase/Postgres error text to the client.
  return "Registrasi gagal. Silakan coba lagi.";
}

/**
 * Student self-registration. Role is always hardcoded to 'mahasiswa' here —
 * never accepted from the caller — so there is no path for a client to
 * register themselves as any admin role.
 *
 * Provisioning `public.users`/`public.students` uses the service-role client
 * (see src/lib/supabase/admin.ts) because neither table has an INSERT policy
 * for `authenticated` — see the audit note in that file for why.
 */
export async function registerStudent(input: RegisterInput): Promise<RegisterState> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Periksa kembali data yang Anda isi." };
  }
  const data = parsed.data;

  const admin = createAdminClient();

  // Defense-in-depth: the client-side <Select> already filters study programs
  // by faculty, but never trust that alone — confirm the pair is actually
  // consistent before writing anything. study_programs also carries its own
  // degree_level (independent from the value the user picks in the form), so
  // check that too — otherwise a student row could end up pointing at a
  // sarjana program while claiming degree_level 'magister', or vice versa.
  const { data: program } = await admin
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

  // Reject up front if this email already has a Sigradu profile — covers
  // accounts provisioned outside self-registration (e.g. admin accounts
  // created directly in Supabase Auth + public.users). Without this, a
  // pre-existing account with no public.users row yet (a provisioning gap,
  // not a "free" identity) could get silently claimed as 'mahasiswa' below.
  const { data: existingProfile } = await admin
    .from("users")
    .select("id")
    .eq("email", data.email)
    .maybeSingle();

  if (existingProfile) {
    return { error: "Email sudah terdaftar. Silakan masuk atau gunakan email lain." };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`;
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/` },
  });

  if (signUpError) {
    return { error: mapSupabaseAuthError(signUpError.message) };
  }
  if (!signUpData.user) {
    return { error: "Registrasi gagal. Silakan coba lagi." };
  }

  // Supabase Auth returns 200 with an EMPTY `identities` array (not an
  // error) when signUp is called for an email that already has an auth
  // account — deliberate anti-enumeration behavior. `signUpData.user` in
  // that case is the PRE-EXISTING account, not a new one. Without this
  // check we could (a) attach a 'mahasiswa' profile to someone else's
  // account, and worse, (b) the profileError cleanup below would call
  // admin.auth.admin.deleteUser() on that pre-existing account.
  if (signUpData.user.identities && signUpData.user.identities.length === 0) {
    return { error: "Email sudah terdaftar. Silakan masuk atau gunakan email lain." };
  }

  const newUserId = signUpData.user.id;

  const { error: profileError } = await admin.from("users").insert({
    id: newUserId,
    email: data.email,
    full_name: data.fullName,
    role: "mahasiswa",
  });

  if (profileError) {
    // Safe to delete here: the identities check above already confirmed
    // this auth account was just created by this request, not pre-existing.
    await admin.auth.admin.deleteUser(newUserId);
    return { error: "Registrasi gagal saat menyimpan profil. Silakan coba lagi." };
  }

  const { error: studentError } = await admin.from("students").insert({
    user_id: newUserId,
    nim: data.nim,
    faculty_id: data.facultyId,
    study_program_id: data.studyProgramId,
    degree_level: data.degreeLevel,
  });

  if (studentError) {
    await admin.from("users").delete().eq("id", newUserId);
    await admin.auth.admin.deleteUser(newUserId);
    const message =
      studentError.code === "23505"
        ? "NIM sudah terdaftar. Periksa kembali NIM Anda."
        : "Registrasi gagal saat menyimpan data mahasiswa. Silakan coba lagi.";
    return { error: message };
  }

  // signUpData.session is only non-null when Supabase auto-confirmed the
  // account (i.e. "Confirm email" is off for this project) — when it's null,
  // the student must click the confirmation link before they can log in.
  return { error: null, success: true, needsEmailConfirmation: !signUpData.session };
}

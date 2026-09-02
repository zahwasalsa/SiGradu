"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/types/domain";

export type SignInState = { error: string | null; unconfirmedEmail?: string };

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Supabase collapses "wrong password" and "account doesn't exist" into the
    // same generic invalid_credentials error (anti-enumeration) — but an
    // unconfirmed email is a distinct, actionable case worth telling the user
    // about directly, since the account/password ARE correct at that point.
    if (error?.code === "email_not_confirmed") {
      return {
        error: "Email Anda belum dikonfirmasi. Cek inbox (atau folder spam) dan klik link konfirmasi terlebih dahulu.",
        unconfirmedEmail: email,
      };
    }
    return { error: "Email atau password salah." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Akun Anda belum terdaftar di sistem Sigradu. Hubungi admin." };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Akun Anda nonaktif. Hubungi admin." };
  }

  const destination =
    redirectTo && redirectTo.startsWith("/") ? redirectTo : ROLE_HOME[profile.role];
  redirect(destination);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ForgotPasswordState = { error: string | null; success: boolean };

/**
 * Sends a Supabase Auth password-reset email (works for any role — students
 * and admin/staff share the same auth.users table). Always returns success
 * regardless of whether the email is actually registered, so this can never
 * be used to enumerate which emails have accounts.
 */
export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Email wajib diisi.", success: false };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`;

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return { error: null, success: true };
}

/**
 * Re-sends the signup confirmation email — used from the login page when
 * sign-in fails with email_not_confirmed, so a stuck student isn't stranded
 * if the first email never arrived or expired.
 */
export async function resendConfirmationEmail(email: string): Promise<{ error: string | null }> {
  if (!email) return { error: "Email tidak valid." };

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/` },
  });

  if (error) return { error: "Gagal mengirim ulang email konfirmasi. Silakan coba lagi." };
  return { error: null };
}

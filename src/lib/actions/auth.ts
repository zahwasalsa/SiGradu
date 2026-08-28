"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/types/domain";

export type SignInState = { error: string | null };

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

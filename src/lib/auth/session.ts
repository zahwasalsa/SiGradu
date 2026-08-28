import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type UserRole } from "@/types/domain";

export type CurrentStudent = {
  id: string;
  nim: string;
  facultyId: string;
  studyProgramId: string;
  degreeLevel: "sarjana" | "magister";
  thesisTitle: string | null;
  supervisorName: string | null;
};

export type CurrentUser = {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneNumber: string | null;
  isActive: boolean;
  /** Populated only when role === "mahasiswa". */
  student: CurrentStudent | null;
};

/**
 * The raw Supabase Auth user, if any — no `public.users` lookup. Separated
 * out (and cached) so callers can tell "no session at all" apart from
 * "has a session but no Sigradu profile yet" without an extra network round
 * trip (getCurrentUser() reuses this same cached call).
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Loads the signed-in user's application profile (public.users) and, for
 * mahasiswa, their student record. Returns null when there is no session, OR
 * when the auth user has no matching row in public.users yet (account
 * provisioning not done — see requireUser(), which sends that case to
 * /account-pending instead of silently treating it as "not logged in").
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, role, full_name, email, phone_number, is_active")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile) return null;

  let student: CurrentStudent | null = null;

  if (profile.role === "mahasiswa") {
    const { data: studentRow } = await supabase
      .from("students")
      .select(
        "id, nim, faculty_id, study_program_id, degree_level, thesis_title, supervisor_name"
      )
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (studentRow) {
      student = {
        id: studentRow.id,
        nim: studentRow.nim,
        facultyId: studentRow.faculty_id,
        studyProgramId: studentRow.study_program_id,
        degreeLevel: studentRow.degree_level,
        thesisTitle: studentRow.thesis_title,
        supervisorName: studentRow.supervisor_name,
      };
    }
  }

  return {
    id: profile.id,
    authUserId: authUser.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    phoneNumber: profile.phone_number,
    isActive: profile.is_active,
    student,
  };
});

/**
 * Redirects to /login when there is no Supabase Auth session at all, and to
 * /account-pending when there IS a session but no matching public.users row
 * — that case must never be silently treated as "not logged in" (it would
 * just bounce back to /login with no explanation of why).
 */
export async function requireUser(): Promise<CurrentUser> {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  const user = await getCurrentUser();
  if (!user) redirect("/account-pending");
  return user;
}

/**
 * Redirects to /login (no session) or /account-pending (session, no profile)
 * via requireUser(), and to the caller's own "home" route when their role is
 * not in `roles`. Use at the top of a layout/page to authorize a whole route
 * subtree.
 */
export async function requireRole(roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(ROLE_HOME[user.role]);
  }
  return user;
}

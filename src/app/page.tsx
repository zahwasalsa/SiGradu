import { redirect } from "next/navigation";
import { getAuthUser, getCurrentUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/types/domain";

/**
 * Root route is a pure traffic director:
 *   - no Supabase Auth session at all -> /login
 *   - session exists but no public.users profile yet -> /account-pending
 *     (never silently treated as "not logged in", see session.ts)
 *   - full profile -> the role's portal home
 * No UI lives here.
 */
export default async function RootPage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/account-pending");
  }

  redirect(ROLE_HOME[user.role]);
}

import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getAuthUser, getCurrentUser } from "@/lib/auth/session";
import { signOutAction } from "@/lib/actions/auth";
import { ROLE_HOME } from "@/types/domain";
import { Button } from "@/components/ui/button";

/**
 * Shown when a visitor has a valid Supabase Auth session but no matching
 * `public.users` row yet — a provisioning gap, not "not logged in". Never
 * silently falls back to the mahasiswa dashboard or /login without
 * explanation (see src/lib/auth/session.ts requireUser()).
 */
export default async function AccountPendingPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  // If a profile shows up later in this same request (race with provisioning
  // finishing elsewhere), just send them where they actually belong instead
  // of showing a stale "pending" message.
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="text-lg font-semibold">Akun Belum Aktif</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Akun <span className="font-medium text-foreground">{authUser.email}</span> sudah
          terverifikasi, tetapi profil Anda belum tersedia di sistem Sigradu. Hubungi
          Administrator untuk mengaktifkan akses Anda.
        </p>
        <form action={signOutAction} className="mt-6">
          <Button type="submit" variant="outline" className="w-full">
            Keluar
          </Button>
        </form>
      </div>
    </div>
  );
}

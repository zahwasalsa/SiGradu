import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { getAuthUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

/**
 * Reachable only via the recovery session /auth/callback just established
 * from the emailed reset link — not in the middleware's public-path list on
 * purpose, so a visitor with no session at all is bounced by the normal
 * "must be logged in" gate straight back to /forgot-password.
 */
export default async function ResetPasswordPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/forgot-password?expired=1");

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <KeyRound className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">Buat Password Baru</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan password baru untuk akun {authUser.email}.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}

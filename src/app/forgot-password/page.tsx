import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <KeyRound className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">Lupa Password</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan email akun Anda — kami akan mengirim tautan untuk membuat password baru.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <ForgotPasswordForm expired={expired === "1"} />
        </div>

        <div className="mt-6 flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground">
          <p>
            Sudah ingat password?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Kembali ke halaman masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">Masuk ke Sigradu</h1>
          <p className="text-sm text-muted-foreground">
            Sistem Terintegrasi Yudisium, Campus Hiring &amp; Tracer Study, dan Wisuda
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <LoginForm redirectTo={redirectTo} />
        </div>

        <div className="mt-6 flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground">
          <p>
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Daftar sebagai Mahasiswa
            </Link>
          </p>
          <p>Lupa password atau akun admin/staf? Hubungi administrator Sigradu.</p>
        </div>
      </div>
    </div>
  );
}

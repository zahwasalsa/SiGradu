import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { RegisterForm } from "@/components/auth/register-form";

// admin.ts doesn't touch cookies(), so Next.js has no signal this route needs
// per-request rendering — without this, faculties/study_programs would be
// frozen at build time and never reflect master data added afterward.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const admin = createAdminClient();

  const [{ data: faculties }, { data: studyPrograms }] = await Promise.all([
    admin.from("faculties").select("id, name").order("name"),
    admin
      .from("study_programs")
      .select("id, name, faculty_id, degree_level")
      .order("name"),
  ]);

  const hasFaculties = (faculties?.length ?? 0) > 0;

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">Daftar Akun Mahasiswa</h1>
          <p className="text-sm text-muted-foreground">
            Lengkapi data berikut untuk membuat akun Sigradu Anda
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          {hasFaculties ? (
            <RegisterForm faculties={faculties ?? []} studyPrograms={studyPrograms ?? []} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Data fakultas belum tersedia. Silakan hubungi administrator.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

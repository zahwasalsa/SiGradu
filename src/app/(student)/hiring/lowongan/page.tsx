import { Briefcase } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress, isModule2Unlocked } from "@/lib/modules/gating";
import { PageHeader } from "@/components/shared/page-header";
import { LockedNotice } from "@/components/shared/locked-notice";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplyButton } from "@/components/hiring/apply-button";

export default async function HiringLowonganPage() {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) return <IncompleteProfileNotice />;

  const supabase = await createClient();
  const progress = await getStudentProgress(supabase, {
    id: user.student.id,
    studyProgramId: user.student.studyProgramId,
  });

  if (!isModule2Unlocked(progress.yudisium.application)) {
    return (
      <div>
        <PageHeader title="Lowongan Campus Hiring" />
        <LockedNotice title="Modul ini masih terkunci" description="Selesaikan Modul 1 Yudisium terlebih dahulu." />
      </div>
    );
  }

  const { data: vacancies } = await supabase
    .from("job_vacancies")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Lowongan Campus Hiring"
        description="Daftar lowongan yang tersedia dari Admin BKK. Punya lamaran ke lowongan di luar daftar ini? Catat di halaman Lamaran Saya."
      />

      {!vacancies || vacancies.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Belum ada lowongan"
          description="Admin BKK belum menambahkan lowongan pada periode ini."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vacancies.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="text-base">{v.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{v.company_name}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {v.description ? <p className="text-sm">{v.description}</p> : null}
                <div className="flex justify-end">
                  <ApplyButton vacancyId={v.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

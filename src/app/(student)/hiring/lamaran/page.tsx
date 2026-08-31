import { ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress, isModule2Unlocked } from "@/lib/modules/gating";
import { PageHeader } from "@/components/shared/page-header";
import { LockedNotice } from "@/components/shared/locked-notice";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { AddExternalApplicationForm } from "@/components/hiring/add-external-application-form";
import { JobApplicationStatusSelect } from "@/components/hiring/job-application-status-select";
import { JOB_APPLICATION_STATUS_LABELS } from "@/types/domain";

export default async function HiringLamaranPage() {
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
        <PageHeader title="Lamaran Saya" />
        <LockedNotice title="Modul ini masih terkunci" description="Selesaikan Modul 1 Yudisium terlebih dahulu." />
      </div>
    );
  }

  if (!progress.hiringTracer.employmentStatus) {
    return (
      <div>
        <PageHeader title="Lamaran Saya" />
        <p className="text-sm text-muted-foreground">Isi status pekerjaan Anda dahulu di halaman Campus Hiring.</p>
      </div>
    );
  }

  const { data: applications } = await supabase
    .from("job_applications")
    .select("*, job_vacancies(title, company_name)")
    .eq("employment_status_id", progress.hiringTracer.employmentStatus.id)
    .order("applied_at", { ascending: false });

  type ApplicationRow = {
    id: string;
    applied_at: string;
    application_status: keyof typeof JOB_APPLICATION_STATUS_LABELS;
    vacancy_name_external: string | null;
    job_vacancies: { title: string; company_name: string } | null;
  };
  const rows = (applications ?? []) as unknown as ApplicationRow[];

  return (
    <div>
      <PageHeader
        title="Lamaran Saya"
        description={`Total ${rows.length} lamaran tercatat pada periode ini.`}
      />

      <div className="flex flex-col gap-4">
        <AddExternalApplicationForm />

        {rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Belum ada lamaran" description="Mulai lamar lowongan atau catat lamaran manual di atas." />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Perbarui status sesuai perkembangan lamaran Anda di perusahaan (Diproses/Interview/Diterima/Ditolak).
            </p>
            <ul className="flex flex-col gap-2">
              {rows.map((app) => (
                <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {app.job_vacancies?.title ?? app.vacancy_name_external ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.job_vacancies?.company_name ?? ""}{" "}
                      {format(new Date(app.applied_at), "d MMM yyyy", { locale: idLocale })}
                    </p>
                  </div>
                  <JobApplicationStatusSelect applicationId={app.id} status={app.application_status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

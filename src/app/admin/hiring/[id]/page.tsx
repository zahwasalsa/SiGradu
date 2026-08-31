import { notFound } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, BUCKETS } from "@/lib/storage";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmploymentProofReview, BypassButton } from "./controls";
import {
  EMPLOYMENT_CURRENT_STATUS_LABELS,
  JOB_APPLICATION_STATUS_LABELS,
  type EmploymentCurrentStatus,
  type JobApplicationStatus,
} from "@/types/domain";
import type { Tables } from "@/types/database";

type StatusRow = {
  id: string;
  student_id: string;
  current_status: EmploymentCurrentStatus;
  students: { nim: string; users: { full_name: string } | null } | null;
};

type ApplicationWithVacancy = Tables<"job_applications"> & {
  application_status: JobApplicationStatus;
  job_vacancies: { title: string } | null;
};

export default async function AdminHiringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin_bkk"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("employment_status")
    .select("id, student_id, current_status, students(nim, users(full_name))")
    .eq("id", id)
    .maybeSingle();
  const employmentStatus = data as unknown as StatusRow | null;
  if (!employmentStatus) notFound();

  const [{ data: applications }, { data: proofs }, { data: bypassRow }] = await Promise.all([
    supabase
      .from("job_applications")
      .select("*, job_vacancies(title)")
      .eq("employment_status_id", id)
      .order("applied_at", { ascending: false }),
    supabase.from("employment_proofs").select("*").eq("employment_status_id", id).order("created_at", { ascending: false }),
    supabase.from("bypass_logs").select("*").eq("employment_status_id", id).maybeSingle(),
  ]);

  const proofsWithUrl = await Promise.all(
    (proofs ?? []).map(async (p) => ({ ...p, signedUrl: await getSignedUrl(supabase, BUCKETS.hiring, p.file_path) }))
  );

  return (
    <div>
      <PageHeader
        title={employmentStatus.students?.users?.full_name ?? "Detail Hiring"}
        description={`NIM ${employmentStatus.students?.nim ?? "-"}`}
        actions={
          <StatusBadge status={employmentStatus.current_status} label={EMPLOYMENT_CURRENT_STATUS_LABELS[employmentStatus.current_status]} />
        }
      />

      {/* Both panels are always shown — the student's *current* status only
          decides which path counts toward the Hiring requirement, but a
          student can switch status after already applying to jobs or
          uploading bukti kerja under a previous status. Hiding either panel
          based on current_status made that earlier data completely
          unreachable from the admin side even though it still exists. */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Bypass Syarat Hiring</CardTitle>
            {bypassRow ? (
              <StatusBadge status="approved" label="Sudah Di-bypass" />
            ) : (
              <BypassButton employmentStatusId={id} studentId={employmentStatus.student_id} />
            )}
          </CardHeader>
          {bypassRow ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Di-bypass oleh admin pada {format(new Date(bypassRow.bypassed_at), "d MMM yyyy", { locale: idLocale })}. Alasan:{" "}
                {bypassRow.reason}
              </p>
            </CardContent>
          ) : null}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Lamaran ({applications?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Status lamaran dilaporkan sendiri oleh mahasiswa (hanya mereka yang tahu hasil dari
              perusahaan) — daftar ini untuk pemantauan Admin BKK.
            </p>
            {!applications || applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada lamaran.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {(applications as unknown as ApplicationWithVacancy[]).map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                    <span>
                      {a.job_vacancies?.title ?? a.vacancy_name_external ?? "-"} ·{" "}
                      {format(new Date(a.applied_at), "d MMM yyyy", { locale: idLocale })}
                    </span>
                    <StatusBadge
                      status={a.application_status}
                      label={JOB_APPLICATION_STATUS_LABELS[a.application_status]}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bukti Kerja</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {proofsWithUrl.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada bukti kerja diunggah.</p>
            ) : (
              proofsWithUrl.map((p) => (
                <EmploymentProofReview key={p.id} proof={p} employmentStatusId={id} signedUrl={p.signedUrl} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

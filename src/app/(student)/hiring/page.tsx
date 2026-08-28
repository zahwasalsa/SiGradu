import Link from "next/link";
import { Briefcase } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress, isModule2Unlocked } from "@/lib/modules/gating";
import { PageHeader } from "@/components/shared/page-header";
import { LockedNotice } from "@/components/shared/locked-notice";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmploymentStatusForm } from "@/components/hiring/employment-status-form";
import { EmploymentProofForm } from "@/components/hiring/employment-proof-form";
import { EMPLOYMENT_PROOF_STATUS_LABELS, EMPLOYMENT_PROOF_TYPE_LABELS } from "@/types/domain";

export default async function HiringPage() {
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
        <PageHeader title="Campus Hiring & Tracer Study" />
        <LockedNotice
          title="Modul ini masih terkunci"
          description="Selesaikan Modul 1 Yudisium (berstatus Lolos Administrasi Yudisium) untuk membuka Campus Hiring & Tracer Study."
        />
      </div>
    );
  }

  const { employmentStatus, jobApplicationsCount, threshold, employmentProofs, bypassed } =
    progress.hiringTracer;

  return (
    <div>
      <PageHeader
        title="Campus Hiring & Tracer Study"
        description="Wajib bagi Calon Wisudawan sebelum dapat mendaftar wisuda."
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Pekerjaan</CardTitle>
          </CardHeader>
          <CardContent>
            <EmploymentStatusForm current={employmentStatus?.current_status ?? null} />
          </CardContent>
        </Card>

        {!employmentStatus ? null : employmentStatus.current_status === "belum_bekerja" ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Progres Lamaran Hiring</CardTitle>
              {bypassed ? <StatusBadge status="approved" label="Syarat Dilewati (Bypass Admin)" /> : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {threshold === null ? (
                <p className="text-sm text-muted-foreground">
                  Admin BKK belum menetapkan threshold minimal lamaran untuk periode ini.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {jobApplicationsCount} / {threshold} lamaran
                    </span>
                    <span className="text-muted-foreground">
                      {Math.min(100, Math.round((jobApplicationsCount / threshold) * 100))}%
                    </span>
                  </div>
                  <Progress value={Math.min(100, (jobApplicationsCount / threshold) * 100)} />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button render={<Link href="/hiring/lowongan" />} size="sm" nativeButton={false}>
                  Lihat Lowongan
                </Button>
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/hiring/lamaran" />}>
                  Lamaran Saya
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bukti Kerja</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {employmentProofs.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {employmentProofs.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{p.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {EMPLOYMENT_PROOF_TYPE_LABELS[p.proof_type]}
                        </p>
                      </div>
                      <StatusBadge status={p.status} label={EMPLOYMENT_PROOF_STATUS_LABELS[p.status]} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada bukti kerja diunggah.</p>
              )}
              <EmploymentProofForm />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tracer Study</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Setelah syarat hiring/bukti kerja terpenuhi, lengkapi Form Tracer Study.
            </p>
            <Button size="sm" nativeButton={false} render={<Link href="/tracer" />}>
              <Briefcase className="size-4" /> Buka Tracer Study
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress, isModule2Unlocked } from "@/lib/modules/gating";
import { PageHeader } from "@/components/shared/page-header";
import { LockedNotice } from "@/components/shared/locked-notice";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TracerStudyForm } from "@/components/tracer/tracer-study-form";
import { TRACER_STATUS_LABELS } from "@/types/domain";

export default async function TracerPage() {
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
        <PageHeader title="Tracer Study" />
        <LockedNotice title="Modul ini masih terkunci" description="Selesaikan Modul 1 Yudisium terlebih dahulu." />
      </div>
    );
  }

  if (!progress.hiringTracer.hiringRequirementMet) {
    return (
      <div>
        <PageHeader title="Tracer Study" />
        <LockedNotice
          title="Form Tracer Study belum terbuka"
          description="Penuhi syarat Hiring (jumlah lamaran mencapai threshold) atau unggah Bukti Kerja terverifikasi terlebih dahulu."
        />
      </div>
    );
  }

  const tracer = progress.hiringTracer.tracerStudy;
  const canEdit = !tracer || tracer.status === "draft" || tracer.status === "revision";

  return (
    <div>
      <PageHeader
        title="Form Tracer Study"
        description="Wajib diisi setiap Calon Wisudawan, termasuk yang sudah mendapat bypass syarat hiring."
        actions={tracer ? <StatusBadge status={tracer.status} label={TRACER_STATUS_LABELS[tracer.status]} /> : undefined}
      />

      {tracer?.status === "revision" && tracer.review_notes ? (
        <p className="mb-4 text-sm text-destructive">Catatan revisi: {tracer.review_notes}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Tracer Study</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <TracerStudyForm existing={tracer} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Form sudah disubmit dan sedang/telah diverifikasi Admin BKK.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

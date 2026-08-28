import Link from "next/link";
import { ArrowRight, Briefcase, FileCheck2, GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress, isModule2Unlocked, isModule3Unlocked } from "@/lib/modules/gating";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  YUDISIUM_STATUS_LABELS,
  TRACER_STATUS_LABELS,
  GRADUATION_STATUS_LABELS,
} from "@/types/domain";

export default async function StudentDashboardPage() {
  const user = await requireRole(["mahasiswa"]);
  const supabase = await createClient();

  if (!user.student) {
    return (
      <div>
        <PageHeader title={`Halo, ${user.fullName.split(" ")[0]}`} description="Lengkapi profil akademik Anda untuk mulai menggunakan Sigradu." />
        <IncompleteProfileNotice />
      </div>
    );
  }

  const progress = await getStudentProgress(supabase, {
    id: user.student.id,
    studyProgramId: user.student.studyProgramId,
  });

  const module1Status = progress.yudisium.application?.status ?? null;
  const module2Unlocked = isModule2Unlocked(progress.yudisium.application);
  const module3Unlocked = isModule3Unlocked(progress.hiringTracer.tracerStudy);

  return (
    <div>
      <PageHeader
        title={`Halo, ${user.fullName.split(" ")[0]}`}
        description={`NIM ${user.student.nim} — progres Anda menuju wisuda`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <ModuleCard
          icon={FileCheck2}
          title="1. Yudisium"
          href="/yudisium"
          status={module1Status}
          statusLabel={module1Status ? YUDISIUM_STATUS_LABELS[module1Status] : "Belum Mengajukan"}
          description="Pendaftaran yudisium & verifikasi kelayakan."
          locked={false}
        />
        <ModuleCard
          icon={Briefcase}
          title="2. Hiring & Tracer Study"
          href="/hiring"
          status={progress.hiringTracer.tracerStudy?.status ?? null}
          statusLabel={
            progress.hiringTracer.tracerStudy
              ? TRACER_STATUS_LABELS[progress.hiringTracer.tracerStudy.status]
              : "Belum Dimulai"
          }
          description="Wajib bagi Calon Wisudawan: status kerja, hiring/bukti kerja, dan tracer study."
          locked={!module2Unlocked}
          lockedReason="Terkunci sampai Yudisium berstatus Lolos Administrasi."
        />
        <ModuleCard
          icon={GraduationCap}
          title="3. Wisuda"
          href="/wisuda"
          status={progress.wisuda.registration?.status ?? null}
          statusLabel={
            progress.wisuda.registration
              ? GRADUATION_STATUS_LABELS[progress.wisuda.registration.status]
              : "Belum Dimulai"
          }
          description="Kesediaan hadir, pembayaran, dan data buku wisuda."
          locked={!module3Unlocked}
          lockedReason="Terkunci sampai Lolos Tracer & Hiring."
        />
      </div>
    </div>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  href,
  status,
  statusLabel,
  description,
  locked,
  lockedReason,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
  status: string | null;
  statusLabel: string;
  description: string;
  locked: boolean;
  lockedReason?: string;
}) {
  return (
    <Card className={locked ? "opacity-70" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {status ? (
          <StatusBadge status={status} label={statusLabel} />
        ) : (
          <StatusBadge status="draft" label={statusLabel} />
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{locked ? lockedReason : description}</p>
        {locked ? (
          <Button variant="outline" size="sm" disabled>
            Terkunci
          </Button>
        ) : (
          <Button variant="default" size="sm" render={<Link href={href} />}>
            Buka <ArrowRight className="size-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

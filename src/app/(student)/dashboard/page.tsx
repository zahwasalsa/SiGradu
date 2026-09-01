import Link from "next/link";
import { ArrowRight, Briefcase, FileCheck2, GraduationCap, Info } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress, isModule2Unlocked, isModule3Unlocked } from "@/lib/modules/gating";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DOCUMENT_TYPES } from "@/types/domain";
import {
  YUDISIUM_STATUS_LABELS,
  TRACER_STATUS_LABELS,
  GRADUATION_STATUS_LABELS,
} from "@/types/domain";

const MODULE_ACCENTS = {
  red: "bg-primary hover:bg-primary/90 text-primary-foreground",
  blue: "bg-blue-900 hover:bg-blue-950 text-white dark:bg-blue-800 dark:hover:bg-blue-900",
  purple: "bg-violet-900 hover:bg-violet-950 text-white dark:bg-violet-800 dark:hover:bg-violet-900",
} as const;

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

  // Progress fractions below are real counts (documents uploaded, requirements met),
  // not application-decision stages — a student can be fully "Lolos" while still
  // showing less than the full fraction if e.g. a document type wasn't needed.
  let module1Progress = 0;
  if (progress.yudisium.application) {
    const { data: documents } = await supabase
      .from("yudisium_documents")
      .select("document_type")
      .eq("application_id", progress.yudisium.application.id);
    module1Progress = new Set((documents ?? []).map((d) => d.document_type)).size;
  }

  const module2Progress =
    (progress.hiringTracer.hiringRequirementMet ? 1 : 0) +
    (progress.hiringTracer.tracerStudy?.status === "approved" ? 1 : 0);

  let module3PaymentVerified = false;
  let module3BookComplete = false;
  if (progress.wisuda.registration) {
    const [{ data: payment }, { data: bookData }] = await Promise.all([
      supabase
        .from("graduation_payments")
        .select("id")
        .eq("registration_id", progress.wisuda.registration.id)
        .eq("status", "verified")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("graduation_book_data")
        .select("status")
        .eq("registration_id", progress.wisuda.registration.id)
        .maybeSingle(),
    ]);
    module3PaymentVerified = !!payment;
    module3BookComplete = bookData?.status === "complete";
  }
  const module3Progress =
    (progress.wisuda.registration ? 1 : 0) +
    (module3PaymentVerified ? 1 : 0) +
    (module3BookComplete ? 1 : 0);

  const allModulesComplete =
    module1Progress === DOCUMENT_TYPES.length && module2Progress === 2 && module3Progress === 3;

  return (
    <div>
      <PageHeader
        title={`Halo, ${user.fullName.split(" ")[0]} 👋`}
        description={`NIM ${user.student.nim} — Progres Anda menuju wisuda`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <ModuleCard
          icon={FileCheck2}
          title="1. Yudisium"
          href="/yudisium"
          status={module1Status}
          statusLabel={module1Status ? YUDISIUM_STATUS_LABELS[module1Status] : "Belum Mengajukan"}
          description="Pendaftaran yudisium & verifikasi kelengkapan."
          locked={false}
          accent="red"
          progressValue={module1Progress}
          progressTotal={DOCUMENT_TYPES.length}
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
          description="Wajib bagi Calon Wisudawan untuk kerja, bidang kerja, dan tracer study."
          locked={!module2Unlocked}
          lockedReason="Terkunci sampai Yudisium berstatus Lolos Administrasi."
          accent="blue"
          progressValue={module2Progress}
          progressTotal={2}
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
          description="Konfirmasi hadir, pembayaran, dan data terkait wisuda."
          locked={!module3Unlocked}
          lockedReason="Terkunci sampai Lolos Tracer & Hiring."
          accent="purple"
          progressValue={module3Progress}
          progressTotal={3}
        />
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border bg-blue-50 px-4 py-3 text-sm sm:flex-row sm:items-center dark:bg-blue-950/40">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-blue-700 dark:text-blue-300" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">Informasi Penting</p>
            <p className="text-blue-800/80 dark:text-blue-300/80">
              {allModulesComplete
                ? "Seluruh tahapan telah diselesaikan — pantau status akhir wisuda Anda di halaman Wisuda."
                : "Pastikan seluruh tahapan di atas telah diselesaikan untuk dapat mengikuti prosesi wisuda."}
            </p>
          </div>
        </div>
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
  accent,
  progressValue,
  progressTotal,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
  status: string | null;
  statusLabel: string;
  description: string;
  locked: boolean;
  lockedReason?: string;
  accent: keyof typeof MODULE_ACCENTS;
  progressValue: number;
  progressTotal: number;
}) {
  const progressPct = progressTotal > 0 ? (progressValue / progressTotal) * 100 : 0;

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
        {!locked ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {progressValue}/{progressTotal}
              </span>
            </div>
            <Progress value={progressPct} />
          </div>
        ) : null}
        {locked ? (
          <Button variant="outline" size="sm" disabled>
            Terkunci
          </Button>
        ) : (
          <Button
            size="sm"
            className={MODULE_ACCENTS[accent]}
            nativeButton={false}
            render={<Link href={href} />}
          >
            Buka <ArrowRight className="size-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

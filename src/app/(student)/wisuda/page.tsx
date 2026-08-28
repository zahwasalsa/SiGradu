import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress, isModule3Unlocked } from "@/lib/modules/gating";
import { PageHeader } from "@/components/shared/page-header";
import { LockedNotice } from "@/components/shared/locked-notice";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttendanceChoiceForm } from "@/components/wisuda/attendance-choice-form";
import { GRADUATION_STATUS_LABELS, ATTENDANCE_CHOICE_LABELS } from "@/types/domain";

export default async function WisudaPage() {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) return <IncompleteProfileNotice />;

  const supabase = await createClient();
  const progress = await getStudentProgress(supabase, {
    id: user.student.id,
    studyProgramId: user.student.studyProgramId,
  });

  if (!isModule3Unlocked(progress.hiringTracer.tracerStudy)) {
    return (
      <div>
        <PageHeader title="Pendaftaran Wisuda" />
        <LockedNotice
          title="Modul ini masih terkunci"
          description="Selesaikan Modul 2 (Hiring & Tracer Study berstatus Lolos Tracer & Hiring) untuk membuka pendaftaran wisuda."
        />
      </div>
    );
  }

  const registration = progress.wisuda.registration;
  // Mirrors graduation_registrations_update_own's `using` clause exactly —
  // once the registration moves past these statuses (e.g. payment already
  // verified), RLS silently rejects the update (0 rows, no error), so the
  // form must stop accepting edits at the same point or a "tersimpan" toast
  // would show for a save that never actually happened.
  const canEditAttendance =
    !registration ||
    registration.status === "menunggu_kesediaan" ||
    registration.status === "menunggu_pembayaran" ||
    registration.status === "pembayaran_ditolak";

  return (
    <div>
      <PageHeader
        title="Pendaftaran Wisuda"
        actions={
          registration ? (
            <StatusBadge status={registration.status} label={GRADUATION_STATUS_LABELS[registration.status]} />
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kesediaan Mengikuti Wisuda</CardTitle>
          </CardHeader>
          <CardContent>
            {canEditAttendance ? (
              <AttendanceChoiceForm
                current={registration?.attendance_choice ?? null}
                currentNotes={registration?.attendance_notes ?? null}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Kesediaan Anda:{" "}
                <span className="font-medium text-foreground">
                  {registration?.attendance_choice ? ATTENDANCE_CHOICE_LABELS[registration.attendance_choice] : "-"}
                </span>
                . Tidak dapat diubah lagi setelah pembayaran diproses.
              </p>
            )}
          </CardContent>
        </Card>

        {registration ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Langkah Selanjutnya</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" render={<Link href="/wisuda/pembayaran" />}>
                Pembayaran Wisuda
              </Button>
              {registration.attendance_choice === "hadir" ? (
                <Button variant="outline" size="sm" render={<Link href="/wisuda/buku" />}>
                  Data Buku Wisuda
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress, isModule3Unlocked } from "@/lib/modules/gating";
import { PageHeader } from "@/components/shared/page-header";
import { LockedNotice } from "@/components/shared/locked-notice";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentUploadForm } from "@/components/wisuda/payment-upload-form";
import { PAYMENT_STATUS_LABELS } from "@/types/domain";

export default async function WisudaPembayaranPage() {
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
        <PageHeader title="Pembayaran Wisuda" />
        <LockedNotice title="Modul ini masih terkunci" description="Selesaikan Modul 2 terlebih dahulu." />
      </div>
    );
  }

  const registration = progress.wisuda.registration;
  if (!registration) {
    return (
      <div>
        <PageHeader title="Pembayaran Wisuda" />
        <p className="text-sm text-muted-foreground">Isi kesediaan wisuda terlebih dahulu di halaman Pendaftaran Wisuda.</p>
      </div>
    );
  }

  const { data: payments } = await supabase
    .from("graduation_payments")
    .select("*")
    .eq("registration_id", registration.id)
    .order("created_at", { ascending: false });

  const canUpload = registration.status === "menunggu_pembayaran" || registration.status === "pembayaran_ditolak";

  return (
    <div>
      <PageHeader title="Pembayaran Wisuda" />

      <div className="flex flex-col gap-4">
        {payments && payments.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">Rp{Number(p.amount).toLocaleString("id-ID")}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(p.payment_date), "d MMM yyyy", { locale: idLocale })} · {p.payment_method ?? "-"}
                    </p>
                    {p.rejection_reason ? (
                      <p className="mt-1 text-xs text-destructive">Alasan ditolak: {p.rejection_reason}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={p.status} label={PAYMENT_STATUS_LABELS[p.status]} />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {canUpload ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unggah Bukti Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentUploadForm />
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pembayaran sedang/telah diverifikasi Admin Keuangan.
          </p>
        )}
      </div>
    </div>
  );
}

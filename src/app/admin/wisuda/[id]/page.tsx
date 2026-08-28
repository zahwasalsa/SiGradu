import { notFound } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, BUCKETS } from "@/lib/storage";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentReviewControl, BookDataReviewControl, FinalDecisionControl } from "./controls";
import {
  GRADUATION_STATUS_LABELS,
  ATTENDANCE_CHOICE_LABELS,
  PAYMENT_STATUS_LABELS,
  BOOK_DATA_STATUS_LABELS,
  type AttendanceChoice,
  type GraduationStatus,
} from "@/types/domain";
import type { Tables } from "@/types/database";

type RegistrationDetail = {
  id: string;
  student_id: string;
  status: GraduationStatus;
  attendance_choice: AttendanceChoice | null;
  attendance_notes: string | null;
  students: { nim: string; users: { full_name: string } | null } | null;
};

export default async function AdminWisudaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["admin_keuangan", "admin_kemahasiswaan", "admin_wisuda"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("graduation_registrations")
    .select("id, student_id, status, attendance_choice, attendance_notes, students(nim, users(full_name))")
    .eq("id", id)
    .maybeSingle();
  const registration = data as unknown as RegistrationDetail | null;
  if (!registration) notFound();

  const [{ data: payments }, { data: bookData }] = await Promise.all([
    supabase
      .from("graduation_payments")
      .select("*")
      .eq("registration_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("graduation_book_data").select("*").eq("registration_id", id).maybeSingle(),
  ]);

  const latestPayment: Tables<"graduation_payments"> | undefined = payments?.[0];
  const latestPaymentUrl = latestPayment
    ? await getSignedUrl(supabase, BUCKETS.wisuda, latestPayment.proof_file_path)
    : null;
  const bookPhotoUrl = bookData ? await getSignedUrl(supabase, BUCKETS.wisuda, bookData.photo_file_path) : null;

  const canFinalize =
    user.role === "admin_wisuda" &&
    ((registration.attendance_choice === "hadir" && registration.status === "data_buku_lengkap") ||
      (registration.attendance_choice === "in_absentia" && registration.status === "pembayaran_terverifikasi"));

  return (
    <div>
      <PageHeader
        title={registration.students?.users?.full_name ?? "Detail Wisuda"}
        description={`NIM ${registration.students?.nim ?? "-"} · ${
          registration.attendance_choice ? ATTENDANCE_CHOICE_LABELS[registration.attendance_choice] : "Belum memilih"
        }`}
        actions={<StatusBadge status={registration.status} label={GRADUATION_STATUS_LABELS[registration.status]} />}
      />

      <div className="flex flex-col gap-4">
        {registration.attendance_notes ? (
          <p className="text-sm text-muted-foreground">Catatan mahasiswa: {registration.attendance_notes}</p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!latestPayment ? (
              <p className="text-sm text-muted-foreground">Belum ada bukti bayar diunggah.</p>
            ) : (
              <div className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Rp{Number(latestPayment.amount).toLocaleString("id-ID")}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(latestPayment.payment_date), "d MMM yyyy", { locale: idLocale })} ·{" "}
                      {latestPayment.payment_method ?? "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={latestPayment.status} label={PAYMENT_STATUS_LABELS[latestPayment.status]} />
                    {latestPaymentUrl ? (
                      <a href={latestPaymentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        Lihat Bukti
                      </a>
                    ) : null}
                  </div>
                </div>
                {user.role === "admin_keuangan" && latestPayment.status === "pending" ? (
                  <PaymentReviewControl
                    paymentId={latestPayment.id}
                    registrationId={registration.id}
                    studentId={registration.student_id}
                    attendanceChoice={registration.attendance_choice ?? "hadir"}
                  />
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {registration.attendance_choice === "hadir" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Buku Wisuda</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {!bookData ? (
                <p className="text-sm text-muted-foreground">Belum ada data buku wisuda diunggah.</p>
              ) : (
                <div className="flex flex-col gap-2 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{bookData.print_full_name}</p>
                      <p className="text-xs text-muted-foreground">{bookData.print_degree}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={bookData.status} label={BOOK_DATA_STATUS_LABELS[bookData.status]} />
                      {bookPhotoUrl ? (
                        <a href={bookPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          Lihat Foto
                        </a>
                      ) : null}
                    </div>
                  </div>
                  {user.role === "admin_kemahasiswaan" && bookData.status === "pending" ? (
                    <BookDataReviewControl
                      bookDataId={bookData.id}
                      registrationId={registration.id}
                      studentId={registration.student_id}
                    />
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {canFinalize ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verifikasi Akhir</CardTitle>
            </CardHeader>
            <CardContent>
              <FinalDecisionControl
                registrationId={registration.id}
                studentId={registration.student_id}
                attendanceChoice={registration.attendance_choice ?? "hadir"}
                currentStatus={registration.status}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

import { ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress, isModule3Unlocked } from "@/lib/modules/gating";
import { getSignedUrl, BUCKETS } from "@/lib/storage";
import { PageHeader } from "@/components/shared/page-header";
import { LockedNotice } from "@/components/shared/locked-notice";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookDataForm } from "@/components/wisuda/book-data-form";
import { DEGREE_LEVEL_LABELS } from "@/types/domain";

export default async function WisudaBukuPage() {
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
        <PageHeader title="Data Buku Wisuda" />
        <LockedNotice title="Modul ini masih terkunci" description="Selesaikan Modul 2 terlebih dahulu." />
      </div>
    );
  }

  const registration = progress.wisuda.registration;

  if (!registration || registration.attendance_choice !== "hadir") {
    return (
      <div>
        <PageHeader title="Data Buku Wisuda" />
        <p className="text-sm text-muted-foreground">
          Halaman ini hanya untuk mahasiswa yang memilih Bersedia Hadir pada Pendaftaran Wisuda.
        </p>
      </div>
    );
  }

  const canEdit =
    registration.status === "menunggu_data_buku" || registration.status === "revisi_data_buku";

  const { data: bookData } = await supabase
    .from("graduation_book_data")
    .select("*")
    .eq("registration_id", registration.id)
    .maybeSingle();

  const photoUrl = bookData ? await getSignedUrl(supabase, BUCKETS.wisuda, bookData.photo_file_path) : null;

  return (
    <div>
      <PageHeader
        title="Data Buku Wisuda"
        description="Foto formal dan data cetak nama & gelar untuk Buku Wisuda."
      />

      {registration.status === "menunggu_pembayaran" || registration.status === "menunggu_verifikasi_pembayaran" ? (
        <LockedNotice
          title="Belum bisa mengisi data buku wisuda"
          description="Selesaikan pembayaran wisuda dan tunggu verifikasi Admin Keuangan terlebih dahulu."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Form Data Buku Wisuda</CardTitle>
          </CardHeader>
          <CardContent>
            {bookData?.review_notes ? (
              <p className="mb-3 text-sm text-destructive">Catatan revisi: {bookData.review_notes}</p>
            ) : null}
            {photoUrl ? (
              <div className="mb-3 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                <span>Foto formal sudah diunggah</span>
                <a
                  href={photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  Lihat <ExternalLink className="size-3" />
                </a>
              </div>
            ) : null}
            {canEdit ? (
              // key forces a clean remount when `existing` goes from null to
              // a real record (e.g. right after the first successful
              // upload) — without it, defaultValue changes on the same
              // mounted instance, which Base UI's Input flags as "changing
              // the default value state of an uncontrolled FieldControl
              // after being initialized".
              <BookDataForm
                key={bookData?.id ?? "new"}
                defaultFullName={user.fullName}
                defaultDegree={DEGREE_LEVEL_LABELS[user.student.degreeLevel]}
                existing={bookData}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Data sudah disubmit dan sedang/telah diverifikasi Admin Kemahasiswaan.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

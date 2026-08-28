import Link from "next/link";
import { FileText, FolderOpen } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getActivePeriod } from "@/lib/modules/periods";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateApplicationButton } from "@/components/yudisium/create-application-button";
import { SubmitApplicationButton } from "@/components/yudisium/submit-application-button";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, YUDISIUM_STATUS_LABELS } from "@/types/domain";

export default async function YudisiumPage() {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) {
    return <IncompleteProfileNotice />;
  }

  const supabase = await createClient();
  const period = await getActivePeriod(supabase, "yudisium");

  const { data: application } = period
    ? await supabase
        .from("yudisium_applications")
        .select("*")
        .eq("student_id", user.student.id)
        .eq("period_id", period.id)
        .maybeSingle()
    : { data: null };

  const documents = application
    ? (
        await supabase
          .from("yudisium_documents")
          .select("document_type, status")
          .eq("application_id", application.id)
      ).data ?? []
    : [];

  const uploadedTypes = new Set(documents.map((d) => d.document_type));
  const canEdit = application?.status === "draft" || application?.status === "revision";

  return (
    <div>
      <PageHeader
        title="Pendaftaran Yudisium"
        description={period ? `Periode aktif: ${period.name}` : undefined}
      />

      {!period ? (
        <EmptyState
          icon={FileText}
          title="Tidak ada periode yudisium aktif"
          description="Admin belum membuka periode pendaftaran yudisium. Silakan cek kembali nanti."
        />
      ) : !application ? (
        <EmptyState
          icon={FileText}
          title="Anda belum mengajukan yudisium"
          description={`Ajukan yudisium untuk periode ${period.name} untuk memulai proses verifikasi kelulusan.`}
          action={<CreateApplicationButton />}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Status Pengajuan</CardTitle>
              <StatusBadge status={application.status} label={YUDISIUM_STATUS_LABELS[application.status]} />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {canEdit
                  ? "Lengkapi dokumen persyaratan lalu ajukan untuk diverifikasi Kaprodi dan Admin Fakultas."
                  : "Pengajuan Anda sedang diproses. Anda dapat memantau riwayat keputusan di halaman Status."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" render={<Link href="/yudisium/dokumen" />}>
                  <FolderOpen className="size-4" /> Kelola Dokumen
                </Button>
                <Button variant="outline" size="sm" render={<Link href="/yudisium/status" />}>
                  Lihat Riwayat Status
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kelengkapan Dokumen</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {DOCUMENT_TYPES.map((type) => (
                  <li
                    key={type}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{DOCUMENT_TYPE_LABELS[type]}</span>
                    {uploadedTypes.has(type) ? (
                      <StatusBadge status="approved" label="Sudah Diunggah" />
                    ) : (
                      <StatusBadge status="draft" label="Belum Diunggah" />
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {canEdit ? (
            <div className="flex justify-end">
              <SubmitApplicationButton applicationId={application.id} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

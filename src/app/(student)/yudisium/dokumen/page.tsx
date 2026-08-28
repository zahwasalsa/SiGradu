import { ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getActivePeriod } from "@/lib/modules/periods";
import { getSignedUrl, BUCKETS } from "@/lib/storage";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploadForm } from "@/components/yudisium/document-upload-form";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  type DocumentType,
} from "@/types/domain";
import type { Tables } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

async function DocumentCard({
  supabase,
  type,
  doc,
  applicationId,
  canEdit,
}: {
  supabase: SupabaseClient<Database>;
  type: DocumentType;
  doc: Tables<"yudisium_documents"> | undefined;
  applicationId: string;
  canEdit: boolean;
}) {
  const signedUrl = doc ? await getSignedUrl(supabase, BUCKETS.yudisium, doc.file_path) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{DOCUMENT_TYPE_LABELS[type]}</CardTitle>
        {doc ? (
          <StatusBadge status={doc.status} label={DOCUMENT_STATUS_LABELS[doc.status]} />
        ) : (
          <StatusBadge status="draft" label="Belum Diunggah" />
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {doc ? (
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="truncate">{doc.file_name}</span>
            {signedUrl ? (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 text-primary hover:underline"
              >
                Lihat <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
        ) : null}

        {doc?.notes ? <p className="text-sm text-destructive">Catatan verifikator: {doc.notes}</p> : null}

        {canEdit ? (
          <DocumentUploadForm applicationId={applicationId} documentType={type} />
        ) : (
          <p className="text-xs text-muted-foreground">
            Dokumen tidak dapat diubah setelah pengajuan diverifikasi.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function YudisiumDokumenPage() {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) {
    return <IncompleteProfileNotice />;
  }

  const supabase = await createClient();
  const period = await getActivePeriod(supabase, "yudisium");

  const { data: application } = period
    ? await supabase
        .from("yudisium_applications")
        .select("id, status")
        .eq("student_id", user.student.id)
        .eq("period_id", period.id)
        .maybeSingle()
    : { data: null };

  if (!application) {
    return (
      <div>
        <PageHeader title="Dokumen Yudisium" />
        <p className="text-sm text-muted-foreground">
          Anda belum memiliki pengajuan yudisium aktif. Buka halaman{" "}
          <span className="font-medium">Yudisium</span> terlebih dahulu.
        </p>
      </div>
    );
  }

  const { data: documents } = await supabase
    .from("yudisium_documents")
    .select("*")
    .eq("application_id", application.id);

  const canEdit = application.status === "draft" || application.status === "revision";

  const docByType = new Map((documents ?? []).map((d) => [d.document_type, d]));

  return (
    <div>
      <PageHeader
        title="Dokumen Yudisium"
        description="Unggah KTP, KK, Ijazah/Surat Keterangan Lulus, dan dokumen lain sesuai persyaratan."
      />

      <div className="flex flex-col gap-4">
        {DOCUMENT_TYPES.map((type) => (
          <DocumentCard
            key={type}
            supabase={supabase}
            type={type}
            doc={docByType.get(type)}
            applicationId={application.id}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
}

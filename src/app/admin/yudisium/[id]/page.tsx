import { notFound } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, BUCKETS } from "@/lib/storage";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DecisionPanel } from "./decision-form";
import { DocumentReviewRow } from "./document-review-row";
import {
  YUDISIUM_STATUS_LABELS,
  REVIEW_METHOD_LABELS,
  REVIEW_DECISION_LABELS,
  type YudisiumStatus,
} from "@/types/domain";

export default async function AdminYudisiumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["kaprodi", "admin_fakultas"]);
  const { id } = await params;
  const supabase = await createClient();

  // The hand-written Database type doesn't carry relationship metadata (see
  // src/types/database.ts), so postgrest-js can't type-check this embedded
  // select — cast the result to a manually declared shape instead.
  type StudentEmbed = {
    id: string;
    nim: string;
    thesis_title: string | null;
    supervisor_name: string | null;
    users: { full_name: string; email: string; phone_number: string | null } | null;
    study_programs: { name: string } | null;
    faculties: { name: string } | null;
  };
  type ApplicationDetail = {
    id: string;
    status: YudisiumStatus;
    submitted_at: string | null;
    created_at: string;
    updated_at: string;
    students: StudentEmbed | null;
  };

  const { data } = await supabase
    .from("yudisium_applications")
    .select(
      "*, students(id, nim, thesis_title, supervisor_name, users(full_name, email, phone_number), study_programs(name), faculties(name))"
    )
    .eq("id", id)
    .maybeSingle();
  const application = data as unknown as ApplicationDetail | null;

  if (!application) notFound();

  const student = application.students;
  if (!student) notFound();

  const [{ data: documents }, { data: reviews }] = await Promise.all([
    supabase.from("yudisium_documents").select("*").eq("application_id", id),
    supabase
      .from("yudisium_reviews")
      .select("*")
      .eq("application_id", id)
      .order("decided_at", { ascending: false }),
  ]);

  const documentsWithUrl = await Promise.all(
    (documents ?? []).map(async (doc) => ({
      ...doc,
      signedUrl: await getSignedUrl(supabase, BUCKETS.yudisium, doc.file_path),
    }))
  );

  const canDecide =
    (user.role === "kaprodi" && (application.status === "submitted" || application.status === "under_review")) ||
    (user.role === "admin_fakultas" &&
      (application.status === "under_review" || application.status === "submitted"));

  return (
    <div>
      <PageHeader
        title={student.users?.full_name ?? "Detail Pengajuan"}
        description={`NIM ${student.nim} · ${student.study_programs?.name ?? "-"} · ${student.faculties?.name ?? "-"}`}
        actions={<StatusBadge status={application.status} label={YUDISIUM_STATUS_LABELS[application.status]} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dokumen Persyaratan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {documentsWithUrl.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada dokumen diunggah.</p>
              ) : (
                documentsWithUrl.map((doc) => (
                  <DocumentReviewRow
                    key={doc.id}
                    documentId={doc.id}
                    applicationId={application.id}
                    type={doc.document_type}
                    fileName={doc.file_name}
                    status={doc.status}
                    signedUrl={doc.signedUrl}
                    editable={user.role === "admin_fakultas"}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {canDecide ? (
            <DecisionPanel
              role={user.role}
              applicationId={application.id}
              studentId={student.id}
              currentStatus={application.status}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Keputusan</CardTitle>
            </CardHeader>
            <CardContent>
              {!reviews || reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada keputusan tercatat.</p>
              ) : (
                <ol className="flex flex-col gap-4">
                  {reviews.map((review) => (
                    <li key={review.id} className="border-l-2 pl-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {review.reviewer_role === "kaprodi" ? "Kaprodi" : "Admin Fakultas"}
                        {review.decision ? (
                          <StatusBadge
                            status={review.decision === "lolos" ? "approved" : "rejected"}
                            label={REVIEW_DECISION_LABELS[review.decision]}
                          />
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.decided_at), "d MMMM yyyy, HH:mm", { locale: idLocale })} ·{" "}
                        {REVIEW_METHOD_LABELS[review.review_method]}
                      </p>
                      {review.notes ? <p className="mt-1 text-sm">{review.notes}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Data Mahasiswa</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <InfoRow label="Email" value={student.users?.email} />
            <InfoRow label="No. WhatsApp" value={student.users?.phone_number} />
            <Separator className="my-1" />
            <InfoRow label="Judul Tugas Akhir" value={student.thesis_title} />
            <InfoRow label="Dosen Pembimbing" value={student.supervisor_name} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value || "-"}</p>
    </div>
  );
}

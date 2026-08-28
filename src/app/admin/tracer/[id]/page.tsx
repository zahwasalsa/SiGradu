import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TracerReviewPanel } from "./review-panel";
import { TRACER_STATUS_LABELS } from "@/types/domain";
import type { Tables } from "@/types/database";

type TracerDetail = Tables<"tracer_studies"> & {
  students: { nim: string; users: { full_name: string } | null } | null;
};

export default async function AdminTracerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin_bkk"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("tracer_studies")
    .select("*, students(nim, users(full_name))")
    .eq("id", id)
    .maybeSingle();

  const tracer = data as unknown as TracerDetail | null;
  if (!tracer) notFound();

  return (
    <div>
      <PageHeader
        title={tracer.students?.users?.full_name ?? "Detail Tracer Study"}
        description={`NIM ${tracer.students?.nim ?? "-"}`}
        actions={<StatusBadge status={tracer.status} label={TRACER_STATUS_LABELS[tracer.status]} />}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Data Tracer Study</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Kondisi Saat Ini" value={tracer.current_condition} />
          <Field label="Nama Perusahaan/Instansi" value={tracer.company_name} />
          <Field label="Waktu Tunggu (bulan)" value={tracer.waiting_time_months?.toString() ?? null} />
          <Field label="Cara Memperoleh Pekerjaan" value={tracer.job_acquisition_method} />
          <Field label="Kesesuaian Bidang" value={tracer.field_relevance} />
          <Field label="Tingkat Penggunaan Kompetensi" value={tracer.competency_usage_level} />
          <Field label="Rentang Gaji/Pendapatan" value={tracer.salary_range} />
          <div className="sm:col-span-2">
            <Separator className="my-1" />
          </div>
          <div className="sm:col-span-2">
            <Field label="Saran/Masukan untuk Prodi" value={tracer.suggestions} />
          </div>
        </CardContent>
      </Card>

      {tracer.status === "submitted" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verifikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <TracerReviewPanel tracerId={tracer.id} studentId={tracer.student_id} currentStatus={tracer.status} />
          </CardContent>
        </Card>
      ) : tracer.review_notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catatan Verifikator</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{tracer.review_notes}</CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value || "-"}</p>
    </div>
  );
}

import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MODULE_ROLES } from "@/lib/rbac";
import { YUDISIUM_STATUS_LABELS, type YudisiumStatus } from "@/types/domain";

type Row = {
  id: string;
  status: YudisiumStatus;
  submitted_at: string | null;
  students: {
    nim: string;
    users: { full_name: string } | null;
    study_programs: { name: string } | null;
  } | null;
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireRole([...MODULE_ROLES.reports]);
  const { period } = await searchParams;
  const supabase = await createClient();

  const { data: periods } = await supabase
    .from("periods")
    .select("id, name")
    .eq("type", "yudisium")
    .order("start_date", { ascending: false });

  const activePeriodId = period ?? periods?.[0]?.id;

  let query = supabase
    .from("yudisium_applications")
    .select("id, status, submitted_at, students(nim, users(full_name), study_programs(name))")
    .order("created_at", { ascending: false });
  if (activePeriodId) query = query.eq("period_id", activePeriodId);

  const { data } = await query;
  const rows = (data as unknown as Row[] | null) ?? [];

  const summary = {
    total: rows.length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    inProgress: rows.filter((r) => !["approved", "rejected"].includes(r.status)).length,
  };

  const csvRows = rows.map((r) => ({
    NIM: r.students?.nim ?? "",
    Nama: r.students?.users?.full_name ?? "",
    "Program Studi": r.students?.study_programs?.name ?? "",
    Status: YUDISIUM_STATUS_LABELS[r.status],
  }));

  return (
    <div>
      <PageHeader
        title="Laporan Yudisium per Periode"
        actions={<ExportCsvButton rows={csvRows} filename="laporan-yudisium.csv" />}
      />

      {periods && periods.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {periods.map((p) => (
            <Link
              key={p.id}
              href={`/admin/reports?period=${p.id}`}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                p.id === activePeriodId ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {p.name}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">Belum ada periode yudisium.</p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Pendaftar" value={summary.total} />
        <SummaryCard label="Lolos Administrasi" value={summary.approved} />
        <SummaryCard label="Tidak Lolos" value={summary.rejected} />
        <SummaryCard label="Masih Dalam Proses" value={summary.inProgress} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NIM</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Program Studi</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.students?.nim ?? "-"}</TableCell>
                <TableCell>{r.students?.users?.full_name ?? "-"}</TableCell>
                <TableCell>{r.students?.study_programs?.name ?? "-"}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} label={YUDISIUM_STATUS_LABELS[r.status]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

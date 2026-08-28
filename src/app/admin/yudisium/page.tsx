import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodManager } from "@/components/admin/period-manager";
import { FileText } from "lucide-react";
import { YUDISIUM_STATUS_LABELS, type YudisiumStatus } from "@/types/domain";

/**
 * Shape returned by the embedded select below. The hand-written Database type
 * (src/types/database.ts) doesn't carry PostgREST relationship metadata, so we
 * type this query's result manually instead of fighting generic inference —
 * replace with real generated types once the live schema is confirmed.
 */
type ApplicationRow = {
  id: string;
  status: YudisiumStatus;
  submitted_at: string | null;
  created_at: string;
  students: {
    nim: string;
    users: { full_name: string } | null;
    study_programs: { name: string } | null;
  } | null;
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "submitted", label: "Diajukan" },
  { value: "under_review", label: "Ditinjau" },
  { value: "revision", label: "Revisi" },
  { value: "approved", label: "Lolos" },
  { value: "rejected", label: "Tidak Lolos" },
];

export default async function AdminYudisiumListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireRole(["kaprodi", "admin_fakultas"]);
  const { status } = await searchParams;
  const activeFilter = status && status !== "all" ? (status as YudisiumStatus) : null;

  const supabase = await createClient();

  let query = supabase
    .from("yudisium_applications")
    .select(
      "id, status, submitted_at, created_at, students(nim, users(full_name), study_programs(name))"
    )
    .order("created_at", { ascending: false });

  if (activeFilter) query = query.eq("status", activeFilter);

  const [{ data }, { data: yudisiumPeriods }] = await Promise.all([
    query,
    user.role === "admin_fakultas"
      ? supabase
          .from("periods")
          .select("id, name, start_date, end_date, is_active")
          .eq("type", "yudisium")
          .order("start_date", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);
  const applications = data as unknown as ApplicationRow[] | null;

  return (
    <div>
      <PageHeader
        title="Verifikasi Yudisium"
        description="Daftar pengajuan yudisium mahasiswa yang perlu ditinjau."
      />

      {user.role === "admin_fakultas" ? (
        <div className="mb-4">
          <PeriodManager type="yudisium" periods={yudisiumPeriods ?? []} />
        </div>
      ) : null}

      <Tabs value={status ?? "all"} className="mb-4">
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger
              key={f.value}
              value={f.value}
              nativeButton={false}
              render={
                <Link href={f.value === "all" ? "/admin/yudisium" : `/admin/yudisium?status=${f.value}`} />
              }
            >
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {!applications || applications.length === 0 ? (
        <EmptyState icon={FileText} title="Tidak ada pengajuan" description="Belum ada data pada filter ini." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIM</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Program Studi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const student = app.students;
                const studentUser = student?.users ?? null;
                const program = student?.study_programs ?? null;

                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-xs">{student?.nim ?? "-"}</TableCell>
                    <TableCell>{studentUser?.full_name ?? "-"}</TableCell>
                    <TableCell>{program?.name ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} label={YUDISIUM_STATUS_LABELS[app.status]} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/yudisium/${app.id}`} className="text-sm text-primary hover:underline">
                        Detail
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

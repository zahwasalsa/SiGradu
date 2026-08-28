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
import { ClipboardList } from "lucide-react";
import { TRACER_STATUS_LABELS, type TracerStatus } from "@/types/domain";

type Row = {
  id: string;
  status: TracerStatus;
  submitted_at: string | null;
  students: { nim: string; users: { full_name: string } | null } | null;
};

export default async function AdminTracerListPage() {
  await requireRole(["admin_bkk"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("tracer_studies")
    .select("id, status, submitted_at, students(nim, users(full_name))")
    .order("submitted_at", { ascending: false, nullsFirst: false });

  const rows = data as unknown as Row[] | null;

  return (
    <div>
      <PageHeader title="Verifikasi Tracer Study" description="Form Tracer Study yang sudah/sedang disubmit mahasiswa." />

      {!rows || rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada data" description="Belum ada Form Tracer Study yang disubmit." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIM</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.students?.nim ?? "-"}</TableCell>
                  <TableCell>{row.students?.users?.full_name ?? "-"}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} label={TRACER_STATUS_LABELS[row.status]} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/tracer/${row.id}`} className="text-sm text-primary hover:underline">
                      Detail
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

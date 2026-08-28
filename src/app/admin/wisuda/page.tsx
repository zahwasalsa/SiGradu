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
import { PeriodManager } from "@/components/admin/period-manager";
import { GraduationCap } from "lucide-react";
import {
  GRADUATION_STATUS_LABELS,
  ATTENDANCE_CHOICE_LABELS,
  type GraduationStatus,
  type AttendanceChoice,
} from "@/types/domain";

type Row = {
  id: string;
  status: GraduationStatus;
  attendance_choice: AttendanceChoice | null;
  students: { nim: string; users: { full_name: string } | null } | null;
};

export default async function AdminWisudaListPage() {
  await requireRole(["admin_keuangan", "admin_kemahasiswaan", "admin_wisuda"]);
  const supabase = await createClient();

  const [{ data }, { data: wisudaPeriods }] = await Promise.all([
    supabase
      .from("graduation_registrations")
      .select("id, status, attendance_choice, students(nim, users(full_name))")
      .order("created_at", { ascending: false }),
    supabase
      .from("periods")
      .select("id, name, start_date, end_date, is_active")
      .eq("type", "wisuda")
      .order("start_date", { ascending: false }),
  ]);

  const rows = data as unknown as Row[] | null;

  return (
    <div>
      <PageHeader title="Verifikasi Wisuda" description="Kesediaan, pembayaran, dan data buku wisuda calon wisudawan." />

      <div className="mb-4">
        <PeriodManager type="wisuda" periods={wisudaPeriods ?? []} />
      </div>

      {!rows || rows.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Belum ada data" description="Belum ada mahasiswa yang mendaftar wisuda." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIM</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kesediaan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.students?.nim ?? "-"}</TableCell>
                  <TableCell>{row.students?.users?.full_name ?? "-"}</TableCell>
                  <TableCell>{row.attendance_choice ? ATTENDANCE_CHOICE_LABELS[row.attendance_choice] : "-"}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} label={GRADUATION_STATUS_LABELS[row.status]} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/wisuda/${row.id}`} className="text-sm text-primary hover:underline">
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

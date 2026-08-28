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
import { Briefcase } from "lucide-react";
import { EMPLOYMENT_CURRENT_STATUS_LABELS, type EmploymentCurrentStatus } from "@/types/domain";

type Row = {
  id: string;
  current_status: EmploymentCurrentStatus;
  students: { nim: string; users: { full_name: string } | null } | null;
};

export default async function AdminHiringListPage() {
  await requireRole(["admin_bkk"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("employment_status")
    .select("id, current_status, students(nim, users(full_name))")
    .order("declared_at", { ascending: false });

  const rows = data as unknown as Row[] | null;

  // N+1 by design for this first pass: acceptable at current expected admin-list
  // scale, revisit with a DB view/RPC if the student count grows large.
  const enriched = await Promise.all(
    (rows ?? []).map(async (row) => {
      const [{ count: applicationsCount }, { data: bypassRow }, { data: proofs }] = await Promise.all([
        supabase
          .from("job_applications")
          .select("id", { count: "exact", head: true })
          .eq("employment_status_id", row.id),
        supabase.from("bypass_logs").select("id").eq("employment_status_id", row.id).limit(1).maybeSingle(),
        supabase
          .from("employment_proofs")
          .select("status")
          .eq("employment_status_id", row.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      return {
        ...row,
        applicationsCount: applicationsCount ?? 0,
        bypassed: !!bypassRow,
        latestProofStatus: proofs?.[0]?.status ?? null,
      };
    })
  );

  return (
    <div>
      <PageHeader title="Verifikasi Hiring" description="Monitoring status pekerjaan & syarat Hiring Calon Wisudawan." />

      {enriched.length === 0 ? (
        <EmptyState icon={Briefcase} title="Belum ada data" description="Belum ada mahasiswa yang mengisi status pekerjaan." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIM</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Status Pekerjaan</TableHead>
                <TableHead>Lamaran</TableHead>
                <TableHead>Bukti Kerja</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enriched.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.students?.nim ?? "-"}</TableCell>
                  <TableCell>{row.students?.users?.full_name ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {EMPLOYMENT_CURRENT_STATUS_LABELS[row.current_status]}
                      {row.bypassed ? <StatusBadge status="approved" label="Bypass" /> : null}
                    </div>
                  </TableCell>
                  <TableCell>{row.current_status === "belum_bekerja" ? row.applicationsCount : "-"}</TableCell>
                  <TableCell>
                    {row.latestProofStatus ? (
                      <StatusBadge status={row.latestProofStatus} label={row.latestProofStatus} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/hiring/${row.id}`} className="text-sm text-primary hover:underline">
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

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText } from "lucide-react";
import { YUDISIUM_STATUS_LABELS, type YudisiumStatus } from "@/types/domain";

export type ApplicationRow = {
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

export function YudisiumApplicationsTable({ applications }: { applications: ApplicationRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((app) => {
      const nim = app.students?.nim?.toLowerCase() ?? "";
      const name = app.students?.users?.full_name?.toLowerCase() ?? "";
      return nim.includes(q) || name.includes(q);
    });
  }, [applications, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari NIM atau Nama..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Tidak ada pengajuan"
          description={query ? "Tidak ada hasil yang cocok dengan pencarian." : "Belum ada data pada filter ini."}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIM</TableHead>
                <TableHead>Nama Mahasiswa</TableHead>
                <TableHead>Program Studi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Pengajuan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => {
                const student = app.students;
                const studentUser = student?.users ?? null;
                const program = student?.study_programs ?? null;
                const submitted = app.submitted_at ?? app.created_at;

                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-xs">{student?.nim ?? "-"}</TableCell>
                    <TableCell>{studentUser?.full_name ?? "-"}</TableCell>
                    <TableCell>{program?.name ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} label={YUDISIUM_STATUS_LABELS[app.status]} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(submitted), "dd/MM/yyyy HH:mm", { locale: idLocale })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/admin/yudisium/${app.id}`} />}
                      >
                        <Eye className="size-3.5" /> Detail
                      </Button>
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

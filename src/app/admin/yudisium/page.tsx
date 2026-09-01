import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PeriodManager } from "@/components/admin/period-manager";
import { PanduanDialog } from "@/components/shared/panduan-dialog";
import {
  YudisiumApplicationsTable,
  type ApplicationRow,
} from "@/components/admin/yudisium-applications-table";
import { type YudisiumStatus } from "@/types/domain";

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

  const [{ data }, { data: yudisiumPeriods }, { data: allStatuses }] = await Promise.all([
    query,
    user.role === "admin_fakultas"
      ? supabase
          .from("periods")
          .select("id, name, start_date, end_date, is_active")
          .eq("type", "yudisium")
          .order("start_date", { ascending: false })
      : Promise.resolve({ data: null }),
    supabase.from("yudisium_applications").select("status"),
  ]);
  const applications = (data as unknown as ApplicationRow[] | null) ?? [];

  const counts = new Map<string, number>();
  for (const row of allStatuses ?? []) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }
  const totalCount = allStatuses?.length ?? 0;

  return (
    <div>
      <PageHeader
        title="Verifikasi Yudisium"
        description="Daftar pengajuan yudisium mahasiswa yang perlu ditinjau."
        icon={ShieldCheck}
        actions={
          <PanduanDialog
            title="Panduan Verifikasi Yudisium"
            points={[
              "Gunakan tab status untuk menyaring pengajuan berdasarkan tahapannya.",
              "Klik \"Detail\" pada baris mahasiswa untuk meninjau dokumen dan menetapkan keputusan.",
              "Kolom pencarian menyaring berdasarkan NIM atau nama mahasiswa pada daftar yang sedang ditampilkan.",
            ]}
          />
        }
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
              <Badge variant="secondary" className="ml-1 px-1.5">
                {f.value === "all" ? totalCount : (counts.get(f.value) ?? 0)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <YudisiumApplicationsTable applications={applications} />
    </div>
  );
}

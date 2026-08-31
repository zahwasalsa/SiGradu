import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HiringThresholdForm } from "@/components/admin/hiring-threshold-form";
import { PeriodManager } from "@/components/admin/period-manager";
import { VacancyManager } from "@/components/admin/vacancy-manager";
import { Settings } from "lucide-react";

export default async function AdminSettingsPage() {
  await requireRole(["admin_bkk"]);
  const supabase = await createClient();

  const [
    { data: yudisiumPeriods },
    { data: studyPrograms },
    { data: thresholds },
    { data: wisudaPeriods },
    { data: vacancies },
  ] = await Promise.all([
    supabase
      .from("periods")
      .select("id, name, start_date, end_date, is_active")
      .eq("type", "yudisium")
      .order("start_date", { ascending: false }),
    supabase.from("study_programs").select("id, name").order("name"),
    supabase
      .from("hiring_thresholds")
      .select("id, min_applications, periods(name), study_programs(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("periods")
      .select("id, name, start_date, end_date, is_active")
      .eq("type", "wisuda")
      .order("start_date", { ascending: false }),
    supabase
      .from("job_vacancies")
      .select("id, title, company_name, description, is_active")
      .order("created_at", { ascending: false }),
  ]);

  type ThresholdRow = {
    id: string;
    min_applications: number;
    periods: { name: string } | null;
    study_programs: { name: string } | null;
  };
  const thresholdRows = (thresholds as unknown as ThresholdRow[] | null) ?? [];

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        description="Threshold minimal jumlah lamaran Hiring — configurable per periode/program studi (CLAUDE.md: bukan hardcode)."
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <PeriodManager type="yudisium" periods={yudisiumPeriods ?? []} />
        <PeriodManager type="wisuda" periods={wisudaPeriods ?? []} />
      </div>

      <div className="mb-4">
        <VacancyManager vacancies={vacancies ?? []} />
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Tambah / Ubah Threshold Hiring</CardTitle>
        </CardHeader>
        <CardContent>
          {!yudisiumPeriods || yudisiumPeriods.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada periode yudisium. Tambahkan periode di atas.</p>
          ) : (
            <HiringThresholdForm periods={yudisiumPeriods} studyPrograms={studyPrograms ?? []} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Threshold Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          {thresholdRows.length === 0 ? (
            <EmptyState icon={Settings} title="Belum ada threshold" description="Tambahkan threshold di atas." />
          ) : (
            <ul className="flex flex-col gap-2">
              {thresholdRows.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>
                    {t.periods?.name ?? "-"} · {t.study_programs?.name ?? "Semua Prodi"}
                  </span>
                  <span className="font-medium">{t.min_applications} lamaran</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

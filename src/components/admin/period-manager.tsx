"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { createPeriod, setPeriodActive } from "@/lib/actions/periods";
import type { PeriodType } from "@/types/domain";
import { CalendarRange } from "lucide-react";

type Period = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const TYPE_LABELS: Record<PeriodType, string> = {
  yudisium: "Periode Yudisium",
  wisuda: "Periode Wisuda",
};

export function PeriodManager({ type, periods }: { type: PeriodType; periods: Period[] }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPeriod({ type, name, startDate, endDate });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Periode berhasil dibuat dan diaktifkan.");
      setName("");
      setStartDate("");
      setEndDate("");
    });
  }

  function onToggle(period: Period) {
    setTogglingId(period.id);
    startTransition(async () => {
      const result = await setPeriodActive(period.id, type, !period.is_active);
      setTogglingId(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(period.is_active ? "Periode dinonaktifkan." : "Periode diaktifkan.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{TYPE_LABELS[type]}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={onCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {error ? (
            <Alert variant="destructive" className="sm:w-full">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`${type}-name`}>Nama Periode</Label>
            <Input
              id={`${type}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Yudisium Semester Ganjil 2026/2027"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${type}-start`}>Mulai</Label>
            <Input
              id={`${type}-start`}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${type}-end`}>Selesai</Label>
            <Input id={`${type}-end`} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Buat Periode
          </Button>
        </form>

        {periods.length === 0 ? (
          <EmptyState icon={CalendarRange} title="Belum ada periode" description="Buat periode pertama di atas." />
        ) : (
          <ul className="flex flex-col gap-2">
            {periods.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.start_date), "d MMM yyyy", { locale: idLocale })} –{" "}
                    {format(new Date(p.end_date), "d MMM yyyy", { locale: idLocale })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      p.is_active
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {p.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending && togglingId === p.id}
                    onClick={() => onToggle(p)}
                  >
                    {pending && togglingId === p.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : p.is_active ? (
                      "Nonaktifkan"
                    ) : (
                      "Aktifkan"
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

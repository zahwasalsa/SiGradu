"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertHiringThreshold } from "@/app/admin/settings/actions";

const ALL_PROGRAMS = "__all__";

export function HiringThresholdForm({
  periods,
  studyPrograms,
}: {
  periods: { id: string; name: string }[];
  studyPrograms: { id: string; name: string }[];
}) {
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [studyProgramId, setStudyProgramId] = useState<string>(ALL_PROGRAMS);
  const [minApplications, setMinApplications] = useState("5");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <div className="flex flex-col gap-2">
        <Label>Periode</Label>
        <Select
          items={periods.map((p) => ({ value: p.id, label: p.name }))}
          value={periodId}
          onValueChange={(v) => setPeriodId(v ?? "")}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Program Studi</Label>
        <Select
          items={[
            { value: ALL_PROGRAMS, label: "Semua Prodi (default)" },
            ...studyPrograms.map((p) => ({ value: p.id, label: p.name })),
          ]}
          value={studyProgramId}
          onValueChange={(v) => setStudyProgramId(v ?? ALL_PROGRAMS)}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROGRAMS}>Semua Prodi (default)</SelectItem>
            {studyPrograms.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Threshold Minimal Lamaran</Label>
        <Input
          type="number"
          min={1}
          value={minApplications}
          onChange={(e) => setMinApplications(e.target.value)}
        />
      </div>
      <div className="flex items-end">
        <Button
          className="w-full"
          disabled={pending || !periodId}
          onClick={() =>
            startTransition(async () => {
              const result = await upsertHiringThreshold({
                periodId,
                studyProgramId: studyProgramId === ALL_PROGRAMS ? null : studyProgramId,
                minApplications: Number(minApplications),
              });
              if (result.error) toast.error(result.error);
              else {
                toast.success("Threshold tersimpan.");
                router.refresh();
              }
            })
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Simpan
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitTracerStudy } from "@/app/(student)/tracer/actions";
import type { Tables } from "@/types/database";

type State = { error: string | null };
const initialState: State = { error: null };

/**
 * Several fields here (waktu tunggu, cara memperoleh kerja, kesesuaian bidang,
 * tingkat kompetensi, rentang gaji) don't have a confirmed value domain in the
 * source docs — PDF explicitly says the tracer form "dapat disesuaikan saat
 * detail teknis dirancang" (see docs/DATABASE_DESIGN.md §5.4 OPEN QUESTION).
 * They're free-text/number inputs here rather than invented dropdown options.
 */
export function TracerStudyForm({ existing }: { existing: Tables<"tracer_studies"> | null }) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    return submitTracerStudy(formData);
  }, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Kondisi Saat Ini</Label>
          <Select
            items={[
              { value: "bekerja", label: "Bekerja" },
              { value: "wirausaha", label: "Wirausaha" },
              { value: "melanjutkan_studi", label: "Melanjutkan Studi" },
              { value: "belum_bekerja", label: "Belum Bekerja" },
            ]}
            name="currentCondition"
            defaultValue={existing?.current_condition ?? "belum_bekerja"}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bekerja">Bekerja</SelectItem>
              <SelectItem value="wirausaha">Wirausaha</SelectItem>
              <SelectItem value="melanjutkan_studi">Melanjutkan Studi</SelectItem>
              <SelectItem value="belum_bekerja">Belum Bekerja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="waitingTimeMonths">Waktu Tunggu Pekerjaan Pertama (bulan)</Label>
          <Input
            id="waitingTimeMonths"
            name="waitingTimeMonths"
            type="number"
            min={0}
            defaultValue={existing?.waiting_time_months ?? undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="companyName">Nama Perusahaan/Instansi</Label>
          <Input id="companyName" name="companyName" defaultValue={existing?.company_name ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="jobAcquisitionMethod">Cara Memperoleh Pekerjaan</Label>
          <Input
            id="jobAcquisitionMethod"
            name="jobAcquisitionMethod"
            defaultValue={existing?.job_acquisition_method ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fieldRelevance">Kesesuaian Bidang Pekerjaan dengan Prodi</Label>
          <Input id="fieldRelevance" name="fieldRelevance" defaultValue={existing?.field_relevance ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="competencyUsageLevel">Tingkat Penggunaan Kompetensi Kuliah</Label>
          <Input
            id="competencyUsageLevel"
            name="competencyUsageLevel"
            defaultValue={existing?.competency_usage_level ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salaryRange">Rentang Gaji/Pendapatan Pertama</Label>
          <Input id="salaryRange" name="salaryRange" defaultValue={existing?.salary_range ?? ""} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="suggestions">Saran/Masukan untuk Program Studi</Label>
          <Textarea id="suggestions" name="suggestions" rows={3} defaultValue={existing?.suggestions ?? ""} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Submit Tracer Study
        </Button>
      </div>
    </form>
  );
}

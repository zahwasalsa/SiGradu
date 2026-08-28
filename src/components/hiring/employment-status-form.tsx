"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { declareEmploymentStatus } from "@/app/(student)/hiring/actions";
import {
  EMPLOYMENT_CURRENT_STATUSES,
  EMPLOYMENT_CURRENT_STATUS_LABELS,
  type EmploymentCurrentStatus,
} from "@/types/domain";

export function EmploymentStatusForm({ current }: { current: EmploymentCurrentStatus | null }) {
  const [value, setValue] = useState<EmploymentCurrentStatus>(current ?? "belum_bekerja");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <label className="text-sm font-medium">Status Pekerjaan Saat Ini</label>
        <Select
          items={EMPLOYMENT_CURRENT_STATUSES.map((s) => ({ value: s, label: EMPLOYMENT_CURRENT_STATUS_LABELS[s] }))}
          value={value}
          onValueChange={(v) => setValue(v as EmploymentCurrentStatus)}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_CURRENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {EMPLOYMENT_CURRENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await declareEmploymentStatus(value);
            if (result.error) toast.error(result.error);
            else {
              toast.success("Status pekerjaan tersimpan.");
              router.refresh();
            }
          })
        }
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Simpan
      </Button>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMyJobApplicationStatus } from "@/app/(student)/hiring/actions";
import { JOB_APPLICATION_STATUSES, JOB_APPLICATION_STATUS_LABELS, type JobApplicationStatus } from "@/types/domain";

/** Student self-reports the real-world outcome of their own lamaran. */
export function JobApplicationStatusSelect({
  applicationId,
  status,
}: {
  applicationId: string;
  status: JobApplicationStatus;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Select
      items={JOB_APPLICATION_STATUSES.map((s) => ({ value: s, label: JOB_APPLICATION_STATUS_LABELS[s] }))}
      value={status}
      disabled={pending}
      onValueChange={(value) => {
        if (!value || value === status) return;
        startTransition(async () => {
          const result = await updateMyJobApplicationStatus({
            applicationId,
            status: value as JobApplicationStatus,
          });
          if (result.error) toast.error(result.error);
          else toast.success("Status lamaran diperbarui.");
          router.refresh();
        });
      }}
    >
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {JOB_APPLICATION_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {JOB_APPLICATION_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

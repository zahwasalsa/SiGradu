"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setAttendanceChoice } from "@/app/(student)/wisuda/actions";
import { ATTENDANCE_CHOICES, ATTENDANCE_CHOICE_LABELS, type AttendanceChoice } from "@/types/domain";

export function AttendanceChoiceForm({
  current,
  currentNotes,
}: {
  current: AttendanceChoice | null;
  currentNotes: string | null;
}) {
  const [choice, setChoice] = useState<AttendanceChoice>(current ?? "hadir");
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <Select
        items={ATTENDANCE_CHOICES.map((c) => ({ value: c, label: ATTENDANCE_CHOICE_LABELS[c] }))}
        value={choice}
        onValueChange={(v) => setChoice(v as AttendanceChoice)}
      >
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {ATTENDANCE_CHOICES.map((c) => (
            <SelectItem key={c} value={c}>
              {ATTENDANCE_CHOICE_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {choice === "in_absentia" ? (
        <Textarea
          placeholder="Catatan/alasan (opsional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      ) : null}
      <div className="flex justify-end">
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await setAttendanceChoice(choice, notes);
              if (result.error) toast.error(result.error);
              else {
                toast.success("Kesediaan wisuda tersimpan.");
                router.refresh();
              }
            })
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Simpan Kesediaan
        </Button>
      </div>
    </div>
  );
}

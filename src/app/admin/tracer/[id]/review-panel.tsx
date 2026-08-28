"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { verifyTracerStudy } from "@/app/admin/tracer/actions";

export function TracerReviewPanel({
  tracerId,
  studentId,
  currentStatus,
}: {
  tracerId: string;
  studentId: string;
  currentStatus: string;
}) {
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(decision: "approved" | "revision") {
    startTransition(async () => {
      const result = await verifyTracerStudy({ tracerId, studentId, decision, notes, currentStatus });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Keputusan tersimpan.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Catatan verifikasi (wajib jika revisi)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={pending} onClick={() => submit("revision")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null} Minta Revisi
        </Button>
        <Button disabled={pending} onClick={() => submit("approved")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null} Setujui (Lolos Tracer & Hiring)
        </Button>
      </div>
    </div>
  );
}

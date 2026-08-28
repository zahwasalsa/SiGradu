"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  verifyPayment,
  verifyBookData,
  setFinalGraduationStatus,
} from "@/app/admin/wisuda/actions";
import type { AttendanceChoice } from "@/types/domain";

export function PaymentReviewControl({
  paymentId,
  registrationId,
  studentId,
  attendanceChoice,
}: {
  paymentId: string;
  registrationId: string;
  studentId: string;
  attendanceChoice: AttendanceChoice;
}) {
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(decision: "verified" | "rejected") {
    startTransition(async () => {
      const result = await verifyPayment({
        paymentId,
        registrationId,
        studentId,
        attendanceChoice,
        decision,
        rejectionReason: reason,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Status pembayaran diperbarui.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Textarea
        placeholder="Alasan (wajib jika ditolak)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={1}
        className="sm:flex-1"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => submit("rejected")}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} Tolak
        </Button>
        <Button size="sm" disabled={pending} onClick={() => submit("verified")}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} Verifikasi
        </Button>
      </div>
    </div>
  );
}

export function BookDataReviewControl({
  bookDataId,
  registrationId,
  studentId,
}: {
  bookDataId: string;
  registrationId: string;
  studentId: string;
}) {
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(decision: "complete" | "revision_needed") {
    startTransition(async () => {
      const result = await verifyBookData({ bookDataId, registrationId, studentId, decision, notes });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Status data buku wisuda diperbarui.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Textarea
        placeholder="Catatan (wajib jika revisi)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={1}
        className="sm:flex-1"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => submit("revision_needed")}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} Revisi
        </Button>
        <Button size="sm" disabled={pending} onClick={() => submit("complete")}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} Sesuai
        </Button>
      </div>
    </div>
  );
}

export function FinalDecisionControl({
  registrationId,
  studentId,
  attendanceChoice,
  currentStatus,
}: {
  registrationId: string;
  studentId: string;
  attendanceChoice: AttendanceChoice;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setFinalGraduationStatus({
            registrationId,
            studentId,
            attendanceChoice,
            currentStatus,
          });
          if (result.error) toast.error(result.error);
          else {
            toast.success("Status akhir wisuda ditetapkan.");
            router.refresh();
          }
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Tetapkan Status Akhir
    </Button>
  );
}

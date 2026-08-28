"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { verifyEmploymentProof, bypassHiringThreshold } from "@/app/admin/hiring/actions";
import { EMPLOYMENT_PROOF_STATUS_LABELS, EMPLOYMENT_PROOF_TYPE_LABELS } from "@/types/domain";
import type { Tables } from "@/types/database";

export function EmploymentProofReview({
  proof,
  employmentStatusId,
  signedUrl,
}: {
  proof: Tables<"employment_proofs">;
  employmentStatusId: string;
  signedUrl: string | null;
}) {
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(status: "verified" | "revision_needed") {
    startTransition(async () => {
      const result = await verifyEmploymentProof({
        proofId: proof.id,
        employmentStatusId,
        status,
        notes,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Status bukti kerja diperbarui.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{proof.company_name}</p>
          <p className="text-xs text-muted-foreground">{EMPLOYMENT_PROOF_TYPE_LABELS[proof.proof_type]}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={proof.status} label={EMPLOYMENT_PROOF_STATUS_LABELS[proof.status]} />
          {signedUrl ? (
            <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Lihat <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      </div>
      {proof.status === "pending" ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Textarea placeholder="Catatan (wajib jika revisi)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} className="sm:flex-1" />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={pending} onClick={() => submit("revision_needed")}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} Revisi
            </Button>
            <Button size="sm" disabled={pending} onClick={() => submit("verified")}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} Verifikasi
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BypassButton({ employmentStatusId, studentId }: { employmentStatusId: string; studentId: string }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Bypass Syarat Hiring
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed p-3">
      <p className="text-sm font-medium">Bypass Syarat Hiring</p>
      <p className="text-xs text-muted-foreground">
        Melewati syarat threshold lamaran/bukti kerja. Form Tracer Study tetap wajib diisi mahasiswa.
      </p>
      <Textarea placeholder="Alasan bypass (wajib)" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Batal
        </Button>
        <Button
          size="sm"
          disabled={pending || !reason.trim()}
          onClick={() =>
            startTransition(async () => {
              const result = await bypassHiringThreshold({ employmentStatusId, studentId, reason });
              if (result.error) toast.error(result.error);
              else {
                toast.success("Bypass tercatat.");
                setOpen(false);
                router.refresh();
              }
            })
          }
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} Konfirmasi Bypass
        </Button>
      </div>
    </div>
  );
}

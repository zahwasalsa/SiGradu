"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { updateDocumentStatus } from "@/app/admin/yudisium/actions";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  type DocumentType,
} from "@/types/domain";

export function DocumentReviewRow({
  documentId,
  applicationId,
  type,
  fileName,
  status,
  signedUrl,
  editable,
}: {
  documentId: string;
  applicationId: string;
  type: DocumentType;
  fileName: string;
  status: string;
  signedUrl: string | null;
  editable: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(nextStatus: "approved" | "revision_needed") {
    startTransition(async () => {
      const result = await updateDocumentStatus({
        documentId,
        applicationId,
        status: nextStatus,
        notes,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Status dokumen diperbarui.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{DOCUMENT_TYPE_LABELS[type]}</p>
          <p className="text-xs text-muted-foreground">{fileName}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} label={DOCUMENT_STATUS_LABELS[status as keyof typeof DOCUMENT_STATUS_LABELS]} />
          {signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Lihat <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      </div>

      {editable ? (
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
            <Button size="sm" disabled={pending} onClick={() => submit("approved")}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} Setujui
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

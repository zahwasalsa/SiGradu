"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadYudisiumDocument } from "@/app/(student)/yudisium/actions";
import type { DocumentType } from "@/types/domain";

type State = { error: string | null };
const initialState: State = { error: null };

export function DocumentUploadForm({
  applicationId,
  documentType,
}: {
  applicationId: string;
  documentType: DocumentType;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    const result = await uploadYudisiumDocument(formData);
    return result;
  }, initialState);

  const formRef = useRef<HTMLFormElement>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (state.error) {
      toast.error(state.error);
    } else {
      toast.success("Dokumen berhasil diunggah.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="documentType" value={documentType} />
      <Input type="file" name="file" required accept=".pdf,.jpg,.jpeg,.png" className="sm:max-w-xs" />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Unggah
      </Button>
    </form>
  );
}

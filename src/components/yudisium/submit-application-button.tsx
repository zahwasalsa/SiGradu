"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitApplication } from "@/app/(student)/yudisium/actions";

export function SubmitApplicationButton({ applicationId }: { applicationId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await submitApplication(applicationId);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Pengajuan yudisium berhasil dikirim.");
            router.refresh();
          }
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      Ajukan Sekarang
    </Button>
  );
}

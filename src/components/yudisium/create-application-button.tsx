"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDraftApplication } from "@/app/(student)/yudisium/actions";

export function CreateApplicationButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await createDraftApplication();
          if (result.error) {
            toast.error(result.error);
          } else {
            router.refresh();
          }
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      Ajukan Yudisium
    </Button>
  );
}

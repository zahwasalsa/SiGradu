"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addJobApplication } from "@/app/(student)/hiring/actions";

export function ApplyButton({ vacancyId }: { vacancyId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await addJobApplication({
            vacancyId,
            vacancyNameExternal: null,
            appliedAt: new Date().toISOString().slice(0, 10),
          });
          if (result.error) toast.error(result.error);
          else {
            toast.success("Lamaran tercatat.");
            router.refresh();
          }
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Lamar
    </Button>
  );
}

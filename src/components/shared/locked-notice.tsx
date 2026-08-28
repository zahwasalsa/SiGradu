import { Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** Shown on a module page when the sequential gate (CLAUDE.md #7/#8) isn't satisfied yet. */
export function LockedNotice({ title, description }: { title: string; description: string }) {
  return (
    <Alert>
      <Lock className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

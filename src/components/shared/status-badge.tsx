import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusTone } from "@/types/domain";

const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground border-transparent",
  info: "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-950 dark:text-blue-300",
  warning: "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950 dark:text-amber-300",
  success: "bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950 dark:text-emerald-300",
  danger: "bg-red-100 text-red-800 border-transparent dark:bg-red-950 dark:text-red-300",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone = statusTone(status);
  return <Badge className={cn("font-medium", TONE_CLASSES[tone])}>{label}</Badge>;
}

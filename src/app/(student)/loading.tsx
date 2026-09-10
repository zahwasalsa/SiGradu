import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown immediately on navigation within the student portal, while the
 * destination page's server component is still fetching data. Without this,
 * Next.js leaves the previous page frozen on screen with no feedback until
 * the new page's data is fully ready — which reads as "lambat" even when the
 * actual fetch is quick, because there's no indication anything is happening.
 */
export default function StudentSectionLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

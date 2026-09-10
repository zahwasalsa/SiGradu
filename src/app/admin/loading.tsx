import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown immediately on navigation within the admin portal, while the
 * destination page's server component is still fetching data. See the
 * matching (student)/loading.tsx for why this matters.
 */
export default function AdminSectionLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-md" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

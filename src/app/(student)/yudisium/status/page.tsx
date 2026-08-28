import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getActivePeriod } from "@/lib/modules/periods";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { IncompleteProfileNotice } from "@/components/shared/incomplete-profile-notice";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  YUDISIUM_STATUS_LABELS,
  REVIEW_METHOD_LABELS,
  REVIEW_DECISION_LABELS,
} from "@/types/domain";
import { History } from "lucide-react";

export default async function YudisiumStatusPage() {
  const user = await requireRole(["mahasiswa"]);
  if (!user.student) {
    return <IncompleteProfileNotice />;
  }

  const supabase = await createClient();
  const period = await getActivePeriod(supabase, "yudisium");

  const { data: application } = period
    ? await supabase
        .from("yudisium_applications")
        .select("*")
        .eq("student_id", user.student.id)
        .eq("period_id", period.id)
        .maybeSingle()
    : { data: null };

  if (!application) {
    return (
      <div>
        <PageHeader title="Status Yudisium" />
        <EmptyState icon={History} title="Belum ada pengajuan" description="Anda belum mengajukan yudisium pada periode ini." />
      </div>
    );
  }

  const { data: reviews } = await supabase
    .from("yudisium_reviews")
    .select("*")
    .eq("application_id", application.id)
    .order("decided_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Status Yudisium" />

      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Status Saat Ini</CardTitle>
          <StatusBadge status={application.status} label={YUDISIUM_STATUS_LABELS[application.status]} />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Keputusan</CardTitle>
        </CardHeader>
        <CardContent>
          {!reviews || reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada keputusan tercatat.</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {reviews.map((review) => (
                <li key={review.id} className="border-l-2 pl-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {review.reviewer_role === "kaprodi" ? "Kaprodi" : "Admin Fakultas"}
                    {review.decision ? (
                      <StatusBadge
                        status={review.decision === "lolos" ? "approved" : "rejected"}
                        label={REVIEW_DECISION_LABELS[review.decision]}
                      />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.decided_at), "d MMMM yyyy, HH:mm", { locale: idLocale })} ·{" "}
                    {REVIEW_METHOD_LABELS[review.review_method]}
                  </p>
                  {review.notes ? <p className="mt-1 text-sm">{review.notes}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

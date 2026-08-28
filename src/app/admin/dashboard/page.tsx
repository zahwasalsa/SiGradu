import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { canAccessModule } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_ROLES, ROLE_LABELS } from "@/types/domain";

export default async function AdminDashboardPage() {
  const user = await requireRole([...ADMIN_ROLES]);
  const supabase = await createClient();

  const cards: { label: string; value: number }[] = [];

  if (canAccessModule(user.role, "yudisium")) {
    const [{ count: submitted }, { count: approved }] = await Promise.all([
      supabase.from("yudisium_applications").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
      supabase.from("yudisium_applications").select("id", { count: "exact", head: true }).eq("status", "approved"),
    ]);
    cards.push(
      { label: "Yudisium Perlu Ditinjau", value: submitted ?? 0 },
      { label: "Lolos Administrasi Yudisium", value: approved ?? 0 }
    );
  }

  if (canAccessModule(user.role, "hiring_tracer")) {
    const [{ count: tracerSubmitted }, { count: tracerApproved }] = await Promise.all([
      supabase.from("tracer_studies").select("id", { count: "exact", head: true }).eq("status", "submitted"),
      supabase.from("tracer_studies").select("id", { count: "exact", head: true }).eq("status", "approved"),
    ]);
    cards.push(
      { label: "Tracer Study Perlu Diverifikasi", value: tracerSubmitted ?? 0 },
      { label: "Lolos Tracer & Hiring", value: tracerApproved ?? 0 }
    );
  }

  if (canAccessModule(user.role, "wisuda")) {
    const [{ count: pendingPayment }, { count: graduated }] = await Promise.all([
      supabase
        .from("graduation_registrations")
        .select("id", { count: "exact", head: true })
        .eq("status", "menunggu_verifikasi_pembayaran"),
      supabase
        .from("graduation_registrations")
        .select("id", { count: "exact", head: true })
        .in("status", ["terdaftar_sebagai_wisudawan", "wisuda_in_absentia"]),
    ]);
    cards.push(
      { label: "Pembayaran Perlu Diverifikasi", value: pendingPayment ?? 0 },
      { label: "Wisudawan Terdaftar", value: graduated ?? 0 }
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" description={`Masuk sebagai ${ROLE_LABELS[user.role]}`} />

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada ringkasan untuk role Anda.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { adminNavItems } from "@/components/layout/nav-config";
import { ADMIN_ROLES } from "@/types/domain";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([...ADMIN_ROLES]);

  return (
    <AppShell
      portalName="Portal Admin"
      navItems={adminNavItems(user.role)}
      user={{ fullName: user.fullName, email: user.email, role: user.role }}
    >
      {children}
    </AppShell>
  );
}

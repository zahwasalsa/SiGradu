import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { studentNavItems } from "@/components/layout/nav-config";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["mahasiswa"]);

  return (
    <AppShell
      portalName="Portal Mahasiswa"
      navItems={studentNavItems()}
      user={{ fullName: user.fullName, email: user.email, role: user.role }}
    >
      {children}
    </AppShell>
  );
}

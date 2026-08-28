import type { UserRole } from "@/types/domain";
import { canAccessModule } from "@/lib/rbac";

/**
 * Plain, serializable icon key — NOT the Lucide component itself.
 *
 * studentNavItems()/adminNavItems() are called from Server Components
 * ((student)/layout.tsx, admin/layout.tsx) and the resulting NavItem[] is
 * passed as a prop into <AppShell>, a Client Component. React Server
 * Components can only pass serializable data across that boundary — a
 * function/component reference is not serializable ("Functions cannot be
 * passed directly to Client Components"). The string key here is resolved to
 * an actual icon component only client-side, in nav-icons.ts, which is only
 * ever imported by sidebar-nav.tsx (a Client Component) — never passed as a
 * prop from a Server Component.
 */
export type IconKey =
  | "dashboard"
  | "yudisium"
  | "hiring"
  | "tracer"
  | "wisuda"
  | "reports"
  | "settings";

export type NavItem = {
  label: string;
  href: string;
  icon: IconKey;
  children?: { label: string; href: string }[];
};

export function studentNavItems(): NavItem[] {
  return [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    {
      label: "Yudisium",
      href: "/yudisium",
      icon: "yudisium",
      children: [
        { label: "Pengajuan", href: "/yudisium" },
        { label: "Dokumen", href: "/yudisium/dokumen" },
        { label: "Status", href: "/yudisium/status" },
      ],
    },
    {
      label: "Campus Hiring",
      href: "/hiring",
      icon: "hiring",
      children: [
        { label: "Status Pekerjaan", href: "/hiring" },
        { label: "Lowongan", href: "/hiring/lowongan" },
        { label: "Lamaran Saya", href: "/hiring/lamaran" },
      ],
    },
    { label: "Tracer Study", href: "/tracer", icon: "tracer" },
    {
      label: "Wisuda",
      href: "/wisuda",
      icon: "wisuda",
      children: [
        { label: "Pendaftaran", href: "/wisuda" },
        { label: "Pembayaran", href: "/wisuda/pembayaran" },
        { label: "Buku Wisuda", href: "/wisuda/buku" },
      ],
    },
  ];
}

export function adminNavItems(role: UserRole): NavItem[] {
  const items: NavItem[] = [
    { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  ];

  if (canAccessModule(role, "yudisium")) {
    items.push({ label: "Yudisium", href: "/admin/yudisium", icon: "yudisium" });
  }
  if (canAccessModule(role, "hiring_tracer")) {
    items.push(
      { label: "Hiring", href: "/admin/hiring", icon: "hiring" },
      { label: "Tracer Study", href: "/admin/tracer", icon: "tracer" }
    );
  }
  if (canAccessModule(role, "wisuda")) {
    items.push({ label: "Wisuda", href: "/admin/wisuda", icon: "wisuda" });
  }
  if (canAccessModule(role, "reports")) {
    items.push({ label: "Laporan", href: "/admin/reports", icon: "reports" });
  }
  if (canAccessModule(role, "settings")) {
    items.push({ label: "Pengaturan", href: "/admin/settings", icon: "settings" });
  }

  return items;
}

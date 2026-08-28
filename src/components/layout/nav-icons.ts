import {
  LayoutDashboard,
  FileCheck2,
  Briefcase,
  ClipboardList,
  GraduationCap,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "./nav-config";

/**
 * Resolves the plain `IconKey` strings from nav-config.ts to actual Lucide
 * icon components. Deliberately its own module, imported only by
 * sidebar-nav.tsx (a Client Component) — icon component references must
 * never cross the Server -> Client props boundary as plain data (that was
 * the bug this file fixes; see nav-config.ts for the full explanation).
 */
export const NAV_ICONS: Record<IconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  yudisium: FileCheck2,
  hiring: Briefcase,
  tracer: ClipboardList,
  wisuda: GraduationCap,
  reports: BarChart3,
  settings: Settings,
};

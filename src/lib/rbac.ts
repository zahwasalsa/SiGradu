import type { UserRole } from "@/types/domain";

/**
 * Which admin roles may access each admin module route. Based on
 * docs/ROLES_PERMISSIONS.md and PDF §6 ("Peran Admin per Modul").
 *
 * OPEN QUESTION (docs/DATABASE_DESIGN.md §9.2): no role owns `/admin/settings`
 * in the source docs. It is scoped to admin_bkk here because the only concrete
 * configurable parameter documented so far (hiring threshold) is Admin BKK's
 * responsibility — confirm before relying on this for anything more sensitive.
 */
export const MODULE_ROLES = {
  yudisium: ["kaprodi", "admin_fakultas"],
  hiring_tracer: ["admin_bkk"],
  wisuda: ["admin_keuangan", "admin_kemahasiswaan", "admin_wisuda"],
  reports: ["admin_fakultas", "admin_bkk", "admin_keuangan", "admin_kemahasiswaan", "admin_wisuda"],
  settings: ["admin_bkk"],
} as const satisfies Record<string, UserRole[]>;

export type AdminModule = keyof typeof MODULE_ROLES;

export function canAccessModule(role: UserRole, module: AdminModule): boolean {
  return (MODULE_ROLES[module] as readonly UserRole[]).includes(role);
}

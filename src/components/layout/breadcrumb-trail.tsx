"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { NavItem } from "./nav-config";

function findCrumbs(pathname: string, items: NavItem[]): { label: string; href: string }[] {
  for (const item of items) {
    const isSection = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!isSection) continue;

    const child = item.children?.find((c) => pathname === c.href);
    if (child && child.href !== item.href) {
      return [{ label: item.label, href: item.href }, { label: child.label, href: child.href }];
    }

    return [{ label: item.label, href: item.href }];
  }
  return [];
}

export function BreadcrumbTrail({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const crumbs = findCrumbs(pathname, items);

  if (crumbs.length === 0) return null;

  return (
    <nav className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={`${i}-${crumb.href}`} className="flex items-center gap-1.5">
          {i > 0 ? <ChevronRight className="size-3.5 shrink-0" /> : null}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="transition-colors hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

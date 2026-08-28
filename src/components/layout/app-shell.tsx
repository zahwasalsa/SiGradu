"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import type { NavItem } from "./nav-config";
import type { UserRole } from "@/types/domain";

export function AppShell({
  portalName,
  navItems,
  user,
  children,
}: {
  portalName: string;
  navItems: NavItem[];
  user: { fullName: string; email: string; role: UserRole };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Sigradu</p>
            <p className="text-xs text-muted-foreground">{portalName}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav items={navItems} />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2 text-left">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Sigradu</p>
                <p className="text-xs font-normal text-muted-foreground">{portalName}</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav items={navItems} onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-svh flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-card px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="size-5" />
            </Button>
            <Link href="/" className="text-sm font-medium md:hidden">
              Sigradu
            </Link>
          </div>

          <UserMenu fullName={user.fullName} email={user.email} role={user.role} />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

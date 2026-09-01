"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifikasi" />}
      >
        <Bell className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
        </DropdownMenuGroup>
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">Belum ada notifikasi baru.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABELS, type UserRole } from "@/types/domain";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu({
  fullName,
  email,
  role,
}: {
  fullName: string;
  email: string;
  role: UserRole;
}) {
  const profileHref = role === "mahasiswa" ? "/profile" : "/admin/profile";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-2 px-2" />}>
        <Avatar className="size-7">
          <AvatarFallback className="text-xs">{initials(fullName) || <User className="size-4" />}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline">{fullName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* MenuPrimitive.GroupLabel (what DropdownMenuLabel wraps) requires a
            Menu.Group/Menu.RadioGroup ancestor — omitting it throws "Base UI:
            MenuGroupContext is missing" as soon as the menu opens. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{fullName}</span>
            <span className="text-xs font-normal text-muted-foreground">{email}</span>
            <span className="text-xs font-normal text-muted-foreground">{ROLE_LABELS[role]}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* render target is <Link> (an <a>), not a <button> — nativeButton
            must be false or Base UI applies button-only a11y attributes
            (role, aria-disabled) to a non-button element and warns. */}
        <DropdownMenuItem
          nativeButton={false}
          render={<Link href={profileHref} className="w-full cursor-pointer" />}
        >
          <User className="size-4" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* nativeButton defaults to false on Menu.Item — must be set true
            here since the render target IS a real <button>, or Base UI
            throws "expected a non-<button>" on every menu open. */}
        <form action={signOutAction}>
          <DropdownMenuItem
            nativeButton
            render={<button type="submit" className="w-full cursor-pointer text-left" />}
          >
            <LogOut className="size-4" />
            Keluar
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

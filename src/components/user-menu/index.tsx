"use client";

import { LayoutDashboardIcon, LogOutIcon, UserIcon } from "lucide-react";
import Link from "next/link";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import { Button } from "@/components/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/primitives/dropdown-menu";
import { signOutAction } from "@/features/auth/actions";
import { initials } from "@/lib/display";

interface UserMenuProps {
  fullName: string | null;
  email: string | null;
  showAdminLink?: boolean;
  showAccountLink?: boolean;
  avatarUrl?: string | null;
}

export function UserMenu({
  fullName,
  email,
  showAdminLink = false,
  showAccountLink = false,
  avatarUrl,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer focus:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 active:ring-0"
        >
          <Avatar className="size-9">
            <AvatarImage
              src={avatarUrl ?? ""}
              alt={`${fullName ?? "User"}'s avatar`}
            />
            <AvatarFallback className="grid size-9 place-items-center bg-zs-raised font-data text-xs font-bold text-zs-lime">
              {initials(fullName, email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-medium">{fullName ?? "Account"}</span>
          {email ? (
            <span className="text-xs font-normal text-muted-foreground">
              {email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showAccountLink ? (
          <DropdownMenuItem asChild>
            <Link href="/account">
              <UserIcon />
              My account
            </Link>
          </DropdownMenuItem>
        ) : null}

        {showAdminLink ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <LayoutDashboardIcon />
              Admin console
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <form action={signOutAction} className="w-full">
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOutIcon />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

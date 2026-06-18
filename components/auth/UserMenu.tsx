"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

export function UserMenu({
  displayName,
  email,
  avatarUrl,
}: {
  displayName: string;
  email?: string;
  avatarUrl?: string;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-full border bg-card px-3 py-2 text-left shadow-sm transition-colors hover:bg-muted/40"
        >
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>
              {displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{displayName}</p>
            <p className="truncate text-muted-foreground">{email}</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate">{displayName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile page</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.refresh();
            router.push("/");
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

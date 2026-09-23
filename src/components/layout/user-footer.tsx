"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types/database";

type UserFooterProps = {
  profile: Pick<User, "name" | "email" | "avatar_url">;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserFooter({ profile }: UserFooterProps) {
  const router = useRouter();
  const clearUser = useAuthStore((state) => state.clearUser);

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    clearUser();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-2 mb-2 flex items-center gap-2 rounded-xl border border-border/40 bg-background/60 px-2 py-2.5 backdrop-blur-sm">
      <Avatar size="sm" className="ring-1 ring-brand/15">
        {profile.avatar_url ? (
          <AvatarImage src={profile.avatar_url} alt={profile.name} />
        ) : null}
        <AvatarFallback className="bg-brand/10 text-[10px] text-brand">
          {getInitials(profile.name) || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          {profile.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
      </div>
      <ThemeToggle />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleSignOut}
        aria-label="Sair"
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut className="size-3.5" />
      </Button>
    </div>
  );
}

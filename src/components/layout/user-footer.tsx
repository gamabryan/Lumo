"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { PresenceStatusMenu } from "@/components/presence/presence-status-menu";
import { UserStatusAvatar } from "@/components/presence/user-status-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { PresenceStatus, User } from "@/types/database";

type UserFooterProps = {
  profile: Pick<User, "id" | "name" | "email" | "avatar_url"> & {
    presence_status?: PresenceStatus | null;
  };
};

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
      <UserStatusAvatar
        userId={profile.id}
        name={profile.name}
        avatarUrl={profile.avatar_url}
        size="sm"
        className="ring-1 ring-brand/15"
        fallbackClassName="bg-brand/10 text-[10px] text-brand"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          {profile.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
      </div>
      <PresenceStatusMenu initialStatus={profile.presence_status} />
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

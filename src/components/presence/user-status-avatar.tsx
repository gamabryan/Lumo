"use client";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { PRESENCE_DOT_CLASS, PRESENCE_LABELS } from "@/lib/presence";
import { cn } from "@/lib/utils";
import { usePresenceStatus } from "@/stores/presence-store";

type UserStatusAvatarProps = {
  userId?: string | null;
  name: string;
  avatarUrl?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
  fallbackClassName?: string;
  showStatus?: boolean;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserStatusAvatar({
  userId,
  name,
  avatarUrl,
  size = "sm",
  className,
  fallbackClassName,
  showStatus = true,
}: UserStatusAvatarProps) {
  const presence = usePresenceStatus(userId);

  return (
    <Avatar size={size} className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className={fallbackClassName}>
        {getInitials(name) || "U"}
      </AvatarFallback>
      {showStatus ? (
        <AvatarBadge
          title={PRESENCE_LABELS[presence]}
          aria-label={PRESENCE_LABELS[presence]}
          className={cn(
            "border-0 text-transparent ring-2 ring-background",
            PRESENCE_DOT_CLASS[presence]
          )}
        />
      ) : null}
    </Avatar>
  );
}

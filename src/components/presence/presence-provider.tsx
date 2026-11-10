"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { normalizePresenceStatus } from "@/lib/presence";
import { createClient } from "@/lib/supabase/client";
import { usePresenceStore } from "@/stores/presence-store";
import type { PresenceStatus } from "@/types/database";

type PresenceProviderProps = {
  workspaceId: string;
  userId: string;
  status: PresenceStatus;
};

export function PresenceProvider({
  workspaceId,
  userId,
  status,
}: PresenceProviderProps) {
  const setOnline = usePresenceStore((state) => state.setOnline);
  const reset = usePresenceStore((state) => state.reset);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const statusRef = useRef(status);

  statusRef.current = status;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`workspace-presence:${workspaceId}`, {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    function syncOnline() {
      const state = channel.presenceState<{ status?: string }>();
      const online: Record<string, PresenceStatus> = {};

      for (const [key, entries] of Object.entries(state)) {
        const latest = entries[entries.length - 1];
        online[key] = normalizePresenceStatus(latest?.status);
      }

      setOnline(online);
    }

    channel
      .on("presence", { event: "sync" }, syncOnline)
      .subscribe((channelStatus) => {
        if (channelStatus === "SUBSCRIBED") {
          void channel.track({ status: statusRef.current });
        }
      });

    return () => {
      channelRef.current = null;
      reset();
      void supabase.removeChannel(channel);
    };
  }, [workspaceId, userId, setOnline, reset]);

  useEffect(() => {
    void channelRef.current?.track({ status });
  }, [status]);

  return null;
}

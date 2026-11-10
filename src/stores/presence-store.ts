import { create } from "zustand";
import type { PresenceStatus } from "@/types/database";

type PresenceState = {
  /** Status de quem está com o app aberto agora, por user id */
  online: Record<string, PresenceStatus>;
  setOnline: (online: Record<string, PresenceStatus>) => void;
  reset: () => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  online: {},
  setOnline: (online) => set({ online }),
  reset: () => set({ online: {} }),
}));

export function usePresenceStatus(
  userId: string | null | undefined
): PresenceStatus {
  return usePresenceStore((state) =>
    userId ? (state.online[userId] ?? "offline") : "offline"
  );
}

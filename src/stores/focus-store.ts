import { create } from "zustand";

type FocusState = {
  focusModeUntil: string | null;
  setFocusModeUntil: (value: string | null) => void;
  isFocusActive: () => boolean;
};

export const useFocusStore = create<FocusState>((set, get) => ({
  focusModeUntil: null,
  setFocusModeUntil: (value) => set({ focusModeUntil: value }),
  isFocusActive: () => {
    const until = get().focusModeUntil;
    if (!until) return false;
    return new Date(until).getTime() > Date.now();
  },
}));

export function isFocusModeActive(focusModeUntil: string | null) {
  if (!focusModeUntil) return false;
  return new Date(focusModeUntil).getTime() > Date.now();
}

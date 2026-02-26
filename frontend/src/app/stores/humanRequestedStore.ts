import { create } from 'zustand';
import type { HumanRequestedPayload } from '../components/HumanRequestedModal';

interface HumanRequestedState {
  payload: HumanRequestedPayload | null;
  takeoverChatId: string | null;
  /** When true, takeover is from AI handover - skip confirmation modal */
  takeoverFromAi: boolean;
  setPayload: (payload: HumanRequestedPayload | null) => void;
  setTakeoverChatId: (chatId: string | null) => void;
  setTakeoverFromAi: (fromAi: boolean) => void;
  clear: () => void;
  clearTakeover: () => void;
}

export const useHumanRequestedStore = create<HumanRequestedState>((set) => ({
  payload: null,
  takeoverChatId: null,
  takeoverFromAi: false,
  setPayload: (payload) => set({ payload }),
  setTakeoverChatId: (takeoverChatId) => set({ takeoverChatId }),
  setTakeoverFromAi: (takeoverFromAi) => set({ takeoverFromAi }),
  clear: () => set({ payload: null }),
  clearTakeover: () => set({ takeoverChatId: null, takeoverFromAi: false }),
}));

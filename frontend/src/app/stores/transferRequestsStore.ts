import { create } from 'zustand';
import type { TransferRequest } from '../components/TransferRequestsDialog';
import type { HumanRequestedPayload } from '../components/HumanRequestedModal';

function getInitials(name: string): string {
  if (!name || name === 'Guest') return 'G';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function humanRequestedToTransferRequest(p: HumanRequestedPayload): TransferRequest {
  const name = p.customer_name || 'Guest';
  return {
    id: `human-${p.chat_id}`,
    customerId: '',
    customerName: name,
    customerAvatar: getInitials(name),
    chatId: p.chat_id,
    fromAgentId: 'ai',
    fromAgentName: 'AI Agent',
    fromAgentAvatar: 'AI',
    reason: 'Customer requested human assistance',
    timestamp: 'Just now',
    projectId: p.project_id,
    projectName: p.project_name,
  };
}

interface TransferRequestsState {
  requests: TransferRequest[];
  pendingHumanRequests: HumanRequestedPayload[];
  dialogOpen: boolean;
  refreshFn: (() => void) | null;
  setRequests: (r: TransferRequest[]) => void;
  addHumanRequested: (p: HumanRequestedPayload) => void;
  removeHumanRequested: (chatId: string) => void;
  setDialogOpen: (open: boolean) => void;
  setRefreshFn: (fn: (() => void) | null) => void;
}

export const useTransferRequestsStore = create<TransferRequestsState>((set) => ({
  requests: [],
  pendingHumanRequests: [],
  dialogOpen: false,
  refreshFn: null,
  setRequests: (requests) => set({ requests }),
  addHumanRequested: (p) =>
    set((s) => ({
      pendingHumanRequests: [
        ...s.pendingHumanRequests.filter((x) => x.chat_id !== p.chat_id),
        p,
      ],
      dialogOpen: true,
    })),
  removeHumanRequested: (chatId) =>
    set((s) => ({
      pendingHumanRequests: s.pendingHumanRequests.filter((x) => x.chat_id !== chatId),
    })),
  setDialogOpen: (open) => set({ dialogOpen: open }),
  setRefreshFn: (refreshFn) => set({ refreshFn }),
}));

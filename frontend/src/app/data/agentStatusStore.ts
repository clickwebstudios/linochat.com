import { useSyncExternalStore } from 'react';

// Initial statuses from mock data
const initialStatuses: Record<string, string> = {
  '1': 'Active',
  '2': 'Active',
  '3': 'Away',
  '4': 'Active',
  '5': 'Offline',
  '6': 'Invited',
};

let statuses = { ...initialStatuses };
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export const agentStatusStore = {
  getSnapshot(): Record<string, string> {
    return statuses;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setStatus(agentId: string, status: string) {
    statuses = { ...statuses, [agentId]: status };
    emitChange();
  },
};

export function useAgentStatuses() {
  const snapshot = useSyncExternalStore(
    agentStatusStore.subscribe,
    agentStatusStore.getSnapshot
  );
  return snapshot;
}

export function useAgentStatus(agentId: string) {
  const statuses = useAgentStatuses();
  return statuses[agentId] ?? 'Offline';
}
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { initEcho, disconnectEcho } from '../lib/echo';
import { useAuthStore } from '../stores/authStore';
import { playNotificationSound } from '../lib/notificationSound';
import type { TransferRequest } from '../components/TransferRequestsDialog';
import type { HumanRequestedPayload } from '../components/HumanRequestedModal';

/** Fallback poll interval when Reverb is not connected */
const FALLBACK_POLL_MS = 30_000;
/** Poll interval when modal is open (backup for WebSocket) */
const MODAL_OPEN_POLL_MS = 5_000;

export function useTransferRequests(options?: {
  onNewRequest?: () => void;
  onHumanRequested?: (payload: HumanRequestedPayload) => void;
  /** Project IDs to subscribe to for human.requested (project members receive it) */
  projectIds?: string[];
  /** When true, poll more frequently for near real-time updates (e.g. when modal is open) */
  modalOpen?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const onNewRequestRef = useRef(options?.onNewRequest);
  onNewRequestRef.current = options?.onNewRequest;
  const onHumanRequestedRef = useRef(options?.onHumanRequested);
  onHumanRequestedRef.current = options?.onHumanRequested;

  const fetchRequests = useCallback(async () => {
    try {
      const response = await api.get<TransferRequest[]>('/agent/transfer-requests');
      if (response.success && Array.isArray(response.data)) {
        setRequests(response.data);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + Reverb subscription + polling fallback for real-time updates
  useEffect(() => {
    if (!user?.id) {
      setRequests([]);
      setLoading(false);
      return;
    }

    fetchRequests();

    let cleanup: (() => void) | undefined;

    const echo = initEcho();
    if (echo) {
      const channel = echo.private(`agent.${user.id}`);
      channel.listen('.transfer.requested', (data: TransferRequest) => {
        setRequests((prev) => {
          if (prev.some((r) => r.id === data.id)) return prev;
          playNotificationSound();
          onNewRequestRef.current?.();
          return [data, ...prev];
        });
      });
      const handleHumanRequested = (payload: HumanRequestedPayload) => {
        playNotificationSound();
        onHumanRequestedRef.current?.(payload);
        onNewRequestRef.current?.();
      };
      channel.listen('.human.requested', handleHumanRequested);

      const projectChannels: string[] = [];
      (options?.projectIds ?? []).forEach((projectId) => {
        const projectChannel = echo.private(`project.${projectId}`);
        projectChannel.listen('.human.requested', handleHumanRequested);
        projectChannel.listen('.transfer.resolved', (data: { transfer_id: string }) => {
          setRequests((prev) => prev.filter((r) => r.id !== data.transfer_id));
        });
        projectChannels.push(`project.${projectId}`);
      });

      cleanup = () => {
        channel.stopListening('.transfer.requested');
        channel.stopListening('.human.requested');
        echo.leave(`agent.${user.id}`);
        projectChannels.forEach((ch) => echo.leave(ch));
      };
    }

    // Polling: when modal is open poll every 5s; otherwise every 30s as fallback when WebSocket may not work
    const pollMs = options?.modalOpen ? MODAL_OPEN_POLL_MS : FALLBACK_POLL_MS;
    const interval = setInterval(fetchRequests, pollMs);

    return () => {
      cleanup?.();
      clearInterval(interval);
    };
  }, [user?.id, fetchRequests, options?.projectIds?.join(','), options?.modalOpen]);

  // Disconnect Echo on logout
  useEffect(() => {
    if (!user) {
      disconnectEcho();
    }
  }, [user]);

  const acceptTransfer = useCallback(async (requestId: string, notes: string) => {
    try {
      await api.post(`/agent/transfer-requests/${requestId}/accept`, { notes });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      return true;
    } catch {
      return false;
    }
  }, []);

  const rejectTransfer = useCallback(async (requestId: string, notes: string) => {
    try {
      await api.post(`/agent/transfer-requests/${requestId}/reject`, { notes });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { requests, loading, acceptTransfer, rejectTransfer, refresh: fetchRequests };
}

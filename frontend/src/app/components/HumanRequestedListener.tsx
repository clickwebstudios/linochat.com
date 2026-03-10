import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTransferRequests } from '../hooks/useTransferRequests';
import {
  useTransferRequestsStore,
  humanRequestedToTransferRequest,
} from '../stores/transferRequestsStore';
import { useHumanRequestedStore } from '../stores/humanRequestedStore';
import { useProjectsStore } from '../stores/projectsStore';
import { TransferRequestsDialog } from './TransferRequestsDialog';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';

const HANDOVER_POLL_MS = 5_000;
const DISMISSED_KEY = 'lc_dismissed_handovers';
const DISMISSED_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getDismissedHandovers(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const parsed: { id: string; ts: number }[] = JSON.parse(raw);
    const cutoff = Date.now() - DISMISSED_TTL_MS;
    return new Set(parsed.filter((e) => e.ts > cutoff).map((e) => e.id));
  } catch {
    return new Set();
  }
}

function dismissHandover(chatId: string) {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed: { id: string; ts: number }[] = raw ? JSON.parse(raw) : [];
    const cutoff = Date.now() - DISMISSED_TTL_MS;
    const fresh = parsed.filter((e) => e.ts > cutoff && e.id !== chatId);
    fresh.push({ id: chatId, ts: Date.now() });
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(fresh));
  } catch {}
}

/**
 * Listens for human.requested and transfer.requested events.
 * Shows Chat Transfer Requests dialog (Figma design) on any agent/admin page.
 */
export function HumanRequestedListener() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setTakeoverChatId, setTakeoverFromAi } = useHumanRequestedStore();
  const {
    setRequests,
    addHumanRequested,
    removeHumanRequested,
    dialogOpen,
    setDialogOpen,
    setRefreshFn,
    pendingHumanRequests,
  } = useTransferRequestsStore();
  const projects = useProjectsStore((s) => s.projects);
  const fetchProjects = useProjectsStore((s) => s.fetchProjects);
  const user = useAuthStore((s) => s.user);
  const seenHandoverIds = useRef<Set<string>>(getDismissedHandovers());

  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/agent';
  const projectIds = projects.map((p) => p.id);

  const { requests: transferRequests, acceptTransfer, rejectTransfer, refresh } = useTransferRequests({
    onHumanRequested: (p) => addHumanRequested(p),
    projectIds: projectIds.length > 0 ? projectIds : undefined,
    modalOpen: dialogOpen,
  });

  useEffect(() => {
    setRequests(transferRequests);
  }, [transferRequests, setRequests]);

  useEffect(() => {
    setRefreshFn(refresh);
    return () => setRefreshFn(null);
  }, [refresh, setRefreshFn]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Poll for pending AI→human handovers every 5s so the dialog appears on any page
  useEffect(() => {
    if (!user?.id) return;

    const poll = async () => {
      try {
        const res = await api.get<{ chat_id: string; customer_name: string; project_id: string; project_name: string }[]>('/agent/pending-handovers');
        if (res.success && Array.isArray(res.data)) {
          res.data.forEach((item) => {
            if (!seenHandoverIds.current.has(item.chat_id)) {
              seenHandoverIds.current.add(item.chat_id);
              addHumanRequested(item);
            }
          });
          // Remove seen IDs that are no longer in the list (chat was taken or closed)
          const activeIds = new Set(res.data.map((i) => i.chat_id));
          seenHandoverIds.current.forEach((id) => {
            if (!activeIds.has(id)) seenHandoverIds.current.delete(id);
          });
        }
      } catch {
        // ignore poll errors
      }
    };

    poll(); // immediate first check
    const interval = setInterval(poll, HANDOVER_POLL_MS);
    return () => clearInterval(interval);
  }, [user?.id, addHumanRequested]);

  const combinedRequests = [
    ...transferRequests,
    ...pendingHumanRequests.map(humanRequestedToTransferRequest),
  ];

  const handleAccept = async (requestId: string, notes: string) => {
    if (requestId.startsWith('human-')) {
      const chatId = requestId.replace('human-', '');
      removeHumanRequested(chatId);
      setTakeoverChatId(chatId);
      setTakeoverFromAi(true); // Skip Take Over confirmation modal
      setDialogOpen(false);
      navigate(`${basePath}/chats`);
    } else {
      const ok = await acceptTransfer(requestId, notes);
      if (ok) setDialogOpen(false);
    }
  };

  const handleReject = async (requestId: string, notes: string) => {
    if (requestId.startsWith('human-')) {
      const chatId = requestId.replace('human-', '');
      dismissHandover(chatId);
      seenHandoverIds.current.add(chatId);
      removeHumanRequested(chatId);
    } else {
      await rejectTransfer(requestId, notes);
    }
  };

  return (
    <TransferRequestsDialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (open) refresh();
      }}
      requests={combinedRequests}
      onAccept={handleAccept}
      onReject={handleReject}
    />
  );
}

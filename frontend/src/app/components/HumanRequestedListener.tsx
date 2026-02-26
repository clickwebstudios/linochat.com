import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTransferRequests } from '../hooks/useTransferRequests';
import {
  useTransferRequestsStore,
  humanRequestedToTransferRequest,
} from '../stores/transferRequestsStore';
import { useHumanRequestedStore } from '../stores/humanRequestedStore';
import { useProjectsStore } from '../stores/projectsStore';
import { TransferRequestsDialog } from './TransferRequestsDialog';

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
      removeHumanRequested(requestId.replace('human-', ''));
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

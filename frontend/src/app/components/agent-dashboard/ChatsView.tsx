import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../api/client';
import { initEcho } from '../../lib/echo';
import { playNotificationSound } from '../../lib/notificationSound';
import { ChatConversationsList } from './ChatConversationsList';
import { ChatMessageArea } from './ChatMessageArea';
import { ChatActivityPanel } from './ChatActivityPanel';
import { ChatDialogs } from './ChatDialogs';

interface Message {
  id: string;
  chat_id: string;
  sender_type: 'customer' | 'agent' | 'ai' | 'system';
  sender_id?: string;
  content: string;
  is_ai?: boolean;
  created_at: string;
  isRead?: boolean;
  metadata?: { attachments?: Array<{ url: string; name: string }> };
}

interface TeamMemberForTransfer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status?: string;
  active_chats_count?: number;
}

interface ChatsViewProps {
  activeChat: any;
  setActiveChat: (chat: any) => void;
  filteredChats: any[];
  chatFilter: 'all' | 'active' | 'closed' | 'archived';
  setChatFilter: (filter: 'all' | 'active' | 'closed' | 'archived') => void;
  getProjectById: (id: string) => any;
  projects?: any[];
  role: string;
  teamMembers?: TeamMemberForTransfer[];
  currentUserId?: string;
  onRefreshTeamMembers?: () => void;
  onChatsUpdate?: (updater: (chats: any[]) => any[]) => void;
  /** When set and matches activeChat.id, opens the takeover flow (e.g. from Accept on Transfer Request) */
  openTakeoverForChatId?: string | null;
  /** When true, takeover is from AI handover - skip confirmation modal */
  takeoverFromAi?: boolean;
  onTakeoverTriggerHandled?: () => void;
  /** Called after successful takeover to refresh chat list */
  onTakeOverComplete?: () => void;
  /** Called when "Transferring to human agent..." is received (fallback when agent channel event doesn't fire) */
  onHumanRequestedInChat?: (payload: { chat_id: string; customer_name: string; project_id: string; project_name: string }) => void;
}

export function ChatsView({
  activeChat,
  setActiveChat,
  filteredChats,
  chatFilter,
  setChatFilter,
  getProjectById,
  projects = [],
  role: _role,
  teamMembers = [],
  currentUserId,
  onRefreshTeamMembers,
  onChatsUpdate,
  openTakeoverForChatId,
  takeoverFromAi = false,
  onTakeoverTriggerHandled,
  onTakeOverComplete,
  onHumanRequestedInChat,
}: ChatsViewProps) {
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [selectedPreviousChat, setSelectedPreviousChat] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showCreateTicketDialog, setShowCreateTicketDialog] = useState(false);
  const [showTakeoverDialog, setShowTakeoverDialog] = useState(false);
  const [hasTakenOver, setHasTakenOver] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [takeoverError, setTakeoverError] = useState<string | null>(null);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [agentTyping, setAgentTyping] = useState<{ agentName: string } | null>(null);
  const [customerTyping, setCustomerTyping] = useState(false);
  const [activity, setActivity] = useState<{
    customer: string;
    customer_email: string;
    sessionStart: string;
    chatInitiatedFrom: string;
    location: string;
    device: string;
    browser: string;
    referralSource: string;
    pagesVisited: Array<{ page: string; url: string; timestamp: string; duration: string }>;
    previousChats: Array<{ id: string; date: string; topic: string; duration: string; agent: string }>;
    totalTickets: number;
    customerTier: string | null;
  } | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const humanRequestedNotifiedForChat = useRef<Set<string>>(new Set());
  const customerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    priority: 'medium',
    category: '',
    description: '',
    customerName: activeChat?.customer_name || activeChat?.customer || '',
    customerEmail: '',
    projectId: activeChat?.projectId || ''
  });
  const [transferStep, setTransferStep] = useState<'select' | 'reason'>('select');
  const [selectedOperatorForTransfer, setSelectedOperatorForTransfer] = useState<any>(null);
  const [transferReason, setTransferReason] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const activeChatProject = getProjectById(activeChat?.project_id || activeChat?.projectId);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat?.id) {
      loadMessages(activeChat.id);
    } else {
      setMessages([]);
    }
  }, [activeChat?.id]);

  // Load activity when active chat changes (for Info panel)
  useEffect(() => {
    if (!activeChat?.id) {
      setActivity(null);
      return;
    }
    const loadActivity = async () => {
      setActivityLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const response = await fetch(`/api/agent/chats/${activeChat.id}/activity`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setActivity(data.data);
          } else {
            setActivity(null);
          }
        } else {
          setActivity(null);
        }
      } catch {
        setActivity(null);
      } finally {
        setActivityLoading(false);
      }
    };
    loadActivity();
  }, [activeChat?.id]);

  // Sync takeover state: show input when current user is the assigned agent
  useEffect(() => {
    if (activeChat && currentUserId) {
      const isAssignedToMe = String(activeChat.agent_id) === String(currentUserId);
      setHasTakenOver(isAssignedToMe);
    }
  }, [activeChat?.id, activeChat?.agent_id, currentUserId]);

  /** True when another agent (not current user) is assigned - show confirmation modal */
  const isTakingOverFromAgent = Boolean(
    activeChat?.agent_id &&
    currentUserId &&
    String(activeChat.agent_id) !== String(currentUserId)
  );

  // WebSocket subscription for real-time messages
  useEffect(() => {
    if (!activeChat?.id) return;

    const echo = initEcho();
    if (!echo) {
      console.warn('Echo not initialized - cannot subscribe to real-time updates');
      return;
    }

    const channel = echo.channel(`chat.${activeChat.id}`);

    channel.listen('.message.sent', (event: any) => {
      if (event.sender_type === 'system' && event.content === 'Transferring to human agent...') {
        const agentAssigned = activeChat?.agent_id != null && activeChat?.agent_id !== '';
        if (!agentAssigned && !humanRequestedNotifiedForChat.current.has(activeChat.id)) {
          humanRequestedNotifiedForChat.current.add(activeChat.id);
          const project = getProjectById(activeChat.project_id || activeChat.projectId);
          onHumanRequestedInChat?.({
            chat_id: String(activeChat.id),
            customer_name: activeChat.customer_name || activeChat.customer || 'Guest',
            project_id: String(activeChat.project_id || activeChat.projectId || ''),
            project_name: project?.name || 'Project',
          });
        }
      }

      const newMessage: Message = {
        id: event.id,
        chat_id: event.chat_id,
        sender_type: event.sender_type,
        sender_id: event.sender_id,
        content: event.content,
        is_ai: event.is_ai,
        created_at: event.created_at,
        isRead: true,
        metadata: event.metadata,
      };

      setMessages(prev => {
        if (prev.find(m => m.id === newMessage.id)) return prev;
        if (event.sender_type === 'agent' && String(event.sender_id) === String(currentUserId)) {
          const hasOptimistic = prev.some(m => String(m.id).startsWith('temp-'));
          if (hasOptimistic) {
            return prev.map(m => (String(m.id).startsWith('temp-') ? newMessage : m));
          }
        }
        if (event.sender_type === 'customer' || event.is_ai) {
          playNotificationSound();
        }
        return [...prev, newMessage];
      });
      setAgentTyping(null);
      setCustomerTyping(false);

      if (onChatsUpdate) {
        onChatsUpdate(prevChats =>
          prevChats.map(chat => {
            if (chat.id === event.chat_id) {
              const updates: Record<string, unknown> = {
                preview: event.content.length > 60 ? event.content.substring(0, 60) + '\u2026' : event.content,
                last_message_at: event.created_at,
                unread: chat.unread + (event.sender_type !== 'agent' ? 1 : 0),
              };
              if (event.customer_name) {
                updates.customer_name = event.customer_name;
              }
              return { ...chat, ...updates };
            }
            return chat;
          })
        );
      }

      if (event.customer_name && activeChat?.id === event.chat_id) {
        setActiveChat({ ...activeChat, customer_name: event.customer_name });
      }
    });

    channel.listen('.agent.typing', (event: any) => {
      if (String(event.chat_id) === String(activeChat.id) && String(event.agent_id) !== String(currentUserId)) {
        setAgentTyping(event.is_typing ? { agentName: event.agent_name || 'Agent' } : null);
      }
    });

    channel.listen('.customer.typing', (event: any) => {
      if (String(event.chat_id) !== String(activeChat.id)) return;
      if (customerTypingTimeoutRef.current) {
        clearTimeout(customerTypingTimeoutRef.current);
        customerTypingTimeoutRef.current = null;
      }
      const isTyping = Boolean(event.is_typing);
      setCustomerTyping(isTyping);
      if (isTyping) {
        customerTypingTimeoutRef.current = setTimeout(() => {
          setCustomerTyping(false);
          customerTypingTimeoutRef.current = null;
        }, 3000);
      }
    });

    channel.listen('.chat.status', (event: any) => {
      if (onChatsUpdate) {
        onChatsUpdate(prevChats =>
          prevChats.map(chat => {
            if (chat.id === event.chat_id) {
              return {
                ...chat,
                status: event.status,
                agent_id: event.agent_id ?? chat.agent_id,
                agent_name: event.agent_name ?? (event.agent_id ? chat.agent_name : null),
              };
            }
            return chat;
          })
        );
      }
      setActiveChat((prev: any) => (prev && prev.id === event.chat_id ? { ...prev, status: event.status, agent_id: event.agent_id ?? prev.agent_id, agent_name: event.agent_name ?? prev.agent_name } : prev));
    });

    return () => {
      channel.stopListening('.message.sent');
      channel.stopListening('.agent.typing');
      channel.stopListening('.customer.typing');
      channel.stopListening('.chat.status');
      echo.leave(`chat.${activeChat.id}`);
      if (customerTypingTimeoutRef.current) {
        clearTimeout(customerTypingTimeoutRef.current);
        customerTypingTimeoutRef.current = null;
      }
      setAgentTyping(null);
      setCustomerTyping(false);
    };
  }, [activeChat?.id, onChatsUpdate]);

  const loadMessages = async (chatId: string, silent = false) => {
    if (!silent) setMessagesLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/agent/chats/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        const chatData = data.data;
        setActiveChat((prev: any) => {
          if (!prev || prev.id !== chatId) return prev;
          return { ...prev, agent_id: chatData.agent_id ?? prev.agent_id, status: chatData.status ?? prev.status, agent_name: chatData.agent_name ?? prev.agent_name };
        });
        const messages = chatData.messages;
        if (!messages) return;
        const loadedMessages = messages.map((msg: any) => ({
          id: msg.id,
          chat_id: msg.chat_id,
          sender_type: msg.sender_type,
          sender_id: msg.sender_id,
          content: msg.content,
          is_ai: msg.is_ai,
          created_at: msg.created_at,
          isRead: true,
          metadata: msg.metadata,
        }));
        const hasTransferMessage = loadedMessages.some(
          (m: { sender_type: string; content: string }) =>
            m.sender_type === 'system' && m.content === 'Transferring to human agent...'
        );
        const agentAlreadyAssigned = chatData?.agent_id != null && chatData?.agent_id !== '';
        const isTakingOverThisChat = chatId === openTakeoverForChatId;
        if (hasTransferMessage && !agentAlreadyAssigned && !isTakingOverThisChat && !humanRequestedNotifiedForChat.current.has(chatId)) {
          humanRequestedNotifiedForChat.current.add(chatId);
          const project = chatData?.project || getProjectById(chatData?.project_id);
          onHumanRequestedInChat?.({
            chat_id: String(chatId),
            customer_name: chatData?.customer_name || 'Guest',
            project_id: String(chatData?.project_id || chatData?.project?.id || ''),
            project_name: project?.name || chatData?.project?.name || 'Project',
          });
        }
        setMessages(prev => {
          if (silent && prev.length > 0) {
            const prevIds = new Set(prev.map(m => String(m.id)));
            const hasNewIncoming = loadedMessages.some(
              (m: { id: string | number; sender_type: string; is_ai?: boolean }) =>
                !prevIds.has(String(m.id)) && (m.sender_type === 'customer' || m.is_ai)
            );
            if (hasNewIncoming) playNotificationSound();
          }
          return loadedMessages;
        });

        fetch(`/api/agent/chats/${chatId}/mark-read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.success) {
              setMessages((prev) =>
                prev.map((m) => ({ ...m, isRead: true }))
              );
              onChatsUpdate?.((prevChats) =>
                prevChats.map((c) => (c.id === chatId ? { ...c, unread: 0, unread_count: 0 } : c))
              );
            }
          })
          .catch(() => {});
      }
    } catch (error) {
      if (!silent) console.error('Failed to load messages:', error);
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  // Helper: execute take over (used when skipping confirmation or on confirm)
  const executeTakeOver = useCallback(async () => {
    if (!activeChat?.id) return;
    setIsTakingOver(true);
    setTakeoverError(null);
    try {
      await api.post(`/agent/chats/${activeChat.id}/take`, {});
      setHasTakenOver(true);
      setShowTakeoverDialog(false);
      setActiveChat((prev: any) => (prev ? { ...prev, agent_id: currentUserId, status: 'active' } : prev));
      onTakeOverComplete?.();
      loadMessages(activeChat.id);
    } catch (err: any) {
      console.error('Take over failed:', err);
      if (err?.message?.includes('already assigned')) {
        setShowTakeoverDialog(false);
        onTakeOverComplete?.();
        loadMessages(activeChat.id);
      } else {
        setTakeoverError(err?.message || 'Failed to take over. Please try again.');
      }
    } finally {
      setIsTakingOver(false);
    }
  }, [activeChat?.id, currentUserId, loadMessages, onTakeOverComplete, setActiveChat]);

  // Open takeover flow when triggered from Accept on Transfer Request
  useEffect(() => {
    if (!openTakeoverForChatId || activeChat?.id !== openTakeoverForChatId) return;
    onTakeoverTriggerHandled?.();

    if (takeoverFromAi || !isTakingOverFromAgent) {
      executeTakeOver();
    } else {
      setShowTakeoverDialog(true);
      setTakeoverError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- executeTakeOver intentionally excluded to avoid re-runs
  }, [openTakeoverForChatId, activeChat?.id, isTakingOverFromAgent, takeoverFromAi]);

  // Poll for new messages when WebSocket (Pusher) may not be available
  useEffect(() => {
    if (!activeChat?.id) return;
    const interval = setInterval(() => {
      loadMessages(activeChat.id, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChat?.id]);

  const sendAgentTyping = useCallback((isTyping: boolean) => {
    if (!activeChat?.id || !hasTakenOver) return;
    api.post(`/agent/chats/${activeChat.id}/typing`, { is_typing: isTyping }).catch(() => {});
  }, [activeChat?.id, hasTakenOver]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !activeChat?.id) return;

    const messageText = chatMessage;
    const filesToSend = [...attachmentFiles];
    setChatMessage('');
    setAttachmentFiles([]);
    setIsSending(true);
    sendAgentTyping(false);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      chat_id: activeChat.id,
      sender_type: 'agent',
      content: messageText,
      created_at: new Date().toISOString(),
      isRead: true,
      metadata: filesToSend.length > 0 ? { attachments: filesToSend.map(f => ({ url: '', name: f.name })) } : undefined,
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const token = localStorage.getItem('access_token');
      let response: Response;
      if (filesToSend.length > 0) {
        const formData = new FormData();
        formData.append('message', messageText);
        filesToSend.forEach((f) => formData.append('attachments[]', f));
        response = await fetch(`/api/agent/chats/${activeChat.id}/message`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
      } else {
        response = await fetch(`/api/agent/chats/${activeChat.id}/message`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: messageText }),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data?.message) {
        const msg = data.data.message;
        setMessages(prev =>
          prev.map(m => m.id === tempId ? {
            id: msg.id,
            chat_id: msg.chat_id,
            sender_type: msg.sender_type,
            sender_id: msg.sender_id,
            content: msg.content,
            is_ai: msg.is_ai,
            created_at: msg.created_at,
            isRead: true,
            metadata: msg.metadata,
          } : m)
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleEndChat = async () => {
    if (!activeChat?.id) return;
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const response = await fetch(`/api/agent/chats/${activeChat.id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to close chat');
      // Update chat status in the list
      onChatsUpdate?.((prevChats) =>
        prevChats.map((c) =>
          c.id === activeChat.id ? { ...c, status: 'closed' } : c
        )
      );
      // Clear active chat so it disappears from view
      setActiveChat(null);
    } catch (error) {
      console.error('Failed to end chat:', error);
    }
  };

  const handleSubmitTransfer = () => {
    if (selectedOperatorForTransfer && transferReason.trim()) {
      setShowTransferDialog(false);
      setTransferStep('select');
      setSelectedOperatorForTransfer(null);
      setTransferReason('');
    }
  };

  const handleGenerateSubject = async () => {
    if (!activeChat) return;
    setIsGeneratingSubject(true);
    setTimeout(() => {
      const customerName = activeChat.customer_name || activeChat.customer || 'Customer';
      const chatContext = (activeChat.preview || activeChat.last_message || '').toLowerCase();
      let generatedSubject = '';
      if (chatContext.includes('payment') || chatContext.includes('billing')) {
        generatedSubject = `Payment Issue - ${customerName}`;
      } else if (chatContext.includes('login') || chatContext.includes('access')) {
        generatedSubject = `Login/Access Request - ${customerName}`;
      } else if (chatContext.includes('bug') || chatContext.includes('error')) {
        generatedSubject = `Technical Issue - ${customerName}`;
      } else if (chatContext.includes('feature') || chatContext.includes('request')) {
        generatedSubject = `Feature Request - ${customerName}`;
      } else {
        generatedSubject = `Support Request - ${customerName}`;
      }
      setNewTicket({ ...newTicket, subject: generatedSubject });
      setIsGeneratingSubject(false);
    }, 1500);
  };

  // Available operators for transfer (from API, exclude self, map to display format)
  const availableOperators = teamMembers
    .filter((m) => (m.role === 'Agent' || m.role === 'Admin') && String(m.id) !== String(currentUserId))
    .map((m) => {
      const statusLower = (m.status || 'Active').toLowerCase();
      const status = statusLower === 'active' ? 'online' : statusLower === 'away' ? 'away' : 'offline';
      return { id: m.id, name: m.name, avatar: m.avatar, status, activeChats: m.active_chats_count ?? 0 };
    });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 120) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hr ago`;
    return formatTime(dateString);
  };

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)]">
        <ChatConversationsList
          filteredChats={filteredChats}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          chatFilter={chatFilter}
          setChatFilter={setChatFilter}
          getProjectById={getProjectById}
          formatRelativeTime={formatRelativeTime}
        />

        <ChatMessageArea
          activeChat={activeChat}
          activeChatProject={activeChatProject}
          filteredChats={filteredChats}
          messages={messages}
          messagesLoading={messagesLoading}
          chatMessage={chatMessage}
          setChatMessage={setChatMessage}
          isSending={isSending}
          hasTakenOver={hasTakenOver}
          agentTyping={agentTyping}
          customerTyping={customerTyping}
          attachmentFiles={attachmentFiles}
          setAttachmentFiles={setAttachmentFiles}
          showActivityHistory={showActivityHistory}
          setShowActivityHistory={setShowActivityHistory}
          isTakingOverFromAgent={isTakingOverFromAgent}
          messagesEndRef={messagesEndRef}
          onSendMessage={handleSendMessage}
          onTakeOver={executeTakeOver}
          onShowTransferDialog={() => setShowTransferDialog(true)}
          onShowCreateTicketDialog={() => {
            // Pre-fill ticket with current chat context
            const lastMessages = messages
              .filter((m) => m.sender_type !== 'system')
              .slice(-10)
              .map((m) => {
                const sender =
                  m.sender_type === 'customer'
                    ? (activeChat?.customer_name || activeChat?.customer || 'Customer')
                    : m.sender_type === 'ai'
                    ? 'AI'
                    : 'Agent';
                return `[${sender}]: ${m.content}`;
              })
              .join('\n');
            setNewTicket({
              subject: '',
              priority: 'medium',
              category: '',
              description: lastMessages,
              customerName: activeChat?.customer_name || activeChat?.customer || '',
              customerEmail: activeChat?.customer_email || '',
              projectId: activeChat?.project_id || activeChat?.projectId || '',
            });
            setShowCreateTicketDialog(true);
          }}
          onShowTakeoverDialog={() => setShowTakeoverDialog(true)}
          onEndChat={handleEndChat}
          sendAgentTyping={sendAgentTyping}
          formatRelativeTime={formatRelativeTime}
        />

        {showActivityHistory && activeChat && (
          <ChatActivityPanel
            activeChat={activeChat}
            activity={activity}
            activityLoading={activityLoading}
            onClose={() => setShowActivityHistory(false)}
            onOpenPreviousChat={(chat) => { setSelectedPreviousChat(chat); setShowChatPopup(true); }}
          />
        )}
      </div>

      <ChatDialogs
        activeChat={activeChat}
        projects={projects}
        showChatPopup={showChatPopup}
        setShowChatPopup={setShowChatPopup}
        selectedPreviousChat={selectedPreviousChat}
        showCreateTicketDialog={showCreateTicketDialog}
        setShowCreateTicketDialog={setShowCreateTicketDialog}
        newTicket={newTicket}
        setNewTicket={setNewTicket}
        isGeneratingSubject={isGeneratingSubject}
        isCreatingTicket={isCreatingTicket}
        setIsCreatingTicket={setIsCreatingTicket}
        onGenerateSubject={handleGenerateSubject}
        showTakeoverDialog={showTakeoverDialog}
        setShowTakeoverDialog={setShowTakeoverDialog}
        isTakingOver={isTakingOver}
        takeoverError={takeoverError}
        setTakeoverError={setTakeoverError}
        onExecuteTakeOver={executeTakeOver}
        showTransferDialog={showTransferDialog}
        setShowTransferDialog={setShowTransferDialog}
        availableOperators={availableOperators}
        transferStep={transferStep}
        setTransferStep={setTransferStep}
        selectedOperatorForTransfer={selectedOperatorForTransfer}
        setSelectedOperatorForTransfer={setSelectedOperatorForTransfer}
        transferReason={transferReason}
        setTransferReason={setTransferReason}
        onSubmitTransfer={handleSubmitTransfer}
        onRefreshTeamMembers={onRefreshTeamMembers}
      />
    </>
  );
}

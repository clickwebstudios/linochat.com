import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  MessageCircle,
  Ticket,
  FileText,
  Search,
  User,
  Send,
  MoreVertical,
  X,
  Clock,
  AlertCircle,
  Eye,
  Bookmark,
  Plus,
  ChevronDown,
  ChevronUp,
  Mail,
  MapPin,
  Calendar,
  Tag,
  History,
  Info,
  UserPlus,
  ArrowRightLeft,
  Sparkles,
  Bot,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { mockArticles } from '../../data/mockData';
import { TICKET_CATEGORIES } from '../../lib/constants';
import { initEcho } from '../../lib/echo';
import { playNotificationSound } from '../../lib/notificationSound';

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
  chatFilter: 'all' | 'active' | 'closed';
  setChatFilter: (filter: 'all' | 'active' | 'closed') => void;
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
  role,
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
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);
  const [showSessionInfo, setShowSessionInfo] = useState(true);
  const [showPreviousChats, setShowPreviousChats] = useState(true);
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
  const agentTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    console.log(`Subscribing to chat channel: chat.${activeChat.id}`);
    
    // Subscribe to the chat channel
    const channel = echo.channel(`chat.${activeChat.id}`);
    
    channel.listen('.message.sent', (event: any) => {
      console.log('Received message event:', event);

      // Fallback: show human requested modal when system message indicates transfer
      // Skip if agent already assigned (e.g. we just took over)
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

      // Add new message to the list
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
        // When we receive our own agent message (from WebSocket), replace optimistic message instead of adding
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
      // Clear typing indicators when message arrives
      setAgentTyping(null);
      setCustomerTyping(false);

      // Update the chat list with the new message (and customer_name if AI detected it)
      if (onChatsUpdate) {
        onChatsUpdate(prevChats =>
          prevChats.map(chat => {
            if (chat.id === event.chat_id) {
              const updates: Record<string, unknown> = {
                preview: event.content.length > 60 ? event.content.substring(0, 60) + '…' : event.content,
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

      // Update active chat's customer_name when AI detects it
      if (event.customer_name && activeChat?.id === event.chat_id) {
        setActiveChat({ ...activeChat, customer_name: event.customer_name });
      }
    });

    // Listen for typing indicators
    // Agent typing: only show when it's another agent (not current user) - current user's typing shows on client widget
    channel.listen('.agent.typing', (event: any) => {
      if (String(event.chat_id) === String(activeChat.id) && String(event.agent_id) !== String(currentUserId)) {
        setAgentTyping(event.is_typing ? { agentName: event.agent_name || 'Agent' } : null);
      }
    });
    // Customer typing: show in dashboard when client types in widget
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
      console.log('Chat status updated:', event);
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
      // Update activeChat immediately so input unblocks when current user is assigned (we're on this chat's channel)
      setActiveChat((prev: any) => (prev && prev.id === event.chat_id ? { ...prev, status: event.status, agent_id: event.agent_id ?? prev.agent_id, agent_name: event.agent_name ?? prev.agent_name } : prev));
    });

    return () => {
      console.log(`Leaving chat channel: chat.${activeChat.id}`);
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
        // Update activeChat with latest agent_id/status so input unblocks when assigned to current user
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
        // Fallback: show human requested modal when transfer message appears (works without WebSocket)
        // Skip if agent already took over, or we're in the process of taking over this chat
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

        // Mark messages as read when agent views the chat (removes blue dots, reduces unread count)
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

    // Never show confirmation modal when takeover is from AI handover
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

    // Optimistically add message
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

  const handleSubmitTransfer = () => {
    if (selectedOperatorForTransfer && transferReason.trim()) {
      console.log('Transferring chat to:', selectedOperatorForTransfer.name, 'Reason:', transferReason);
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
      const chatContext = (activeChat.preview || '').toLowerCase();
      let generatedSubject = '';
      if (chatContext.includes('payment') || chatContext.includes('billing')) {
        generatedSubject = `Payment Issue - ${activeChat.customer}`;
      } else if (chatContext.includes('login') || chatContext.includes('access')) {
        generatedSubject = `Login/Access Request - ${activeChat.customer}`;
      } else if (chatContext.includes('bug') || chatContext.includes('error')) {
        generatedSubject = `Technical Issue - ${activeChat.customer}`;
      } else if (chatContext.includes('feature') || chatContext.includes('request')) {
        generatedSubject = `Feature Request - ${activeChat.customer}`;
      } else {
        generatedSubject = `Support Request - ${activeChat.customer}`;
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
      {/* Conversations List - Figma design */}
      <div className="w-80 border-r border-[rgba(0,0,0,0.1)] bg-white flex flex-col">
        <div className="h-[113px] border-b border-[rgba(0,0,0,0.1)] p-4 flex flex-col gap-3 shrink-0">
          <div className="relative h-9">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717182]" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 h-9 rounded-lg bg-[#f3f3f5] border-0 text-[14px] text-[#0a0a0a] placeholder:text-[#717182]" 
            />
          </div>
          <div className="flex gap-2 h-8">
            <button
              type="button"
              onClick={() => setChatFilter('all')}
              className={`flex-1 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                chatFilter === 'all' ? 'bg-[#030213] text-white' : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#0a0a0a] hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setChatFilter('active')}
              className={`flex-1 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                chatFilter === 'active' ? 'bg-[#030213] text-white' : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#0a0a0a] hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setChatFilter('closed')}
              className={`flex-1 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                chatFilter === 'closed' ? 'bg-[#030213] text-white' : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#0a0a0a] hover:bg-gray-50'
              }`}
            >
              Closed
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 bg-[#eff6ff] rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-[#155dfc]" />
              </div>
              <h3 className="text-sm font-medium text-[#0a0a0a] mb-1">
                {chatFilter === 'all' ? 'No conversations yet' : 
                 chatFilter === 'active' ? 'No active conversations' : 
                 'No closed conversations'}
              </h3>
              <p className="text-xs text-[#6a7282] max-w-[200px]">
                {chatFilter === 'all' 
                  ? "Customer chats will appear here when they start a conversation."
                  : chatFilter === 'active'
                  ? "No active chats at the moment. Check back soon!"
                  : "No closed chats yet. They'll appear here once resolved."}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
            const project = getProjectById(chat.project_id || chat.projectId);
            const isSelected = activeChat?.id === chat.id;
            const isOnline = chat.status !== 'closed' && chat.status !== 'offline';
            const agentName = chat.agent || (chat.ai_enabled || chat.isAIBot ? 'AI Bot' : null);
            return (
            <div
              key={chat.id}
              className={`py-3 px-3 cursor-pointer border-b border-[rgba(0,0,0,0.1)] hover:bg-gray-50/50 transition-colors ${
                isSelected ? 'bg-[#eff6ff] border-l-[3px] border-l-[#155dfc] pl-[15px]' : ''
              }`}
              onClick={() => setActiveChat(chat)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0 rounded-full">
                  <AvatarFallback className={`rounded-full text-base font-normal flex items-center justify-center ${
                    isSelected ? 'bg-[#155dfc] text-white' : 'bg-[#e5e7eb] text-[#0a0a0a]'
                  }`}>
                    {chat.customer_name ? chat.customer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : chat.avatar ? chat.avatar : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className="text-sm font-semibold text-[#0a0a0a] truncate leading-5">
                      {chat.customer_name || chat.customer || 'Guest'}
                    </h4>
                    <span className="text-xs text-[#6a7282] flex-shrink-0">
                      {chat.last_message_at ? formatRelativeTime(chat.last_message_at) : chat.time || '—'}
                    </span>
                  </div>
                  {agentName && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px] text-[#6a7282] leading-[15px]">
                        Handled by: <span className="font-medium text-[#364153]">{agentName}</span>
                      </span>
                      {(chat.ai_enabled || chat.isAIBot) && (
                        <Bot className="h-3 w-3 text-[#6a7282]" />
                      )}
                    </div>
                  )}
                  <p className="text-xs text-[#4a5565] truncate mb-1.5 leading-4">
                    {chat.preview || chat.last_message || 'No messages yet'}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg text-xs font-medium ${
                        isOnline
                          ? 'bg-[#f0fdf4] border border-[#b9f8cf] text-[#008236]'
                          : 'bg-gray-100 border border-gray-200 text-[#6a7282]'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-[#00a63e]' : 'bg-gray-400'}`} />
                        {chat.status === 'closed' ? 'Closed' : chat.status === 'offline' ? 'Offline' : 'Online'}
                      </span>
                      {project && (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] text-white"
                          style={{ backgroundColor: project.color || '#3b82f6' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                          {project.name}
                        </span>
                      )}
                    </div>
                    {(chat.unread > 0 || chat.unread_count > 0) && (
                      <span className="bg-[#155dfc] text-white text-xs font-medium h-5 min-w-[25px] px-2 rounded-lg flex items-center justify-center flex-shrink-0">
                        {chat.unread || chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {!activeChat ? (
          /* Empty State - No Chat Selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Select a conversation
            </h3>
            <p className="text-sm text-gray-500 max-w-md mb-6">
              Choose a chat from the list on the left to view messages and respond to customers.
            </p>
            {filteredChats.length > 0 && (
              <div className="text-xs text-gray-400">
                {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''} available
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Chat Header - Figma design */}
            <div className="h-[74px] border-b border-[rgba(0,0,0,0.1)] px-4 flex items-center justify-between shrink-0">
              {/* Customer info (left) */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0 rounded-full bg-[#155dfc]">
                  <AvatarFallback className="bg-[#155dfc] text-white text-base font-normal flex items-center justify-center">
                    {activeChat?.customer_name ? activeChat.customer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : activeChat?.avatar ? activeChat.avatar : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-[#0a0a0a] leading-6 tracking-[-0.31px] truncate">
                    {activeChat ? (activeChat.customer_name || activeChat.customer || 'Guest') : 'Select a chat'}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#6a7282] leading-4">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#00c950]" />
                      Online
                    </span>
                    <span>•</span>
                    <span>ID: C-{activeChat?.id || '-'}</span>
                    {activeChatProject && (
                      <>
                        <span>•</span>
                        <span 
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#3b82f6] text-[10px] text-white"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                          {activeChatProject.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Actions (right) */}
              <div className="flex items-center gap-2 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 px-3 h-8 rounded-lg border-[rgba(0,0,0,0.1)] bg-white hover:bg-gray-50">
                      {(activeChat?.status === 'ai_handling' || (activeChat?.status === 'waiting' && !activeChat?.agent_id)) ? (
                        <>
                          <Avatar className="h-7 w-7 rounded-full">
                            <AvatarFallback className="bg-[#6b7280] text-white text-xs font-medium">
                              AI
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-[#0a0a0a]">AI Agent</span>
                        </>
                      ) : (
                        <>
                          <Avatar className="h-7 w-7 rounded-full">
                            <AvatarFallback className="bg-[#155dfc] text-white text-xs font-medium">
                              {activeChat?.agent_name ? activeChat.agent_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '—'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-[#0a0a0a]">
                            {activeChat?.agent_name || 'Unassigned'}
                          </span>
                        </>
                      )}
                      <ChevronDown className="h-4 w-4 text-[#6a7282]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Transfer to Another Operator
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-[rgba(0,0,0,0.1)] bg-white hover:bg-gray-50"
                  onClick={() => (isTakingOverFromAgent ? setShowTakeoverDialog(true) : executeTakeOver())}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Take Over
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`h-8 rounded-lg border-[rgba(0,0,0,0.1)] bg-white hover:bg-gray-50 ${showActivityHistory ? 'bg-blue-50 border-[#155dfc]' : ''}`}
                  onClick={() => setShowActivityHistory(!showActivityHistory)}
                >
                  <Info className="h-4 w-4 mr-2" />
                  Info
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-[rgba(0,0,0,0.1)] bg-white hover:bg-gray-50">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowCreateTicketDialog(true)}>
                      <Ticket className="mr-2 h-4 w-4" />
                      Create Ticket
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <X className="mr-2 h-4 w-4" />
                      End Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

        {/* Messages Area - Figma design */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f9fafb]">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-[#155dfc]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm text-[#6a7282]">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Start the conversation by sending a message</p>
            </div>
          ) : (
            (() => {
              const filtered = messages.filter((m) => !(m.sender_type === 'system' && m.content === 'Transferring to human agent...' && activeChat?.status !== 'waiting'));
              // Deduplicate by id (keep last occurrence - e.g. real message over optimistic)
              const seen = new Set<string>();
              const deduped = filtered.filter((m) => {
                const key = String(m.id);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              return deduped;
            })()
              .map((message, index, array) => {
              const isFirstUnread = !message.isRead && (index === 0 || array[index - 1].isRead);
              return (
                <div key={message.id}>
                  {isFirstUnread && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[#bedbff]" />
                      <div className="px-2.5 py-1 rounded-lg border border-transparent bg-[#dbeafe]">
                        <span className="text-xs font-medium text-[#1447e6]">Unread Messages</span>
                      </div>
                      <div className="flex-1 h-px bg-[#bedbff]" />
                    </div>
                  )}
                  <div className={`flex ${message.sender_type === 'agent' || message.sender_type === 'ai' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%]">
                      {/* AI Label */}
                      {message.sender_type === 'ai' && (
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                            <Bot className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-[10px] font-medium text-purple-600">AI Assistant</span>
                        </div>
                      )}
                      {/* System Message */}
                      {message.sender_type === 'system' && (
                        <div className="flex items-center justify-center my-2">
                          <span className="text-xs text-[#6a7282] bg-gray-100 px-3 py-1 rounded-full">
                            {message.content}
                          </span>
                        </div>
                      )}
                      {message.sender_type !== 'system' && (
                        <div className={`rounded-[10px] px-3.5 py-3 shadow-sm border ${
                          message.sender_type === 'agent' || message.sender_type === 'ai'
                            ? 'bg-[#155dfc] text-white border-transparent' 
                            : 'bg-white border-[rgba(0,0,0,0.1)] text-[#0a0a0a]'
                        }`}>
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="text-sm leading-5">{message.content}</p>
                              {(message.metadata?.attachments?.length ?? 0) > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {message.metadata!.attachments!.map((a: { url: string; name: string }, i: number) => (
                                    <a
                                      key={i}
                                      href={a.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[#155dfc] hover:underline flex items-center gap-1"
                                    >
                                      View: {a.name}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            {!message.isRead && message.sender_type !== 'agent' && message.sender_type !== 'ai' && (
                              <span className="h-2 w-2 rounded-full bg-[#155dfc] flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      )}
                      {message.sender_type !== 'system' && (
                        <p className={`text-xs text-[#6a7282] mt-1 px-1 ${
                          message.sender_type === 'agent' || message.sender_type === 'ai' ? 'text-right' : ''
                        }`}>
                          {formatRelativeTime(message.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {(agentTyping || customerTyping) && (
            <div className="flex flex-col gap-1 py-2">
              {agentTyping && (
                <div className="flex justify-end">
                  <span className="text-xs text-[#6a7282] bg-gray-100 px-3 py-1.5 rounded-lg italic">
                    {agentTyping.agentName} is typing...
                  </span>
                </div>
              )}
              {customerTyping && (
                <div className="flex justify-start">
                  <span className="text-xs text-[#6a7282] bg-gray-100 px-3 py-1.5 rounded-lg italic">
                    Customer is typing...
                  </span>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Figma design */}
        <div className="border-t border-[rgba(0,0,0,0.1)] p-4 bg-white shrink-0">
          {!hasTakenOver ? (
            <div 
              className="flex items-center justify-center gap-2 h-12 rounded-[10px] bg-[#f9fafb] border border-[#d1d5dc] cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => (isTakingOverFromAgent ? setShowTakeoverDialog(true) : executeTakeOver())}
            >
              <UserPlus className="h-4 w-4 text-[#6a7282]" />
              <span className="text-sm text-[#6a7282]">Take over this chat to reply</span>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Canned Responses
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-3 border-b">
                      <p className="text-sm text-muted-foreground">Click to insert into message</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {[
                        { title: 'Greeting', text: 'Hi there! Thank you for reaching out. How can I help you today?' },
                        { title: 'Troubleshooting', text: 'I understand the issue. Could you please try clearing your browser cache and cookies, then restart your browser?' },
                        { title: 'Escalation', text: "I appreciate your patience. I'm going to escalate this to our specialist team for a faster resolution." },
                        { title: 'Follow-up', text: 'Just checking in — were you able to resolve the issue with the steps provided? Let me know if you need further assistance.' },
                        { title: 'Closing', text: "Glad I could help! If you have any other questions, don't hesitate to reach out. Have a great day!" },
                      ].map((response) => (
                        <button
                          key={response.title}
                          className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                          onClick={() => setChatMessage((prev) => prev ? `${prev} ${response.text}` : response.text)}
                        >
                          <p className="text-sm">{response.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{response.text}</p>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Bookmark className="h-4 w-4 mr-2" />
                      KB Articles
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-3 border-b">
                      <p className="text-sm text-muted-foreground">Insert article link into message</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {mockArticles.slice(0, 5).map((article) => (
                        <button
                          key={article.id}
                          className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                          onClick={() => setChatMessage((prev) => prev ? `${prev} [KB: ${article.title}]` : `[KB: ${article.title}]`)}
                        >
                          <p className="text-sm">{article.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{article.category}</p>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = 'image/*,.pdf,.doc,.docx,.txt,.csv';
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        setAttachmentFiles((prev) => [...prev, ...Array.from(files)]);
                      }
                    };
                    input.click();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Attachment
                  {attachmentFiles.length > 0 && (
                    <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 rounded">
                      {attachmentFiles.length}
                    </span>
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input 
                    placeholder="Type your message..." 
                    className="flex-1 pr-10 rounded-[10px] border-[#d1d5dc] bg-[#f9fafb]" 
                    value={chatMessage}
                    onChange={(e) => {
                      setChatMessage(e.target.value);
                      if (!hasTakenOver) return;
                      if (agentTypingTimeoutRef.current) clearTimeout(agentTypingTimeoutRef.current);
                      sendAgentTyping(true);
                      agentTypingTimeoutRef.current = setTimeout(() => {
                        sendAgentTyping(false);
                        agentTypingTimeoutRef.current = null;
                      }, 2000);
                    }}
                    onBlur={() => {
                      if (agentTypingTimeoutRef.current) {
                        clearTimeout(agentTypingTimeoutRef.current);
                        agentTypingTimeoutRef.current = null;
                      }
                      sendAgentTyping(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-purple-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                        title="AI Suggested Responses"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0" align="end" side="top">
                      <div className="p-3 border-b bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-md">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <p className="text-sm text-purple-800">AI Suggested Responses</p>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">Based on the conversation context</p>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {[
                          { tone: 'Professional', text: `Thank you for bringing this to our attention, ${activeChat?.customer_name || activeChat?.customer || 'Guest'}. I've reviewed the details and I'd like to help resolve this for you right away. Let me look into the specifics.` },
                          { tone: 'Empathetic', text: `I completely understand your frustration, ${activeChat?.customer_name || activeChat?.customer || 'Guest'}. This is definitely not the experience we want you to have. Let me personally ensure we get this sorted out for you.` },
                          { tone: 'Solution-focused', text: `Great news — I've identified a solution for your issue. Here's what I recommend: First, let's verify your current settings, then I'll walk you through the fix step by step.` },
                          { tone: 'Follow-up', text: `I wanted to follow up on your earlier concern. I've checked with our team and we have an update for you. Would you like me to walk you through the next steps?` },
                        ].map((suggestion) => (
                          <button
                            key={suggestion.tone}
                            className="w-full text-left px-3 py-3 hover:bg-purple-50 border-b last:border-b-0 transition-colors group"
                            onClick={() => setChatMessage(suggestion.text)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{suggestion.tone}</span>
                              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Click to use</span>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2 mt-1">{suggestion.text}</p>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Button 
                  size="icon" 
                  className="bg-[#155dfc] hover:bg-[#1247c4] h-10 w-10 rounded-[10px]" 
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </>
    )}
  </div>

      {showActivityHistory && activeChat && (
          <div className="w-96 border-l border-[rgba(0,0,0,0.1)] bg-white flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-[rgba(0,0,0,0.1)] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#101828] flex items-center gap-2">
                <Info className="h-4 w-4 text-[#6a7282]" />
                Info
              </h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowActivityHistory(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-[#6a7282]">
              {activity?.customer || activeChat?.customer_name || activeChat?.customer || 'Guest'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-4">
            {activityLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#155dfc]" />
              </div>
            ) : !activity ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No activity data available</p>
                  <p className="text-xs text-gray-400 mt-1">Activity history will appear here</p>
                </div>
            ) : (
              <>
                {/* Previous Conversations - Figma design */}
                <div className="border border-[rgba(0,0,0,0.1)] rounded-[10px] bg-white overflow-hidden">
                  <button
                    onClick={() => setShowPreviousChats(!showPreviousChats)}
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <h4 className="text-sm font-semibold text-[#101828] flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#6a7282]" />
                      Previous Conversations
                      {activity.previousChats.length > 0 && (
                        <Badge className="bg-[#155dfc] text-white text-xs rounded-lg px-2">
                          {activity.previousChats.length}
                        </Badge>
                      )}
                    </h4>
                    {showPreviousChats ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                  </button>
                  {showPreviousChats && (
                    <div className="p-3 pt-0 border-t">
                      {activity.previousChats.length > 0 ? (
                        <div className="space-y-2">
                          {activity.previousChats.map((chat) => (
                            <div 
                              key={chat.id} 
                              className="border border-[rgba(0,0,0,0.1)] rounded-[10px] p-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                              onClick={() => { setSelectedPreviousChat(chat); setShowChatPopup(true); }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-[#155dfc] hover:underline">{chat.topic}</p>
                                <Badge variant="outline" className="text-xs border-[rgba(0,0,0,0.1)] text-[#0a0a0a]">{chat.duration}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#6a7282]">
                                <Calendar className="h-3 w-3" />
                                <span>{chat.date}</span>
                                <span>•</span>
                                <User className="h-3 w-3" />
                                <span>{chat.agent}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4 text-center">
                          <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No previous conversations</p>
                          <p className="text-xs text-gray-400 mt-1">This is their first time chatting</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Customer Details - Figma design */}
                <div className="border border-[rgba(0,0,0,0.1)] rounded-[10px] bg-white overflow-hidden">
                  <button
                    onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <h4 className="text-sm font-semibold text-[#101828] flex items-center gap-2">
                      <User className="h-4 w-4 text-[#6a7282]" />
                      Customer Details
                    </h4>
                    {showCustomerDetails ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                  </button>
                  {showCustomerDetails && (
                    <div className="p-3 pt-0 border-t border-[rgba(0,0,0,0.1)] space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#6a7282]"><Mail className="h-3 w-3" /><span>Email</span></div>
                        <p className="text-sm font-medium text-[#0a0a0a]">{activity.customer_email || activeChat?.customer_email || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#6a7282]"><MapPin className="h-3 w-3" /><span>Location</span></div>
                        <p className="text-sm font-medium text-[#0a0a0a]">{activity.location}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#6a7282]"><Ticket className="h-3 w-3" /><span>Total Tickets</span></div>
                        <p className="text-sm font-medium text-[#0a0a0a]">{activity.totalTickets ? `${activity.totalTickets} tickets` : '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#6a7282]"><Tag className="h-3 w-3" /><span>Customer Tier</span></div>
                        <Badge className={activity.customerTier ? 'bg-[#9810fa] text-white text-xs rounded-lg' : 'bg-gray-200 text-gray-600'}>{activity.customerTier ?? 'Standard'}</Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Session Information - Figma design */}
                <div className="border border-[rgba(0,0,0,0.1)] rounded-[10px] bg-white overflow-hidden">
                  <button
                    onClick={() => setShowSessionInfo(!showSessionInfo)}
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <h4 className="text-sm font-semibold text-[#101828] flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#6a7282]" />
                      Session Information
                    </h4>
                    {showSessionInfo ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                  </button>
                  {showSessionInfo && (
                    <div className="p-3 pt-0 border-t border-[rgba(0,0,0,0.1)] space-y-3">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                        <div><p className="text-xs text-[#4a5565]">Session Started</p><p className="text-sm text-[#0a0a0a]">{activity.sessionStart}</p></div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                        <div><p className="text-xs text-[#4a5565]">Location</p><p className="text-sm text-[#0a0a0a]">{activity.location}</p></div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                        <div><p className="text-xs text-[#4a5565]">Device</p><p className="text-sm text-[#0a0a0a]">{activity.device}</p></div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Eye className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                        <div><p className="text-xs text-[#4a5565]">Browser</p><p className="text-sm text-[#0a0a0a]">{activity.browser}</p></div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Tag className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                        <div><p className="text-xs text-[#4a5565]">Referral Source</p><p className="text-sm text-[#0a0a0a]">{activity.referralSource}</p></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Initiated From - Figma design */}
                <div>
                  <h4 className="text-xs font-semibold text-[#6a7282] uppercase tracking-wide mb-3">Chat Initiated From</h4>
                  <div className="bg-[#eff6ff] border border-[#bedbff] rounded-[10px] p-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-[#155dfc] shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-[#1c398e]">{activity.chatInitiatedFrom}</p>
                        <p className="text-xs text-[#155dfc]">Current page when chat started</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pages Visited - Figma design */}
                <div>
                  <h4 className="text-xs font-semibold text-[#6a7282] uppercase tracking-wide mb-3">Pages Visited</h4>
                  <div className="space-y-2">
                    {activity.pagesVisited.map((page, index) => (
                      <div key={index} className="border border-[rgba(0,0,0,0.1)] rounded-[10px] p-3 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-[#0a0a0a]">{page.page}</p>
                          <span className="text-xs text-[#6a7282]">{page.duration}</span>
                        </div>
                        <p className="text-xs text-[#6a7282] font-mono">{page.url}</p>
                        <p className="text-xs text-[#99a1af] mt-1">{page.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>

    <Dialog open={showChatPopup} onOpenChange={setShowChatPopup}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              {selectedPreviousChat?.topic}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={() => { window.open(`/chat-history/${activeChat?.id}/${selectedPreviousChat?.date}`, '_blank'); }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Window
            </Button>
          </div>
          <DialogDescription>View the complete conversation history for this previous chat session.</DialogDescription>
          {selectedPreviousChat && (
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{selectedPreviousChat.date}</div>
              <span>•</span>
              <div className="flex items-center gap-1"><User className="h-4 w-4" />Agent: {selectedPreviousChat.agent}</div>
              <span>•</span>
              <Badge variant="outline">{selectedPreviousChat.duration}</Badge>
            </div>
          )}
        </DialogHeader>
        {selectedPreviousChat && (
          <div className="space-y-4 mt-4">
            {selectedPreviousChat.messages?.map((message: any, index: number) => (
              <div key={index} className={`flex ${message.sender === 'customer' ? 'justify-start' : message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[70%]">
                  {/* AI Label for previous chat */}
                  {message.sender === 'ai' && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                        <Bot className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-[10px] font-medium text-purple-600">AI Assistant</span>
                    </div>
                  )}
                  
                  <div className={`rounded-lg p-3 ${
                    message.sender === 'customer' 
                      ? 'bg-gray-100 text-gray-900' 
                      : message.sender === 'ai'
                      ? 'bg-purple-50 border border-purple-200 text-gray-900'
                      : 'bg-blue-600 text-white'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs opacity-75">{
                        message.sender === 'customer' 
                          ? activeChat?.customer_name || activeChat?.customer || 'Guest' 
                          : message.sender === 'ai'
                          ? 'AI Assistant'
                          : selectedPreviousChat.agent
                      }</span>
                      <span className="text-xs opacity-60">{message.time}</span>
                    </div>
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {!selectedPreviousChat.messages && (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Chat transcript not available</p>
                <p className="text-xs text-gray-400 mt-1">Full conversation details are archived</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Create Ticket Dialog */}
    <Dialog open={showCreateTicketDialog} onOpenChange={setShowCreateTicketDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ticket from Chat</DialogTitle>
          <DialogDescription>Convert this chat conversation into a support ticket for tracking and follow-up.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject *</Label>
            <div className="relative">
              <Input id="ticket-subject" placeholder="Enter ticket subject" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} className="pr-12" />
              <Button type="button" size="sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-blue-50" onClick={handleGenerateSubject} disabled={isGeneratingSubject} title="Generate subject with AI">
                <Sparkles className={`h-4 w-4 text-blue-600 ${isGeneratingSubject ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-priority">Priority *</Label>
            <div className="grid grid-cols-4 gap-2">
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <button key={priority} type="button"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    newTicket.priority === priority
                      ? priority === 'urgent' ? 'bg-red-600 text-white' : priority === 'high' ? 'bg-orange-600 text-white' : priority === 'medium' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setNewTicket({ ...newTicket, priority })}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-category">Category</Label>
            <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
              <SelectTrigger id="ticket-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {TICKET_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input id="customer-name" value={newTicket.customerName} onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Customer Email</Label>
              <Input id="customer-email" type="email" placeholder="customer@example.com" value={newTicket.customerEmail} onChange={(e) => setNewTicket({ ...newTicket, customerEmail: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-project">Project</Label>
            <select id="ticket-project" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" value={newTicket.projectId} onChange={(e) => setNewTicket({ ...newTicket, projectId: e.target.value })}>
              {projects.map((project) => (<option key={project.id} value={project.id}>{project.name}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea id="ticket-description" placeholder="Provide a detailed description of the issue or request..." rows={6} value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} />
            <p className="text-xs text-gray-500">Include relevant details from the chat conversation to help resolve the ticket.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900"><MessageCircle className="h-4 w-4" />Chat Context</div>
            <div className="text-sm text-blue-700">
              <p><strong>Customer:</strong> {activeChat?.customer_name || activeChat?.customer || 'Guest'}</p>
              <p><strong>Last Message:</strong> {activeChat?.preview || activeChat?.last_message || 'N/A'}</p>
              <p><strong>Chat Time:</strong> {activeChat?.time || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => { setShowCreateTicketDialog(false); setNewTicket({ subject: '', priority: 'medium', category: '', description: '', customerName: activeChat?.customer_name || activeChat?.customer || '', customerEmail: '', projectId: activeChat?.project_id || activeChat?.projectId || '' }); }}>Cancel</Button>
          <Button onClick={async () => {
            if (!newTicket.subject.trim()) return;
            setIsCreatingTicket(true);
            try {
              await api.post('/api/agent/tickets', {
                project_id: newTicket.projectId,
                subject: newTicket.subject,
                description: newTicket.description || newTicket.subject,
                priority: newTicket.priority,
                category: newTicket.category || undefined,
                customer_name: newTicket.customerName || undefined,
                customer_email: newTicket.customerEmail,
                chat_id: activeChat?.id,
              });
              toast.success('Ticket created successfully');
              setShowCreateTicketDialog(false);
              setNewTicket({ subject: '', priority: 'medium', category: '', description: '', customerName: activeChat?.customer_name || activeChat?.customer || '', customerEmail: '', projectId: activeChat?.project_id || activeChat?.projectId || '' });
            } catch (err: any) {
              const msg = err?.response?.data?.message || err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : 'Failed to create ticket';
              toast.error(typeof msg === 'string' ? msg : 'Failed to create ticket');
            } finally {
              setIsCreatingTicket(false);
            }
          }} disabled={!newTicket.subject.trim() || isCreatingTicket} className="bg-blue-600 hover:bg-blue-700">

            <Ticket className="mr-2 h-4 w-4" />Create Ticket
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Take Over Chat Dialog */}
    <Dialog open={showTakeoverDialog} onOpenChange={(open) => { setShowTakeoverDialog(open); if (!open) setTakeoverError(null); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-blue-600" />Take Over Chat</DialogTitle>
          <DialogDescription>Are you sure you want to take over this chat from <span className="font-semibold text-gray-900">{activeChat?.agent_name || 'the current agent'}</span>? The current agent will be notified and removed from the conversation.</DialogDescription>
        </DialogHeader>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
          <div className="flex items-start gap-2 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">This action will:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                <li>Reassign the chat with <span className="font-medium">{activeChat?.customer_name || activeChat?.customer || 'Guest'}</span> to you</li>
                <li>Notify {activeChat?.agent_name || 'the current agent'} that the chat has been taken over</li>
                <li>Transfer the full conversation history</li>
              </ul>
            </div>
          </div>
        </div>
        {takeoverError && (
          <p className="text-sm text-red-600 mt-2">{takeoverError}</p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowTakeoverDialog(false)} disabled={isTakingOver}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isTakingOver}
            onClick={() => executeTakeOver()}
          >
            {isTakingOver ? (
              <>Loading...</>
            ) : (
              <><UserPlus className="h-4 w-4 mr-2" />Confirm Take Over</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Transfer to Operator Dialog */}
    <Dialog open={showTransferDialog} onOpenChange={(open) => {
      setShowTransferDialog(open);
      if (open) onRefreshTeamMembers?.();
      if (!open) { setTransferStep('select'); setSelectedOperatorForTransfer(null); setTransferReason(''); }
    }}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => { e.preventDefault(); }} onInteractOutside={(e) => { e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>{transferStep === 'select' ? 'Transfer Chat to Another Operator' : 'Confirm Transfer'}</DialogTitle>
          <DialogDescription>{transferStep === 'select' ? 'Select an operator to transfer this conversation to. The customer will be notified of the transfer.' : 'Provide a reason for this transfer to help the receiving agent.'}</DialogDescription>
        </DialogHeader>
        {transferStep === 'select' ? (
          <div className="space-y-2 mt-4">
            {availableOperators.map((operator) => (
              <button key={operator.id} type="button" className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedOperatorForTransfer(operator); setTransferStep('reason'); }}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-600 text-white">{operator.avatar}</AvatarFallback></Avatar>
                  <div className="text-left">
                    <div className="font-medium text-sm">{operator.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${operator.status === 'online' ? 'bg-green-500' : operator.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                        {operator.status.charAt(0).toUpperCase() + operator.status.slice(1)}
                      </span>
                      <span>•</span>
                      <span>{operator.activeChats} active chats</span>
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg]" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-2">Transferring to:</div>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-600 text-white">{selectedOperatorForTransfer?.avatar}</AvatarFallback></Avatar>
                <div>
                  <div className="font-medium text-sm">{selectedOperatorForTransfer?.name}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${selectedOperatorForTransfer?.status === 'online' ? 'bg-green-500' : selectedOperatorForTransfer?.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                      {selectedOperatorForTransfer?.status.charAt(0).toUpperCase() + selectedOperatorForTransfer?.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-reason">Reason for Transfer *</Label>
              <Textarea id="transfer-reason" placeholder="E.g., Customer needs technical expertise, requires billing assistance, specialized support needed..." rows={4} value={transferReason} onChange={(e) => setTransferReason(e.target.value)} className="resize-none" />
              <p className="text-xs text-gray-500">This will help the receiving agent understand the context.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setTransferStep('select'); setSelectedOperatorForTransfer(null); setTransferReason(''); }}>Back</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSubmitTransfer} disabled={!transferReason.trim()}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />Transfer Chat
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </>
  );
}

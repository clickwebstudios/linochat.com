import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  MessageCircle,
  Ticket,
  FileText,
  Settings,
  Bell,
  Search,
  LogOut,
  User,
  Menu,
  Plus,
  ChevronDown,
  FolderOpen,
  ArrowRightLeft,
  CreditCard,
  Inbox,
  Loader2,
} from 'lucide-react';
import { mockProjects } from '../../data/mockData';
import { useAuthStore } from '../../stores/authStore';
import { useProjectsStore, selectProjects, selectProjectsLoading } from '../../stores/projectsStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { Checkbox } from '../../components/ui/checkbox';
import { useLayout } from '../../components/layouts/LayoutContext';
import { AddProjectDialog } from '../../components/AddProjectDialog';
import { CreateTicketDialog } from '../../components/CreateTicketDialog';
import { UpdateStatusDialog } from '../../components/UpdateStatusDialog';
import { InitiateTransferDialog } from '../../components/InitiateTransferDialog';
import { AIGenerateKBDialog } from '../../components/AIGenerateKBDialog';
import { AddCategoryDialog, EditCategoryDialog, DeleteCategoryDialog } from '../../components/CategoryDialogs';
import { DashboardView } from '../../components/agent-dashboard/DashboardView';
import { ChatsView } from '../../components/agent-dashboard/ChatsView';
import { TicketsView } from '../../components/agent-dashboard/TicketsView';
import { AgentKnowledgeView } from '../../components/agent-dashboard/AgentKnowledgeView';
import { UsersView } from '../../components/agent-dashboard/UsersView';
import { ProjectsView } from '../../components/agent-dashboard/ProjectsView';
import { ReportsView } from '../../components/agent-dashboard/ReportsView';
import { IntegrationsView } from '../../components/agent-dashboard/IntegrationsView';
import { useHumanRequestedStore } from '../../stores/humanRequestedStore';
import { useTransferRequestsStore } from '../../stores/transferRequestsStore';
import { api } from '../../api/client';
import { initEcho } from '../../lib/echo';
import { playNotificationSound, playTransferRequestSound } from '../../lib/notificationSound';
import type { HumanRequestedPayload } from '../../components/HumanRequestedModal';

type Section = 'dashboard' | 'chats' | 'tickets' | 'knowledge' | 'reports' | 'users' | 'projects' | 'integrations';

// Import CompanySwitcher for Superadmin
import { CompanySwitcher } from '../../components/superadmin/CompanySwitcher';
import { useSuperadminStore } from '../../lib/superadminStore';

export default function AgentDashboard({ role = 'Agent' }: { role?: 'Agent' | 'Admin' | 'Superadmin' } = {}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Detect if this is superadmin from URL or role prop
  const isSuperadmin = role === 'Superadmin' || location.pathname.startsWith('/superadmin');
  const effectiveRole = isSuperadmin ? 'Admin' : role; // Superadmin has same permissions as Admin
  
  // Derive basePath from the URL: /agent/* -> '/agent', /admin/* -> '/admin', /superadmin/* -> '/superadmin'
  const basePath = location.pathname.startsWith('/superadmin') 
    ? '/superadmin' 
    : location.pathname.startsWith('/admin') 
      ? '/admin' 
      : '/agent';
  
  // Derive active section from URL path: /agent/tickets -> 'tickets'
  const pathSegments = location.pathname.split('/');
  const urlSection = pathSegments[2] || 'dashboard';
  const activeSection: Section = (['dashboard', 'chats', 'tickets', 'knowledge', 'reports', 'users', 'projects', 'integrations'].includes(urlSection)
    ? urlSection
    : 'dashboard') as Section;

  // Legacy ?section= query param support - redirect to proper route
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['dashboard', 'chats', 'tickets', 'knowledge', 'reports', 'users', 'projects', 'integrations'].includes(section)) {
      navigate(`${basePath}/${section}`, { replace: true });
    }
  }, [searchParams, basePath, navigate]);

  // Layout context for mobile sidebar
  const { toggleMobileSidebar, setStats } = useLayout();
  const takeoverChatId = useHumanRequestedStore((s) => s.takeoverChatId);
  const takeoverFromAi = useHumanRequestedStore((s) => s.takeoverFromAi);
  const clearTakeover = useHumanRequestedStore((s) => s.clearTakeover);

  // Get user from auth store
  const { user, logout, project } = useAuthStore();
  
  // Superadmin company selection
  const { selectedCompanyId, setSelectedCompany } = useSuperadminStore();
  
  // Use projects store
  const projects = useProjectsStore(selectProjects);
  const projectsLoading = useProjectsStore(selectProjectsLoading);
  const fetchProjects = useProjectsStore(state => state.fetchProjects);
  const addProject = useProjectsStore(state => state.addProject);
  
  // Fetch projects on mount (for non-superadmin)
  useEffect(() => {
    if (user && !isSuperadmin) {
      fetchProjects();
    }
  }, [user, fetchProjects]);
  
  // Fetch projects when company changes (for superadmin)
  useEffect(() => {
    if (user && isSuperadmin) {
      fetchProjects(selectedCompanyId);
    }
  }, [user, isSuperadmin, selectedCompanyId, fetchProjects]);
  
  // Use API projects or fallback to mock
  const displayProjects = projects.length > 0 ? projects : mockProjects;
  
  // Update selectedProjects when projects load
  useEffect(() => {
    if (projects.length > 0) {
      // Filter selectedProjects to only include valid project IDs
      const validProjectIds = projects.map(p => p.id);
      const filteredSelected = selectedProjects.filter(id => validProjectIds.includes(id));
      
      // If no valid projects selected or selection changed, select all
      if (filteredSelected.length === 0 || filteredSelected.length !== selectedProjects.length) {
        setSelectedProjects(validProjectIds);
      }
    }
  }, [projects]);

  // Team members from API (agents/admins who can receive transfers) - must be before WebSocket effect
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string; avatar: string; role: string; status?: string; active_chats_count?: number }>>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);

  const loadTeamMembers = useCallback(async () => {
    if (!user) return;
    setTeamMembersLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: Array<{ id: string; first_name: string; last_name: string; email: string; role: string; status: string; avatar_url?: string; active_chats_count?: number }> }>('/agent/users');
      if (response.success && Array.isArray(response.data)) {
        const mapped = response.data.map((u) => {
          const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email;
          const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
          const roleLabel = u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Agent';
          return { id: String(u.id), name, email: u.email, avatar: initials, role: roleLabel, status: u.status, active_chats_count: u.active_chats_count ?? 0 };
        });
        setTeamMembers(mapped);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
      setTeamMembers([]);
    } finally {
      setTeamMembersLoading(false);
    }
  }, [user, isSuperadmin, selectedCompanyId]);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  const existingTeamMembers = teamMembers.map(({ id, name, email, avatar, role }) => ({ id, name, email, avatar, role }));

  // Load chats from API
  const loadChats = useCallback(async (options?: { setFirstAsActive?: boolean; companyId?: string | null }): Promise<any[]> => {
    if (!user) return [];
    setChatsLoading(true);
    try {
      // Build URL with company_id filter for superadmin
      const targetCompanyId = options?.companyId !== undefined ? options.companyId : selectedCompanyId;
      const endpoint = targetCompanyId && isSuperadmin
        ? `/agent/chats?company_id=${targetCompanyId}`
        : '/agent/chats';

      const data = await api.get<any>(endpoint);
      if (data.success) {
        const chatsData = data.data?.data || data.data || [];
        setChats(chatsData);
        if (options?.setFirstAsActive !== false && chatsData.length > 0) {
          setActiveChat((prev: any) => prev ?? chatsData[0]);
        }
        return chatsData;
      }
      return [];
    } catch (error) {
      console.error('Failed to load chats:', error);
      return [];
    } finally {
      setChatsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !takeoverChatId) {
      loadChats({ companyId: selectedCompanyId });
    }
  }, [user, loadChats, takeoverChatId, selectedCompanyId]);

  // Polling fallback for new chats when WebSocket may not be available
  useEffect(() => {
    if (!user?.id || activeSection !== 'chats') return;
    const interval = setInterval(() => loadChats({ setFirstAsActive: false, companyId: selectedCompanyId }), 15000);
    return () => clearInterval(interval);
  }, [user?.id, activeSection, loadChats, selectedCompanyId]);

  // When takeoverChatId is set (e.g. from Accept on Transfer Request), load chats and open takeover
  useEffect(() => {
    if (!takeoverChatId) return;
    let cancelled = false;
    const fromAi = takeoverFromAi;
    loadChats({ setFirstAsActive: false, companyId: selectedCompanyId }).then((chatsData) => {
      if (cancelled) return;
      const chat = chatsData.find((c: any) => c.id === takeoverChatId);
      if (chat) {
        setActiveChat(chat);
      } else {
        setActiveChat({ id: takeoverChatId });
      }
      setTakeoverFromAiFlag(fromAi);
      setOpenTakeoverForChatId(takeoverChatId);
      clearTakeover();
    });
    return () => { cancelled = true; };
  }, [takeoverChatId, takeoverFromAi, loadChats, clearTakeover]);

  // WebSocket subscription for new chats and chat updates
  useEffect(() => {
    if (!user?.id) return;

    const echo = initEcho();
    if (!echo) {
      console.warn('Echo not initialized - cannot subscribe to real-time updates');
      return;
    }

    console.log(`Subscribing to agent channel: agent.${user.id}`);

    // Subscribe to agent's private channel for new chats
    const channel = echo.private(`agent.${user.id}`);

    // Listen for new chat events
    channel.listen('.new.chat', (event: any) => {
      console.log('New chat received:', event);

      const chat = event?.chat;
      if (!chat?.id) return;

      // Add new chat to the list
      setChats(prev => {
        if (prev.find(c => String(c.id) === String(chat.id))) return prev;
        return [chat, ...prev];
      });
      // Refresh team members (active chat counts changed)
      loadTeamMembers();
      // Play notification sound for new chat
      playNotificationSound();
    });

    // Listen for chat status updates
    channel.listen('.chat.status.updated', (event: any) => {
      console.log('Chat status updated:', event);
      
      setChats(prev => 
        prev.map(chat => {
          if (chat.id === event.chat_id) {
            return {
              ...chat,
              status: event.status,
              agent_id: event.agent_id,
              agent_name: event.agent_name ?? (event.agent_id ? chat.agent_name : null),
            };
          }
          return chat;
        })
      );
      // Refresh team members (active chat counts changed)
      loadTeamMembers();
    });

    return () => {
      console.log(`Leaving agent channel: agent.${user.id}`);
      channel.stopListening('.new.chat');
      channel.stopListening('.chat.status.updated');
      echo.leave(`agent.${user.id}`);
    };
  }, [user?.id, loadTeamMembers]);

  // Load tickets from API
  const loadTickets = useCallback(async (companyId?: string | null) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setTicketsLoading(false);
      return;
    }

    setTicketsLoading(true);
    try {
      const targetCompanyId = companyId !== undefined ? companyId : selectedCompanyId;
      const endpoint = targetCompanyId && isSuperadmin
        ? `/agent/tickets?company_id=${targetCompanyId}`
        : '/agent/tickets';

      const data = await api.get<any>(endpoint);
      if (data.success) {
        const ticketsData = data.data?.data || data.data || [];
        setTickets(ticketsData);
        setStats(prev => ({ ...prev, tickets: ticketsData.length }));
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setTicketsLoading(false);
    }
  }, [isSuperadmin, selectedCompanyId, setStats]);
  
  // Fetch tickets on mount
  useEffect(() => {
    if (user && !isSuperadmin) {
      loadTickets();
    }
  }, [user, loadTickets]);
  
  // Fetch tickets when company changes (for superadmin)
  useEffect(() => {
    if (user && isSuperadmin) {
      loadTickets(selectedCompanyId);
    }
  }, [user, isSuperadmin, selectedCompanyId, loadTickets]);

  const [activeChat, setActiveChat] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);

  // Derive unread count from chats and update sidebar badge (stats.chats = unread, not total)
  useEffect(() => {
    const unreadCount = chats.reduce((sum, c) => sum + (c.unread_count ?? c.unread ?? 0), 0);
    setStats(prev => ({ ...prev, chats: unreadCount }));
  }, [chats, setStats]);

  // Keep activeChat in sync with chats when updated via WebSocket
  useEffect(() => {
    if (activeChat?.id && chats.length > 0) {
      const updated = chats.find(c => c.id === activeChat.id);
      if (updated && (updated.status !== activeChat.status || updated.agent_id !== activeChat.agent_id || updated.agent_name !== activeChat.agent_name)) {
        setActiveChat(updated);
      }
    }
  }, [chats]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'pending' | 'closed'>('all');
  const [chatFilter, setChatFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  // Temporary state for project selection in dropdown (before Apply is clicked)
  const [tempSelectedProjects, setTempSelectedProjects] = useState<string[]>([]);
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<'online' | 'away' | 'offline'>('online');
  const [openTakeoverForChatId, setOpenTakeoverForChatId] = useState<string | null>(null);
  const [takeoverFromAiFlag, setTakeoverFromAiFlag] = useState(false);
  const transferRequests = useTransferRequestsStore((s) => s.requests);
  const pendingHumanRequests = useTransferRequestsStore((s) => s.pendingHumanRequests);
  const setDialogOpen = useTransferRequestsStore((s) => s.setDialogOpen);
  const refreshFn = useTransferRequestsStore((s) => s.refreshFn);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Load notifications from API
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      setNotificationsLoading(true);
      try {
        const response = await api.get('/notifications');
        if (response.success) {
          setNotifications(response.data || []);
        }
      } catch (error) {
        // Silently fail - notifications not critical
        console.log('Notifications API not available');
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };
    loadNotifications();
  }, [user]);

  const transferRequestsCount = transferRequests.length + pendingHumanRequests.length;
  // transferStep, selectedOperatorForTransfer, transferReason are local to ChatsView's own transfer dialog
  const [hasKnowledgeBase, setHasKnowledgeBase] = useState(false);
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false);
  // aiWebsiteUrl is now managed internally by AIGenerateKBDialog
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  // newCategoryName is now managed internally by AddCategoryDialog
  const [categories, setCategories] = useState<Array<{ id: string; name: string; articleCount: number }>>([
    { id: '1', name: 'Getting Started', articleCount: 5 },
    { id: '2', name: 'Account Management', articleCount: 8 },
    { id: '3', name: 'Billing & Payments', articleCount: 6 },
    { id: '4', name: 'Technical Support', articleCount: 12 },
  ]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  // editCategoryName is now managed internally by EditCategoryDialog
  const [deleteCategoryConfirmOpen, setDeleteCategoryConfirmOpen] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [categoryArticles, setCategoryArticles] = useState<Record<string, Array<{ id: string; title: string; views: number; helpful: number; status: 'published' | 'draft'; updatedAt: string }>>>({
    '1': [
      { id: 'a1', title: 'Getting Started with LinoChat', views: 1250, helpful: 45, status: 'published', updatedAt: '2026-02-08' },
      { id: 'a2', title: 'Setting Up Your First Project', views: 980, helpful: 38, status: 'published', updatedAt: '2026-02-06' },
      { id: 'a3', title: 'Understanding the Dashboard', views: 870, helpful: 29, status: 'published', updatedAt: '2026-02-05' },
      { id: 'a4', title: 'Quick Start: Chat Widget Installation', views: 1100, helpful: 52, status: 'published', updatedAt: '2026-02-04' },
      { id: 'a5', title: 'Onboarding Checklist for New Users', views: 640, helpful: 21, status: 'draft', updatedAt: '2026-02-03' },
    ],
    '2': [
      { id: 'a6', title: 'How to Reset Your Password', views: 890, helpful: 78, status: 'published', updatedAt: '2026-02-09' },
      { id: 'a7', title: 'Managing Team Members', views: 560, helpful: 34, status: 'published', updatedAt: '2026-02-07' },
      { id: 'a8', title: 'Updating Profile Information', views: 430, helpful: 22, status: 'published', updatedAt: '2026-02-06' },
      { id: 'a9', title: 'Two-Factor Authentication Setup', views: 720, helpful: 41, status: 'published', updatedAt: '2026-02-05' },
      { id: 'a10', title: 'Role Permissions Explained', views: 610, helpful: 36, status: 'published', updatedAt: '2026-02-04' },
      { id: 'a11', title: 'Account Deactivation Guide', views: 290, helpful: 15, status: 'draft', updatedAt: '2026-02-03' },
      { id: 'a12', title: 'SSO Configuration', views: 380, helpful: 27, status: 'published', updatedAt: '2026-02-02' },
      { id: 'a13', title: 'API Key Management', views: 450, helpful: 31, status: 'published', updatedAt: '2026-02-01' },
    ],
    '3': [
      { id: 'a14', title: 'Billing FAQs', views: 560, helpful: 34, status: 'published', updatedAt: '2026-02-08' },
      { id: 'a15', title: 'Understanding Your Invoice', views: 480, helpful: 28, status: 'published', updatedAt: '2026-02-06' },
      { id: 'a16', title: 'Upgrading Your Plan', views: 720, helpful: 45, status: 'published', updatedAt: '2026-02-05' },
      { id: 'a17', title: 'Payment Methods Guide', views: 390, helpful: 19, status: 'published', updatedAt: '2026-02-04' },
      { id: 'a18', title: 'Refund Policy', views: 310, helpful: 16, status: 'published', updatedAt: '2026-02-03' },
      { id: 'a19', title: 'Tax & Compliance Information', views: 250, helpful: 12, status: 'draft', updatedAt: '2026-02-02' },
    ],
    '4': [
      { id: 'a20', title: 'Troubleshooting Chat Widget Issues', views: 1340, helpful: 67, status: 'published', updatedAt: '2026-02-09' },
      { id: 'a21', title: 'API Integration Guide', views: 980, helpful: 54, status: 'published', updatedAt: '2026-02-08' },
      { id: 'a22', title: 'Webhook Configuration', views: 870, helpful: 43, status: 'published', updatedAt: '2026-02-07' },
      { id: 'a23', title: 'Error Codes Reference', views: 1120, helpful: 61, status: 'published', updatedAt: '2026-02-06' },
      { id: 'a24', title: 'Performance Optimization Tips', views: 760, helpful: 39, status: 'published', updatedAt: '2026-02-05' },
      { id: 'a25', title: 'Mobile SDK Setup', views: 640, helpful: 32, status: 'published', updatedAt: '2026-02-04' },
      { id: 'a26', title: 'Browser Compatibility Guide', views: 520, helpful: 25, status: 'published', updatedAt: '2026-02-03' },
      { id: 'a27', title: 'Debugging Network Issues', views: 890, helpful: 48, status: 'published', updatedAt: '2026-02-02' },
      { id: 'a28', title: 'Custom CSS Styling Guide', views: 430, helpful: 22, status: 'draft', updatedAt: '2026-02-01' },
      { id: 'a29', title: 'Firewall & Proxy Configuration', views: 380, helpful: 18, status: 'published', updatedAt: '2026-01-31' },
      { id: 'a30', title: 'Data Export & Backup', views: 510, helpful: 29, status: 'published', updatedAt: '2026-01-30' },
      { id: 'a31', title: 'Server Status & Monitoring', views: 340, helpful: 14, status: 'draft', updatedAt: '2026-01-29' },
    ],
  });
  const [createTicketDialogOpen, setCreateTicketDialogOpen] = useState(false);
  // newTicket state is now managed internally by CreateTicketDialog
  const [initiateTransferDialogOpen, setInitiateTransferDialogOpen] = useState(false);
  // transferData state is now managed internally by InitiateTransferDialog

  // Holds the chat payload when AI triggers a human-transfer request
  const [aiTransferPayload, setAiTransferPayload] = useState<HumanRequestedPayload | null>(null);

  const chartData = [
    { name: 'Mon', tickets: 24 },
    { name: 'Tue', tickets: 35 },
    { name: 'Wed', tickets: 28 },
    { name: 'Thu', tickets: 42 },
    { name: 'Fri', tickets: 38 },
    { name: 'Sat', tickets: 18 },
    { name: 'Sun', tickets: 12 },
  ];

  const responseTimeData = [
    { time: '9 AM', minutes: 3.2 },
    { time: '11 AM', minutes: 2.8 },
    { time: '1 PM', minutes: 4.1 },
    { time: '3 PM', minutes: 2.5 },
    { time: '5 PM', minutes: 3.8 },
  ];

  const ticketStatusData = [
    { name: 'Open', value: 45, color: '#3b82f6' },
    { name: 'Pending', value: 30, color: '#f59e0b' },
    { name: 'Resolved', value: 80, color: '#10b981' },
    { name: 'Closed', value: 25, color: '#6b7280' },
  ];

  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = ticketFilter === 'all' || ticket.status === ticketFilter;
    const matchesSearch = searchQuery === '' || 
      ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProjects.length === 0 || selectedProjects.includes(ticket.project_id);
    return matchesFilter && matchesSearch && matchesProject;
  });

  const filteredChats = chats.filter(chat => {
    const matchesProject = selectedProjects.length === 0 || selectedProjects.includes(chat.project_id);
    const matchesStatus = chatFilter === 'all' || 
      (chatFilter === 'active' && (chat.status === 'active' || chat.status === 'waiting' || chat.status === 'ai_handling')) ||
      (chatFilter === 'closed' && chat.status === 'closed');
    const matchesSearch = searchQuery === '' ||
      chat.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(chat.id).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesStatus && matchesSearch;
  });

  const getProjectById = (projectId: string) => {
    return projects.find(p => p.id === projectId) || displayProjects.find(p => p.id === projectId);
  };

  const handleProjectCreated = async (createdProject: { id: string; name: string; description: string; color: string; website: string }) => {
    console.log('Project created:', createdProject);
    
    // Add to store
    addProject({
      id: createdProject.id,
      name: createdProject.name,
      slug: createdProject.name.toLowerCase().replace(/\s+/g, '-'),
      website: createdProject.website,
      color: createdProject.color,
      status: 'active',
      description: createdProject.description,
    });
    
    // Navigate to the new project
    if (createdProject.id) {
      const projectUrl = `${basePath}/project/${createdProject.id}`;
      console.log('Navigating to:', projectUrl, 'basePath:', basePath);
      navigate(projectUrl);
    }
  };

  // Render active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardView
            filteredChats={filteredChats}
            getProjectById={getProjectById}
            existingTeamMembers={existingTeamMembers}
            basePath={basePath}
            role={role}
          />
        );
      case 'chats':
        return (
          <ChatsView
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            filteredChats={filteredChats}
            chatFilter={chatFilter}
            setChatFilter={setChatFilter}
            getProjectById={getProjectById}
            projects={displayProjects}
            role={role}
            teamMembers={teamMembers}
            currentUserId={user?.id}
            onRefreshTeamMembers={loadTeamMembers}
            onChatsUpdate={(updater) => setChats(updater(chats))}
            openTakeoverForChatId={openTakeoverForChatId}
            takeoverFromAi={takeoverFromAiFlag}
            onTakeoverTriggerHandled={() => { setOpenTakeoverForChatId(null); setTakeoverFromAiFlag(false); }}
            onTakeOverComplete={() => loadChats({ setFirstAsActive: false, companyId: selectedCompanyId })}
            onHumanRequestedInChat={(payload) => {
              useTransferRequestsStore.getState().addHumanRequested(payload);
              useTransferRequestsStore.getState().setDialogOpen(true);
              playTransferRequestSound();
            }}
          />
        );
      case 'tickets':
        return (
          <TicketsView
            filteredTickets={filteredTickets}
            allTickets={tickets}
            ticketFilter={ticketFilter}
            setTicketFilter={setTicketFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            getProjectById={getProjectById}
            basePath={basePath}
            onCreateTicketClick={() => setCreateTicketDialogOpen(true)}
          />
        );
      case 'knowledge':
        return <AgentKnowledgeView basePath={basePath} selectedCompanyId={selectedCompanyId} />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UsersView basePath={basePath} selectedProjects={selectedProjects} selectedCompanyId={selectedCompanyId} />;
      case 'projects':
        return (
          <ProjectsView
            basePath={basePath}
            onAddProjectClick={() => setAddProjectDialogOpen(true)}
          />
        );
      case 'integrations':
        return <IntegrationsView />;
      default:
        return (
          <DashboardView
            filteredChats={filteredChats}
            getProjectById={getProjectById}
            existingTeamMembers={existingTeamMembers}
            basePath={basePath}
            role={role}
          />
        );
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Company Switcher - Only for Superadmin */}
            {isSuperadmin && (
              <CompanySwitcher 
                selectedCompanyId={selectedCompanyId}
                onCompanyChange={(id) => {
                  setSelectedCompany(id, null);
                }}
              />
            )}
            
            {/* Project Selector - Hidden when Projects section is active */}
            {activeSection !== 'projects' && activeSection !== 'dashboard' && (
              <Popover 
                open={projectPopoverOpen} 
                onOpenChange={(open) => {
                  setProjectPopoverOpen(open);
                  // Sync temp state with actual state when opening
                  if (open) {
                    setTempSelectedProjects(selectedProjects);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="hidden md:flex items-center gap-2 h-10">
                    <FolderOpen className="h-4 w-4" />
                    <span className="text-sm">
                      {selectedProjects.length === displayProjects.length 
                        ? 'All Projects' 
                        : selectedProjects.length === 1
                        ? displayProjects.find(p => p.id === selectedProjects[0])?.name
                        : `${selectedProjects.length} Projects`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">Select Projects</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        if (tempSelectedProjects.length === displayProjects.length) {
                          setTempSelectedProjects([]);
                        } else {
                          setTempSelectedProjects(displayProjects.map(p => p.id));
                        }
                      }}
                    >
                      {tempSelectedProjects.length === displayProjects.length ? 'Clear' : 'Select All'}
                    </Button>
                  </div>
                  {displayProjects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`header-${project.id}`}
                        checked={tempSelectedProjects.includes(project.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTempSelectedProjects([...tempSelectedProjects, project.id]);
                          } else {
                            setTempSelectedProjects(tempSelectedProjects.filter(id => id !== project.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={`header-${project.id}`}
                        className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                      >
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: project.color }}
                        />
                        <span>{project.name}</span>
                      </label>
                    </div>
                  ))}
                  
                  {/* Apply Button */}
                  <div className="pt-2 border-t">
                    <Button 
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setSelectedProjects(tempSelectedProjects);
                        setProjectPopoverOpen(false);
                        // Reload data with new project selection
                        if (isSuperadmin) {
                          fetchProjects(selectedCompanyId);
                          loadChats({ companyId: selectedCompanyId });
                          loadTickets(selectedCompanyId);
                        } else {
                          fetchProjects();
                          loadChats();
                          loadTickets();
                        }
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                  
                  {/* New Project Button */}
                  <div className="pt-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setProjectPopoverOpen(false);
                        setAddProjectDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      New Project
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            )}
            
            <div className="relative w-96 hidden md:block">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets, chats, customers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {(notifications.filter((n: any) => !n.read).length > 0 || transferRequestsCount > 0) && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                {/* Mobile: Transfer actions (header buttons are hidden on md) */}
                <div className="md:hidden flex flex-col border-b">
                  <DropdownMenuItem onClick={() => setDialogOpen(true)}>
                    <Inbox className="h-4 w-4 mr-2" />
                    Transfer Requests
                    {transferRequestsCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {transferRequestsCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setInitiateTransferDialogOpen(true)}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer Chat
                  </DropdownMenuItem>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {notifications.filter((n: any) => !n.read).length} New
                  </Badge>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <p className="text-sm text-gray-500">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {notifications.map((notification: any) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-2 ${
                            notification.read ? 'border-transparent' : 'border-blue-600 bg-blue-50/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                notification.type === 'chat' ? 'bg-blue-100' :
                                notification.type === 'ticket' ? 'bg-orange-100' :
                                notification.type === 'transfer' ? 'bg-green-100' :
                                'bg-purple-100'
                              }`}
                            >
                              {notification.type === 'chat' && <MessageCircle className="h-4 w-4 text-blue-600" />}
                              {notification.type === 'ticket' && <Ticket className="h-4 w-4 text-orange-600" />}
                              {notification.type === 'transfer' && <ArrowRightLeft className="h-4 w-4 text-green-600" />}
                              {notification.type === 'article' && <FileText className="h-4 w-4 text-purple-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 border-t">
                  <Link
                    to={`${basePath}/notifications`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all notifications
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setInitiateTransferDialogOpen(true)}
                title="Transfer Chat"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setDialogOpen(true)}
                title="Transfer Requests"
              >
                <Inbox className="h-4 w-4" />
                {transferRequestsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {transferRequestsCount}
                  </span>
                )}
              </Button>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 hidden md:inline-flex"
              onClick={() => setCreateTicketDialogOpen(true)}
            >
              + New Ticket
            </Button>
            {/* Agent Info - Right side after new ticket button */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l">
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user ? `${user.first_name[0]}${user.last_name[0]}` : '??'}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                  userStatus === 'online' ? 'bg-green-500' :
                  userStatus === 'away' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`}></span>
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                </div>
                <div className="text-xs text-gray-500 capitalize">{user?.role || role}</div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`${basePath}/profile-settings`} className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`${basePath}/billing`} className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusDialogOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Update Status
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => { logout(); navigate('/'); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={`flex-1 overflow-y-auto bg-gray-50 ${activeSection === 'chats' ? 'p-0' : 'p-6'}`}>
          {renderContent()}
        </main>

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={addProjectDialogOpen}
        onOpenChange={setAddProjectDialogOpen}
        onProjectCreated={handleProjectCreated}
      />

      {/* Update Status Dialog */}
      <UpdateStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        status={userStatus}
        onStatusChange={setUserStatus}
      />

      {/* Create Ticket Dialog */}
      <CreateTicketDialog
        open={createTicketDialogOpen}
        onOpenChange={setCreateTicketDialogOpen}
        teamMembers={existingTeamMembers}
        onTicketCreated={() => {
          loadTickets(isSuperadmin ? selectedCompanyId : undefined);
        }}
      />

      {/* AI Knowledge Base Generation Dialog */}
      <AIGenerateKBDialog
        open={aiGenerateDialogOpen}
        onOpenChange={setAiGenerateDialogOpen}
        onGenerate={(projectId) => {
          setHasKnowledgeBase(true);
        }}
      />

      {/* Add Category Dialog */}
      <AddCategoryDialog
        open={addCategoryDialogOpen}
        onOpenChange={setAddCategoryDialogOpen}
        onAdd={(name) => {
          const newCategory = {
            id: Date.now().toString(),
            name,
            articleCount: 0,
          };
          setCategories([...categories, newCategory]);
        }}
      />

      {/* Edit Category Dialog */}
      <EditCategoryDialog
        open={editCategoryDialogOpen}
        onOpenChange={(open) => {
          setEditCategoryDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}
        category={editingCategory}
        onSave={(id, newName) => {
          setCategories(prev => prev.map(c =>
            c.id === id ? { ...c, name: newName } : c
          ));
          setEditingCategory(null);
        }}
      />

      {/* Delete Category Confirmation Dialog */}
      <DeleteCategoryDialog
        open={deleteCategoryConfirmOpen}
        onOpenChange={(open) => {
          setDeleteCategoryConfirmOpen(open);
          if (!open) setDeletingCategoryId(null);
        }}
        categoryName={categories.find(c => c.id === deletingCategoryId)?.name || ''}
        articleCount={deletingCategoryId ? (categoryArticles[deletingCategoryId]?.length ?? 0) : 0}
        onConfirmDelete={() => {
          if (deletingCategoryId) {
            setCategories(prev => prev.filter(c => c.id !== deletingCategoryId));
            setCategoryArticles(prev => {
              const updated = { ...prev };
              delete updated[deletingCategoryId];
              return updated;
            });
            if (expandedCategoryId === deletingCategoryId) {
              setExpandedCategoryId(null);
            }
            setDeleteCategoryConfirmOpen(false);
            setDeletingCategoryId(null);
          }
        }}
      />

      {/* Initiate Transfer Dialog — opened manually by agent OR auto-triggered when customer asks AI for human */}
      <InitiateTransferDialog
        open={initiateTransferDialogOpen}
        onOpenChange={(open) => {
          setInitiateTransferDialogOpen(open);
          if (!open) setAiTransferPayload(null); // clear AI-transfer context on close
        }}
        activeChat={
          aiTransferPayload
            ? {
                id: aiTransferPayload.chat_id,
                customer: aiTransferPayload.customer_name,
                avatar: (aiTransferPayload.customer_name || 'G')
                  .trim()
                  .split(/\s+/)
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2),
                status: 'active',
                preview: 'Customer requested human assistance',
              }
            : activeChat
        }
        teamMembers={existingTeamMembers}
        currentAgentId={user?.id}
        onTransferSubmitted={async (data) => {
          const chatId = aiTransferPayload?.chat_id || activeChat?.id;
          if (!chatId) return;
          const reasonLabels: Record<string, string> = {
            expertise: 'Requires specialized expertise',
            language: 'Language preference',
            workload: 'Workload management',
            technical: 'Technical issue beyond my scope',
            escalation: 'Escalation required',
            unavailable: 'Going offline/unavailable',
            other: data.notes || 'Other',
          };
          try {
            await api.post('/agent/transfer-requests', {
              chat_id: chatId,
              to_agent_id: data.targetAgentId,
              reason: reasonLabels[data.reason] || data.reason,
            });
            refreshFn?.();
          } catch (err) {
            console.error('Failed to create transfer request:', err);
          }
        }}
      />
    </>
  );
}
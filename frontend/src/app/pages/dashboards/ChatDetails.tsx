import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  ArrowLeft,
  Send,
  Paperclip,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Settings,
  Bell,
  LogOut,
  Search,
  Menu,
  ChevronDown,
  MessageSquare,
  FileText,
  Bookmark,
  Plus,
  Star,
  Tag,
  History,
  RefreshCw,
  ArrowUpRight,
  Ticket,
  X,
  Info,
} from 'lucide-react';
import { Sheet, SheetContent } from '../../components/ui/sheet';
import { AdminSidebar } from '../../components/AdminSidebar';
import { mockProjects } from '../../data/mockData';
import { useLayout } from '../../components/layouts/LayoutContext';
import { api } from '../../api/client';

// Extended chat data for chats referenced from ProjectDetails (CHAT-xxxx IDs)
const projectChats: Record<string, {
  id: string;
  customer: string;
  avatar: string;
  email: string;
  phone: string;
  location: string;
  subject: string;
  status: string;
  priority: string;
  assignedTo: string;
  projectName: string;
  created: string;
  lastActivity: string;
  customerSince: string;
  totalChats: number;
  satisfaction: number;
}> = {
  'CHAT-1234': {
    id: 'CHAT-1234',
    customer: 'John Doe',
    avatar: 'JD',
    email: 'john.doe@example.com',
    phone: '+1 (555) 234-5678',
    location: 'New York, NY',
    subject: 'Login issue on mobile app',
    status: 'Open',
    priority: 'High',
    assignedTo: 'Sarah Johnson',
    projectName: 'Mobile App',
    created: '2 hours ago',
    lastActivity: '5 min ago',
    customerSince: 'Mar 2024',
    totalChats: 8,
    satisfaction: 4.2,
  },
  'CHAT-1235': {
    id: 'CHAT-1235',
    customer: 'Jane Smith',
    avatar: 'JS',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 345-6789',
    location: 'Los Angeles, CA',
    subject: 'Payment processing error',
    status: 'In Progress',
    priority: 'Critical',
    assignedTo: 'Mike Chen',
    projectName: 'E-Commerce Platform',
    created: '4 hours ago',
    lastActivity: '15 min ago',
    customerSince: 'Jan 2024',
    totalChats: 14,
    satisfaction: 3.8,
  },
  'CHAT-1236': {
    id: 'CHAT-1236',
    customer: 'Bob Wilson',
    avatar: 'BW',
    email: 'bob.wilson@example.com',
    phone: '+1 (555) 456-7890',
    location: 'Chicago, IL',
    subject: 'Feature request: Dark mode',
    status: 'Resolved',
    priority: 'Low',
    assignedTo: 'Sarah Johnson',
    projectName: 'Web Dashboard',
    created: '1 day ago',
    lastActivity: '3 hours ago',
    customerSince: 'Jun 2023',
    totalChats: 22,
    satisfaction: 4.8,
  },
  'CHAT-1237': {
    id: 'CHAT-1237',
    customer: 'Alice Brown',
    avatar: 'AB',
    email: 'alice.brown@example.com',
    phone: '+1 (555) 567-8901',
    location: 'Seattle, WA',
    subject: 'Account settings not saving',
    status: 'Open',
    priority: 'Medium',
    assignedTo: 'Team Member 3',
    projectName: 'Web Dashboard',
    created: '2 days ago',
    lastActivity: '1 hour ago',
    customerSince: 'Sep 2023',
    totalChats: 5,
    satisfaction: 4.0,
  },
  'CHAT-1238': {
    id: 'CHAT-1238',
    customer: 'Charlie Davis',
    avatar: 'CD',
    email: 'charlie.davis@example.com',
    phone: '+1 (555) 678-9012',
    location: 'Austin, TX',
    subject: 'Email notifications not working',
    status: 'Resolved',
    priority: 'Low',
    assignedTo: 'Mike Chen',
    projectName: 'Notification Service',
    created: '3 days ago',
    lastActivity: '1 day ago',
    customerSince: 'Nov 2023',
    totalChats: 11,
    satisfaction: 4.5,
  },
  'CHAT-1239': {
    id: 'CHAT-1239',
    customer: 'Eva Martinez',
    avatar: 'EM',
    email: 'eva.martinez@example.com',
    phone: '+1 (555) 789-0123',
    location: 'Miami, FL',
    subject: 'Integration with third-party API',
    status: 'In Progress',
    priority: 'High',
    assignedTo: 'Sarah Johnson',
    projectName: 'API Gateway',
    created: '5 days ago',
    lastActivity: '2 hours ago',
    customerSince: 'Aug 2023',
    totalChats: 6,
    satisfaction: 4.3,
  },
};

// Mock conversation messages keyed by chat ID
const projectChatMessages: Record<string, Array<{
  id: string;
  sender: 'customer' | 'agent' | 'system';
  name: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}>> = {
  'CHAT-1234': [
    { id: 'pc-1', sender: 'customer', name: 'John Doe', text: "Hi, I'm unable to log into the mobile app. It keeps showing an error after I enter my credentials.", timestamp: '2 hours ago', isRead: true },
    { id: 'pc-2', sender: 'agent', name: 'Sarah Johnson', text: "Hello John! I'm sorry to hear that. Can you tell me which version of the app you're using and what device you're on?", timestamp: '1 hour 55 min ago', isRead: true },
    { id: 'pc-3', sender: 'customer', name: 'John Doe', text: "I'm on iPhone 15 Pro, running iOS 17.4. The app version is 3.2.1.", timestamp: '1 hour 50 min ago', isRead: true },
    { id: 'pc-4', sender: 'agent', name: 'Sarah Johnson', text: "Thank you for that information. We've identified a known issue with version 3.2.1 on iOS 17.4. A patch (v3.2.2) is being rolled out. In the meantime, could you try clearing the app cache? Go to Settings > App > Clear Cache.", timestamp: '1 hour 45 min ago', isRead: true },
    { id: 'pc-5', sender: 'customer', name: 'John Doe', text: "I cleared the cache but still getting the same error. Is there an ETA on the patch?", timestamp: '30 min ago', isRead: true },
    { id: 'pc-6', sender: 'system', name: 'System', text: 'Priority escalated from Medium to High', timestamp: '25 min ago', isRead: true },
    { id: 'pc-7', sender: 'agent', name: 'Sarah Johnson', text: "The patch should be available in the App Store within the next 2-3 hours. I'll personally follow up once it's live. In the meantime, you can use the web version at app.example.com to access your account.", timestamp: '20 min ago', isRead: true },
    { id: 'pc-8', sender: 'customer', name: 'John Doe', text: "OK, I'll use the web version for now. Thanks for the quick response!", timestamp: '5 min ago', isRead: false },
  ],
  'CHAT-1235': [
    { id: 'pc-9', sender: 'customer', name: 'Jane Smith', text: "I'm getting an error when trying to process payments. The error code is PAY-502.", timestamp: '4 hours ago', isRead: true },
    { id: 'pc-10', sender: 'agent', name: 'Mike Chen', text: "Hi Jane, I apologize for the inconvenience. Error PAY-502 indicates a gateway timeout. Let me check our payment processor status.", timestamp: '3 hours 50 min ago', isRead: true },
    { id: 'pc-11', sender: 'system', name: 'System', text: 'Linked to incident INC-2024-0891: Payment Gateway Degradation', timestamp: '3 hours 45 min ago', isRead: true },
    { id: 'pc-12', sender: 'agent', name: 'Mike Chen', text: "I've confirmed there's an ongoing issue with our payment provider. Our engineering team is working on it. This is affecting a small number of transactions. Would you like me to process your order manually in the meantime?", timestamp: '3 hours 40 min ago', isRead: true },
    { id: 'pc-13', sender: 'customer', name: 'Jane Smith', text: "Yes, please! It's a time-sensitive order. Order #ORD-78432.", timestamp: '3 hours 30 min ago', isRead: true },
    { id: 'pc-14', sender: 'agent', name: 'Mike Chen', text: "I've manually processed order #ORD-78432. You should receive a confirmation email shortly. I'll keep this chat open and update you once the payment system is fully restored.", timestamp: '3 hours 20 min ago', isRead: true },
    { id: 'pc-15', sender: 'customer', name: 'Jane Smith', text: 'Got the confirmation. Thank you for the quick help!', timestamp: '15 min ago', isRead: false },
  ],
  'CHAT-1236': [
    { id: 'pc-16', sender: 'customer', name: 'Bob Wilson', text: "I'd love to see a dark mode option in the web dashboard. The bright white background is hard on the eyes during late-night sessions.", timestamp: '1 day ago', isRead: true },
    { id: 'pc-17', sender: 'agent', name: 'Sarah Johnson', text: "Hi Bob! Thank you for the feedback. Dark mode is actually on our roadmap for Q2. I'll add your vote to the feature request.", timestamp: '1 day ago', isRead: true },
    { id: 'pc-18', sender: 'customer', name: 'Bob Wilson', text: "That's great to hear! Any chance of a beta preview?", timestamp: '1 day ago', isRead: true },
    { id: 'pc-19', sender: 'agent', name: 'Sarah Johnson', text: "Absolutely! I've added you to our beta tester list. You'll receive an email invite once the dark mode beta is ready, likely in the next 3-4 weeks.", timestamp: '23 hours ago', isRead: true },
    { id: 'pc-20', sender: 'system', name: 'System', text: 'Chat resolved by Sarah Johnson', timestamp: '3 hours ago', isRead: true },
    { id: 'pc-21', sender: 'customer', name: 'Bob Wilson', text: 'Perfect, looking forward to it. Thanks Sarah!', timestamp: '3 hours ago', isRead: true },
  ],
  'CHAT-1237': [
    { id: 'pc-22', sender: 'customer', name: 'Alice Brown', text: "When I try to update my account settings (display name, timezone), the changes don't persist. After refreshing, everything reverts back.", timestamp: '2 days ago', isRead: true },
    { id: 'pc-23', sender: 'agent', name: 'Team Member 3', text: "Hi Alice, thank you for reporting this. Are you seeing any error messages when you click Save?", timestamp: '2 days ago', isRead: true },
    { id: 'pc-24', sender: 'customer', name: 'Alice Brown', text: "No error messages — it shows a green 'Saved successfully' toast, but the changes don't stick.", timestamp: '2 days ago', isRead: true },
    { id: 'pc-25', sender: 'agent', name: 'Team Member 3', text: "That's unusual. Could you try clearing your browser cache and cookies, then attempt the update again? Also, which browser are you using?", timestamp: '1 day ago', isRead: true },
    { id: 'pc-26', sender: 'customer', name: 'Alice Brown', text: "I'm using Chrome 122. Clearing cache didn't help — same behavior.", timestamp: '1 hour ago', isRead: false },
  ],
  'CHAT-1238': [
    { id: 'pc-27', sender: 'customer', name: 'Charlie Davis', text: "I'm not receiving any email notifications for new messages or ticket updates. I checked my spam folder too.", timestamp: '3 days ago', isRead: true },
    { id: 'pc-28', sender: 'agent', name: 'Mike Chen', text: "Hi Charlie, let me check your notification settings and email delivery logs.", timestamp: '3 days ago', isRead: true },
    { id: 'pc-29', sender: 'agent', name: 'Mike Chen', text: "I found the issue — your notification preferences were reset during our last platform update. I've re-enabled all email notifications for your account. You should start receiving them again within the next 15 minutes.", timestamp: '3 days ago', isRead: true },
    { id: 'pc-30', sender: 'customer', name: 'Charlie Davis', text: "Just received a test notification. Everything is working now. Thank you!", timestamp: '3 days ago', isRead: true },
    { id: 'pc-31', sender: 'system', name: 'System', text: 'Chat resolved by Mike Chen', timestamp: '3 days ago', isRead: true },
  ],
  'CHAT-1239': [
    { id: 'pc-32', sender: 'customer', name: 'Eva Martinez', text: "I'm having trouble integrating our system with a third-party API. The API documentation is unclear.", timestamp: '5 days ago', isRead: true },
    { id: 'pc-33', sender: 'agent', name: 'Sarah Johnson', text: "Hi Eva, I understand. Let's go through the API documentation together. Can you share the specific API endpoint you're trying to use?", timestamp: '4 days ago', isRead: true },
    { id: 'pc-34', sender: 'customer', name: 'Eva Martinez', text: "Sure, it's the /api/v1/data endpoint. I'm trying to fetch user data.", timestamp: '4 days ago', isRead: true },
    { id: 'pc-35', sender: 'agent', name: 'Sarah Johnson', text: "Got it. The /api/v1/data endpoint requires an API key for authentication. Make sure you're including the 'Authorization' header with your request.", timestamp: '4 days ago', isRead: true },
    { id: 'pc-36', sender: 'customer', name: 'Eva Martinez', text: "I added the 'Authorization' header, but I'm still getting a 401 Unauthorized error.", timestamp: '2 days ago', isRead: true },
    { id: 'pc-37', sender: 'agent', name: 'Sarah Johnson', text: "Let's verify the API key. Can you double-check that the key is correct and hasn't expired?", timestamp: '2 days ago', isRead: true },
    { id: 'pc-38', sender: 'customer', name: 'Eva Martinez', text: "Yes, the key is correct and hasn't expired. I'm still getting the error.", timestamp: '2 days ago', isRead: true },
    { id: 'pc-39', sender: 'agent', name: 'Sarah Johnson', text: "I'll escalate this to our engineering team. They'll take a closer look at the API endpoint and help resolve the issue.", timestamp: '2 hours ago', isRead: true },
    { id: 'pc-40', sender: 'customer', name: 'Eva Martinez', text: "Thank you, Sarah. I appreciate your help.", timestamp: '2 hours ago', isRead: false },
  ],
};

// Activity timeline for each chat
const chatActivityTimeline: Record<string, Array<{
  time: string;
  action: string;
  user: string;
}>> = {
  'CHAT-1234': [
    { time: '2 hours ago', action: 'Chat started', user: 'John Doe' },
    { time: '1 hour 55 min ago', action: 'Assigned to Sarah Johnson', user: 'System' },
    { time: '25 min ago', action: 'Priority escalated to High', user: 'Sarah Johnson' },
    { time: '5 min ago', action: 'New message received', user: 'John Doe' },
  ],
  'CHAT-1235': [
    { time: '4 hours ago', action: 'Chat started', user: 'Jane Smith' },
    { time: '3 hours 50 min ago', action: 'Assigned to Mike Chen', user: 'System' },
    { time: '3 hours 45 min ago', action: 'Linked to incident INC-2024-0891', user: 'Mike Chen' },
    { time: '3 hours 20 min ago', action: 'Order manually processed', user: 'Mike Chen' },
  ],
  'CHAT-1236': [
    { time: '1 day ago', action: 'Chat started', user: 'Bob Wilson' },
    { time: '1 day ago', action: 'Assigned to Sarah Johnson', user: 'System' },
    { time: '23 hours ago', action: 'Added to beta tester list', user: 'Sarah Johnson' },
    { time: '3 hours ago', action: 'Chat resolved', user: 'Sarah Johnson' },
  ],
  'CHAT-1237': [
    { time: '2 days ago', action: 'Chat started', user: 'Alice Brown' },
    { time: '2 days ago', action: 'Assigned to Team Member 3', user: 'System' },
    { time: '1 hour ago', action: 'New message received', user: 'Alice Brown' },
  ],
  'CHAT-1238': [
    { time: '3 days ago', action: 'Chat started', user: 'Charlie Davis' },
    { time: '3 days ago', action: 'Assigned to Mike Chen', user: 'System' },
    { time: '3 days ago', action: 'Issue identified and fixed', user: 'Mike Chen' },
    { time: '3 days ago', action: 'Chat resolved', user: 'Mike Chen' },
  ],
  'CHAT-1239': [
    { time: '5 days ago', action: 'Chat started', user: 'Eva Martinez' },
    { time: '4 days ago', action: 'Assigned to Sarah Johnson', user: 'System' },
    { time: '2 days ago', action: 'API key verification requested', user: 'Sarah Johnson' },
    { time: '2 hours ago', action: 'Escalated to engineering team', user: 'Sarah Johnson' },
    { time: '2 hours ago', action: 'New message received', user: 'Eva Martinez' },
  ],
};

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'Open': return 'default';
    case 'In Progress': return 'secondary';
    case 'Resolved': return 'outline';
    default: return 'default';
  }
}

function getPriorityVariant(priority: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (priority) {
    case 'Critical': return 'destructive';
    case 'High': return 'destructive';
    case 'Medium': return 'default';
    case 'Low': return 'secondary';
    default: return 'default';
  }
}

export default function ChatDetails() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleMobileSidebar } = useLayout();

  // Derive basePath from URL for back navigation
  const pathSegments = location.pathname.split('/');
  const basePath = `/${pathSegments[1]}`; // /agent, /admin, or /superadmin

  const [messageInput, setMessageInput] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'customer' | 'agent' | 'system';
    name: string;
    text: string;
    timestamp: string;
    isRead: boolean;
  }>>([]);
  const [chat, setChat] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch real chat data from API
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId) return;
      setChatLoading(true);
      try {
        const data = await api.get<any>(`/agent/chats/${chatId}`);
        if (data.success) {
          setChat(data.data);
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
      } finally {
        setChatLoading(false);
      }
    };
    loadChat();
  }, [chatId]);

  // Try to find the chat from project chats first, then from API data
  const projectChat = chatId ? projectChats[chatId] : null;

  // Build a unified chat info object
  const chatInfo = projectChat ? {
    id: projectChat.id,
    customer: projectChat.customer,
    avatar: projectChat.avatar,
    email: projectChat.email,
    phone: projectChat.phone,
    location: projectChat.location,
    subject: projectChat.subject,
    status: projectChat.status,
    priority: projectChat.priority,
    assignedTo: projectChat.assignedTo,
    projectName: projectChat.projectName,
    created: projectChat.created,
    lastActivity: projectChat.lastActivity,
    customerSince: projectChat.customerSince,
    totalChats: projectChat.totalChats,
    satisfaction: projectChat.satisfaction,
  } : chat ? {
    id: chat.id,
    customer: chat.customer_name,
    avatar: chat.customer_name?.substring(0, 2).toUpperCase() || '??',
    email: chat.customer_email,
    phone: '-',
    location: '-',
    subject: chat.subject || 'No subject',
    status: chat.status,
    priority: chat.priority,
    assignedTo: chat.agent_id ? 'Assigned' : 'Unassigned',
    projectName: chat.project?.name || 'Unknown Project',
    created: new Date(chat.created_at).toLocaleString(),
    lastActivity: new Date(chat.last_message_at).toLocaleString(),
    customerSince: '-',
    totalChats: 1,
    satisfaction: 0,
  } : null;

  // Load messages from API or project chats
  useEffect(() => {
    if (chatId && projectChatMessages[chatId]) {
      setMessages([...projectChatMessages[chatId]]);
    } else if (chat?.messages) {
      const apiMessages = chat.messages.map((m: any) => ({
        id: m.id,
        sender: m.sender_type === 'ai' ? 'agent' : m.sender_type === 'user' ? 'customer' : 'system' as 'customer' | 'agent' | 'system',
        name: m.sender_type === 'ai' ? 'AI Assistant' : chat.customer_name,
        text: m.content,
        timestamp: new Date(m.created_at).toLocaleString(),
        isRead: true,
      }));
      setMessages(apiMessages);
    }
  }, [chatId, chat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !chatId) return;
    const text = messageInput.trim();
    setMessageInput('');
    const optimisticMessage = {
      id: `msg-new-${Date.now()}`,
      sender: 'agent' as const,
      name: 'Sarah Chen',
      text,
      timestamp: 'Just now',
      isRead: true,
    };
    setMessages(prev => [...prev, optimisticMessage]);
    try {
      await api.post(`/agent/chats/${chatId}/message`, { message: text });
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      console.error('Failed to send message:', error);
    }
  };

  const timeline = chatId ? (chatActivityTimeline[chatId] || []) : [];

  if (!chatInfo) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50">
        <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-xl text-gray-600 mb-2">Chat not found</h2>
        <p className="text-gray-400 mb-6">The chat "{chatId}" could not be located.</p>
        <Button variant="outline" onClick={() => navigate(`${basePath}/chats`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

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
            <div className="relative w-96 hidden md:block">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search tickets, chats, customers..." className="pl-10" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
            </Button>
            {/* Agent Info */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l">
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-blue-600 text-white">SC</AvatarFallback>
                </Avatar>
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
              </div>
              <div>
                <div className="text-sm font-semibold">Sarah Chen</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/agent/profile-settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <Link to="/">Log Out</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header Bar */}
            <div className="border-b bg-white px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (basePath === '/superadmin' && mockChat) {
                        const project = mockProjects.find(p => p.id === mockChat.projectId);
                        if (project?.companyId) {
                          navigate('/superadmin/companies', {
                            state: { viewingCompanyId: project.companyId, companyDetailTab: 'chats' },
                          });
                          return;
                        }
                      }
                      navigate(-1);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div className="h-6 w-px bg-gray-200" />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">{chatInfo.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{chatInfo.customer}</span>
                      <Badge variant={getStatusVariant(chatInfo.status)} className="text-xs">{chatInfo.status}</Badge>
                      <Badge variant={getPriorityVariant(chatInfo.priority)} className="text-xs">{chatInfo.priority}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{chatInfo.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                    className={showInfoPanel ? 'bg-blue-50 border-blue-600' : ''}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Info
                  </Button>
                  {chatInfo.status !== 'Resolved' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Transfer Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Escalate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
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
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((message, index, array) => {
                const isFirstUnread = !message.isRead && (index === 0 || array[index - 1].isRead);

                if (message.sender === 'system') {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <div className="bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5">
                        <p className="text-xs text-gray-500">{message.text} &middot; {message.timestamp}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={message.id}>
                    {isFirstUnread && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-blue-200"></div>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          Unread Messages
                        </Badge>
                        <div className="flex-1 h-px bg-blue-200"></div>
                      </div>
                    )}
                    <div className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-[70%] ${message.sender === 'agent' ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className={`text-xs ${
                            message.sender === 'agent'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {message.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className={`text-xs text-gray-500 mb-1 ${message.sender === 'agent' ? 'text-right' : ''}`}>
                            {message.name}
                          </p>
                          <div className={`rounded-lg p-3 shadow-sm ${
                            message.sender === 'agent'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border'
                          }`}>
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 px-1 ${message.sender === 'agent' ? 'text-right' : ''}`}>
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4 bg-white">
              <div className="flex gap-2 mb-3">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Canned Responses
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  KB Articles
                </Button>
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attachment
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  className="flex-1"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 h-10 w-10"
                  onClick={handleSendMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Info Side Panel */}
          {showInfoPanel && (
            <div className="w-80 lg:w-96 border-l bg-white flex-shrink-0 overflow-y-auto hidden md:block">
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-sm text-gray-500 mb-3">Customer Information</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700">{chatInfo.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{chatInfo.customer}</p>
                      <p className="text-xs text-gray-500">Customer since {chatInfo.customerSince}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {chatInfo.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {chatInfo.phone}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {chatInfo.location}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-200" />

                {/* Chat Details */}
                <div>
                  <h3 className="text-sm text-gray-500 mb-3">Chat Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Chat ID</span>
                      <span className="font-mono text-xs">{chatInfo.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <Badge variant={getStatusVariant(chatInfo.status)} className="text-xs">{chatInfo.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Priority</span>
                      <Badge variant={getPriorityVariant(chatInfo.priority)} className="text-xs">{chatInfo.priority}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Assigned To</span>
                      <span>{chatInfo.assignedTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Project</span>
                      <span>{chatInfo.projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span>{chatInfo.created}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Activity</span>
                      <span>{chatInfo.lastActivity}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-200" />

                {/* Customer Stats */}
                <div>
                  <h3 className="text-sm text-gray-500 mb-3">Customer Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold">{chatInfo.totalChats}</p>
                      <p className="text-xs text-gray-500">Total Chats</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <p className="text-lg font-semibold">{chatInfo.satisfaction}</p>
                      </div>
                      <p className="text-xs text-gray-500">Satisfaction</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-200" />

                {/* Activity Timeline */}
                <div>
                  <h3 className="text-sm text-gray-500 mb-3">Activity Timeline</h3>
                  <div className="space-y-3">
                    {timeline.map((event, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5" />
                          {index < timeline.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="text-sm">{event.action}</p>
                          <p className="text-xs text-gray-400">{event.time} &middot; {event.user}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </>
  );
}
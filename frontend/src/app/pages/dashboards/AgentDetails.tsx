import { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Star,
  MessageCircle,
  Ticket,
  BarChart,
  User,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  UserX,
  Shield,
  Activity,
  Award,
  Target,
  Zap,
  ThumbsUp,
  MessageSquare,
  FileText,
  Users,
  Home,
  Bell,
  LogOut,
  Search,
  Menu,
  X,
  FolderOpen,
  ChevronDown,
  Plus,
  ArrowRightLeft,
  Inbox,
  CreditCard,
} from 'lucide-react';
import { AreaChart, Area, BarChart as RechartsBar, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockTickets, mockProjects } from '../../data/mockData';
import { useAgentStatus, agentStatusStore } from '../../data/agentStatusStore';
import { Sheet, SheetContent } from '../../components/ui/sheet';
import { AdminSidebar } from '../../components/AdminSidebar';
import { useLayout } from '../../components/layouts/LayoutContext';

export default function AgentDetails() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleMobileSidebar } = useLayout();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [assignProjectDialogOpen, setAssignProjectDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Derive basePath from URL
  const pathSegments = location.pathname.split('/');
  const basePath = `/${pathSegments[1]}`; // /agent, /admin, or /superadmin

  // Mock agent data - in a real app, this would be fetched based on agentId
  const allAgents = [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      role: 'Admin',
      avatar: 'SC',
      status: 'Active',
      joinDate: '2023-01-15',
      projects: ['Website Support', 'Mobile App'],
      ticketsResolved: 156,
      avgResponseTime: '2.3 min',
      rating: 4.8,
      lastActive: '5 min ago',
      totalTickets: 164,
      chatsSessions: 342,
      customerSatisfaction: 96,
      bio: 'Senior support specialist with 5+ years of experience in customer success. Passionate about helping customers and training new team members.',
    },
    {
      id: '2',
      name: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1 (555) 234-5678',
      location: 'New York, NY',
      role: 'Agent',
      avatar: 'JS',
      status: 'Active',
      joinDate: '2023-06-20',
      projects: ['Website Support'],
      ticketsResolved: 98,
      avgResponseTime: '3.1 min',
      rating: 4.6,
      lastActive: '2 min ago',
      totalTickets: 112,
      chatsSessions: 234,
      customerSatisfaction: 92,
      bio: 'Dedicated support agent focused on providing quick and accurate solutions to customer issues.',
    },
    {
      id: '3',
      name: 'Emma Wilson',
      email: 'emma.wilson@company.com',
      phone: '+1 (555) 345-6789',
      location: 'Austin, TX',
      role: 'Agent',
      avatar: 'EW',
      status: 'Away',
      joinDate: '2023-03-10',
      projects: ['Mobile App', 'Billing'],
      ticketsResolved: 124,
      avgResponseTime: '2.8 min',
      rating: 4.9,
      lastActive: '15 min ago',
      totalTickets: 135,
      chatsSessions: 289,
      customerSatisfaction: 98,
      bio: 'Mobile app specialist with expertise in billing and payment-related inquiries.',
    },
    {
      id: '4',
      name: 'Michael Brown',
      email: 'michael.brown@company.com',
      phone: '+1 (555) 456-7890',
      location: 'Seattle, WA',
      role: 'Agent',
      avatar: 'MB',
      status: 'Active',
      joinDate: '2023-08-05',
      projects: ['Billing', 'Technical'],
      ticketsResolved: 87,
      avgResponseTime: '4.2 min',
      rating: 4.5,
      lastActive: '1 min ago',
      totalTickets: 98,
      chatsSessions: 187,
      customerSatisfaction: 89,
      bio: 'Technical support expert specializing in complex billing and integration issues.',
    },
    {
      id: '5',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@company.com',
      phone: '+1 (555) 567-8901',
      location: 'Boston, MA',
      role: 'Admin',
      avatar: 'LA',
      status: 'Offline',
      joinDate: '2022-11-01',
      projects: ['Technical'],
      ticketsResolved: 203,
      avgResponseTime: '1.9 min',
      rating: 4.9,
      lastActive: '2 hours ago',
      totalTickets: 221,
      chatsSessions: 456,
      customerSatisfaction: 97,
      bio: 'Lead technical support administrator with deep product knowledge and mentoring expertise.',
    },
    {
      id: '6',
      name: 'David Kim',
      email: 'david.kim@company.com',
      phone: '+1 (555) 678-9012',
      location: 'Chicago, IL',
      role: 'Agent',
      avatar: 'DK',
      status: 'Invited',
      joinDate: '2026-02-10',
      projects: ['E-Commerce Site', 'SaaS Platform'],
      ticketsResolved: 0,
      avgResponseTime: '—',
      rating: 0,
      lastActive: 'Never',
      totalTickets: 0,
      chatsSessions: 0,
      customerSatisfaction: 0,
      bio: 'Newly invited agent pending onboarding.',
    },
  ];

  const agent = allAgents.find(a => a.id === agentId) || allAgents[0];

  // Track assigned projects in state so we can add/remove
  const [assignedProjects, setAssignedProjects] = useState<string[]>(agent.projects);
  const [pendingSelections, setPendingSelections] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState(agent.role.toLowerCase());
  const agentStatus = useAgentStatus(agent.id);

  const handleOpenAssignDialog = () => {
    setPendingSelections([...assignedProjects]);
    setAssignProjectDialogOpen(true);
  };

  const handleToggleProject = (projectName: string) => {
    setPendingSelections(prev =>
      prev.includes(projectName)
        ? prev.filter(p => p !== projectName)
        : [...prev, projectName]
    );
  };

  const handleSaveAssignments = () => {
    setAssignedProjects(pendingSelections);
    setAssignProjectDialogOpen(false);
  };

  // Performance data over time
  const performanceData = [
    { month: 'Jul', tickets: 45, satisfaction: 94 },
    { month: 'Aug', tickets: 52, satisfaction: 93 },
    { month: 'Sep', tickets: 48, satisfaction: 95 },
    { month: 'Oct', tickets: 61, satisfaction: 96 },
    { month: 'Nov', tickets: 58, satisfaction: 97 },
    { month: 'Dec', tickets: 67, satisfaction: 96 },
  ];

  // Response time data
  const responseTimeData = [
    { day: 'Mon', time: 2.1 },
    { day: 'Tue', time: 2.4 },
    { day: 'Wed', time: 2.0 },
    { day: 'Thu', time: 2.6 },
    { day: 'Fri', time: 2.2 },
    { day: 'Sat', time: 2.8 },
    { day: 'Sun', time: 2.5 },
  ];

  // Agent's assigned tickets
  const agentTickets = mockTickets.filter(ticket => ticket.assignedTo === agent.name);

  // Recent activity timeline
  const recentActivity = [
    { time: '2 min ago', action: 'Resolved ticket', details: 'T-1045 - Login issues', icon: CheckCircle, color: 'text-green-600' },
    { time: '15 min ago', action: 'Started chat', details: 'with Customer Lisa M.', icon: MessageCircle, color: 'text-blue-600' },
    { time: '1 hour ago', action: 'Updated ticket', details: 'T-1032 - Changed priority to high', icon: AlertCircle, color: 'text-orange-600' },
    { time: '2 hours ago', action: 'Closed ticket', details: 'T-1028 - Billing inquiry resolved', icon: CheckCircle, color: 'text-green-600' },
    { time: '3 hours ago', action: 'Added note', details: 'T-1015 - Escalated to technical team', icon: FileText, color: 'text-gray-600' },
    { time: '4 hours ago', action: 'Resolved ticket', details: 'T-1009 - Password reset completed', icon: CheckCircle, color: 'text-green-600' },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gray-900">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">LC</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 p-3 pt-6">
        <Link to="/agent/dashboard">
          <button className="w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-gray-800">
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </button>
        </Link>
        <button className="w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors relative text-gray-400 hover:text-white hover:bg-gray-800">
          <MessageCircle className="h-6 w-6" />
          <span className="text-xs">Chats</span>
          <Badge className="absolute top-2 right-2 bg-red-600 text-white h-3.5 px-1 text-[8px] min-w-[18px] flex items-center justify-center">24</Badge>
        </button>
        <button className="w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors relative text-gray-400 hover:text-white hover:bg-gray-800">
          <Ticket className="h-6 w-6" />
          <span className="text-xs">Tickets</span>
          <Badge className="absolute top-2 right-2 bg-red-600 text-white h-3.5 px-1 text-[8px] min-w-[18px] flex items-center justify-center">156</Badge>
        </button>
        <button className="w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-gray-800">
          <FileText className="h-6 w-6" />
          <span className="text-xs">Knowledge</span>
        </button>
        <button className="w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-gray-800">
          <BarChart className="h-6 w-6" />
          <span className="text-xs">Reports</span>
        </button>
        <button className="w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors bg-blue-600 text-white">
          <Users className="h-6 w-6" />
          <span className="text-xs">Users</span>
        </button>
        <button className="w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-gray-800">
          <Settings className="h-6 w-6" />
          <span className="text-xs">Settings</span>
        </button>
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="flex flex-col items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>
    </div>
  );

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
            <Button 
              variant="ghost" 
              onClick={() => navigate(`${basePath}/users`)}
              className="hidden md:inline-flex"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
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
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                title="Transfer Chat"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                title="Transfer Requests"
              >
                <Inbox className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  3
                </span>
              </Button>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 hidden md:inline-flex">
              + New Ticket
            </Button>
            {/* Agent Info - Right side after new ticket button */}
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
        <main className="flex-1 overflow-y-auto p-6">
          {/* Agent Header */}
          <Card className="mb-6">
            <CardContent className="px-5 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-blue-600 text-white text-xl">
                    {agent.avatar}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold">{agent.name}</h1>
                    <Badge variant={
                      agentStatus === 'Active' ? 'default' :
                      agentStatus === 'Away' ? 'secondary' :
                      agentStatus === 'Deactivated' ? 'destructive' :
                      agentStatus === 'Invited' ? 'outline' :
                      'outline'
                    } className={agentStatus === 'Invited' ? 'border-blue-300 bg-blue-50 text-blue-700' : ''}>
                      {agentStatus}
                    </Badge>
                    <Badge variant="outline">{agent.role}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span>{agent.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{agent.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span>{agent.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>Joined {new Date(agent.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {agent.bio && (
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-1">{agent.bio}</p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setChangeRoleDialogOpen(true)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => setDeactivateDialogOpen(true)}>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate Agent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Tickets Resolved</p>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-bold">{agent.ticketsResolved}</h3>
                  <span className="text-sm text-gray-500">/ {agent.totalTickets}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+12% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold">{agent.avgResponseTime}</h3>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">-8% faster</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Customer Rating</p>
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-bold">{agent.rating}</h3>
                  <span className="text-sm text-gray-500">/ 5.0</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Excellent</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Satisfaction Rate</p>
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-bold">{agent.customerSatisfaction}%</h3>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Above target</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tickets">Assigned Tickets</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="projects">Assign Projects</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Projects */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Assigned Projects</CardTitle>
                      <Button variant="outline" size="sm" onClick={handleOpenAssignDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Project
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assignedProjects.length > 0 ? (
                        assignedProjects.map((projectName, index) => {
                          const projectData = mockProjects.find(p => p.name === projectName);
                          return (
                            <div key={projectName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: projectData ? `${projectData.color}20` : '#dbeafe' }}
                                >
                                  <FolderOpen className="h-5 w-5" style={{ color: projectData?.color || '#2563eb' }} />
                                </div>
                                <div className="flex items-center gap-2">
                                  {projectData && (
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: projectData.color }} />
                                  )}
                                  <span className="font-medium">{projectName}</span>
                                </div>
                              </div>
                              <Badge variant="outline">Active</Badge>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No projects assigned</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>This Month's Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Tickets Closed</p>
                            <p className="font-semibold">67 tickets</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">+15%</Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Chat Sessions</p>
                            <p className="font-semibold">143 sessions</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">+8%</Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Award className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">First Response Time</p>
                            <p className="font-semibold">1.2 min avg</p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700">Excellent</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Response Time Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={responseTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets">
              <Card>
                <CardHeader>
                  <CardTitle>Currently Assigned Tickets ({agentTickets.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Last Update</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentTickets.length > 0 ? (
                        agentTickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.id}</TableCell>
                            <TableCell>{ticket.subject}</TableCell>
                            <TableCell>{ticket.customer}</TableCell>
                            <TableCell>
                              <Badge variant={ticket.status === 'open' ? 'default' : ticket.status === 'pending' ? 'secondary' : 'outline'}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'secondary'}>
                                {ticket.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>{ticket.lastUpdate}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            No tickets currently assigned to this agent
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                          <div className={`h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-5 w-5 ${activity.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-gray-600">{activity.details}</p>
                            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Assign Projects</CardTitle>
                    <p className="text-sm text-gray-500">
                      {assignedProjects.length} project{assignedProjects.length !== 1 ? 's' : ''} assigned
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockProjects.map((project) => {
                      const isAssigned = assignedProjects.includes(project.name);
                      return (
                        <div
                          key={project.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isAssigned ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`tab-assign-${project.id}`}
                              checked={isAssigned}
                              onCheckedChange={() => {
                                setAssignedProjects(prev =>
                                  prev.includes(project.name)
                                    ? prev.filter(p => p !== project.name)
                                    : [...prev, project.name]
                                );
                              }}
                            />
                            <label
                              htmlFor={`tab-assign-${project.id}`}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <div
                                className="h-8 w-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${project.color}20` }}
                              >
                                <FolderOpen className="h-4 w-4" style={{ color: project.color }} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                                  <span className="text-sm font-medium">{project.name}</span>
                                </div>
                                {project.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 max-w-md truncate">{project.description}</p>
                                )}
                              </div>
                            </label>
                          </div>
                          {isAssigned && <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">Assigned</Badge>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

      {/* Edit Agent Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Agent Profile</DialogTitle>
            <DialogDescription>
              Update agent information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={agent.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select defaultValue={agent.role.toLowerCase()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={agent.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" defaultValue={agent.phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" defaultValue={agent.location} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" defaultValue={agent.bio} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setEditDialogOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Agent Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {agent.name}? They will lose access to the platform and their tickets will need to be reassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              agentStatusStore.setStatus(agent.id, 'Deactivated');
              setDeactivateDialogOpen(false);
            }}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Project Dialog */}
      <Dialog open={assignProjectDialogOpen} onOpenChange={setAssignProjectDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Assign Projects</DialogTitle>
            <DialogDescription>
              Select the projects to assign to {agent.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
              {mockProjects.map((project) => (
                <div key={project.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                  <Checkbox
                    id={`assign-${project.id}`}
                    checked={pendingSelections.includes(project.name)}
                    onCheckedChange={() => handleToggleProject(project.name)}
                  />
                  <label
                    htmlFor={`assign-${project.id}`}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm">{project.name}</span>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {pendingSelections.length} project{pendingSelections.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignProjectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAssignments}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleDialogOpen} onOpenChange={(open) => {
        setChangeRoleDialogOpen(open);
        if (open) setSelectedRole(agent.role.toLowerCase());
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Select the new role for {agent.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setChangeRoleDialogOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
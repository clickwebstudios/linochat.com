import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  MoreVertical,
  Phone,
  Settings,
  FolderKanban,
  Headphones,
  MessageSquare,
  Ticket,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  UserPlus,
  Plus,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';
import { SuperadminTopbar } from '../../components/superadmin/SuperadminTopbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// API Response Types
interface CompanyStats {
  total_projects: number;
  total_agents: number;
  total_chats: number;
  total_tickets: number;
}

interface CompanyProject {
  id: string;
  name: string;
  website: string;
  widget_id: string;
  status: string;
  agents_count: number;
  chats_count: number;
  tickets_count: number;
}

interface CompanyAgent {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface CompanyChat {
  id: string;
  customer: string;
  status: string;
  preview: string;
  project_id: string;
  created_at: string;
}

interface CompanyDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  plan: string;
  status: string;
  created_at: string;
  stats: CompanyStats;
  projects: CompanyProject[];
  agents?: CompanyAgent[];
}

export default function CompanyDetails() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // State for real data
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [companyProjects, setCompanyProjects] = useState<CompanyProject[]>([]);
  const [companyAgents, setCompanyAgents] = useState<CompanyAgent[]>([]);
  const [companyChats, setCompanyChats] = useState<CompanyChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch company details when companyId changes
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!companyId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch company details
        const companyResponse = await api.get<CompanyDetails>(`/superadmin/companies/${companyId}`);
        const companyData = companyResponse.data;
        setCompany(companyData);
        setCompanyProjects(companyData.projects || []);
        setCompanyAgents(companyData.agents || []);

        // Fetch company chats
        const chatsResponse = await api.get<{ chats: CompanyChat[] }>(`/superadmin/companies/${companyId}/chats`);
        setCompanyChats(chatsResponse.data.chats || []);
      } catch (err) {
        console.error('Failed to fetch company details:', err);
        setError('Failed to load company details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [companyId]);

  // Show loading state
  if (isLoading) {
    return (
      <>
        <SuperadminTopbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading company details...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error || !company) {
    return (
      <>
        <SuperadminTopbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "The company you're looking for doesn't exist."}</p>
            <Button onClick={() => navigate('/superadmin/companies')}>Back to Companies</Button>
          </div>
        </div>
      </>
    );
  }

  // Calculate tickets from projects
  const totalTickets = companyProjects.reduce((sum, p) => sum + (p.tickets_count || 0), 0);
  const activeTickets = Math.floor(totalTickets * 0.4);
  const resolvedTickets = totalTickets - activeTickets;

  // Mock activity data for charts (can be replaced with real data later)
  const ticketActivityData = [
    { month: 'Jan', tickets: 45, resolved: 38 },
    { month: 'Feb', tickets: 52, resolved: 45 },
    { month: 'Mar', tickets: 48, resolved: 42 },
    { month: 'Apr', tickets: 61, resolved: 54 },
    { month: 'May', tickets: 55, resolved: 48 },
    { month: 'Jun', tickets: 67, resolved: 59 },
  ];

  const chatVolumeData = [
    { day: 'Mon', chats: 124 },
    { day: 'Tue', chats: 135 },
    { day: 'Wed', chats: 148 },
    { day: 'Thu', chats: 142 },
    { day: 'Fri', chats: 156 },
    { day: 'Sat', chats: 89 },
    { day: 'Sun', chats: 76 },
  ];

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      {/* Top Bar */}
      <SuperadminTopbar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 px-6 pt-6">
          {/* Back Button & Company Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/superadmin/companies')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Companies
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-600 text-white text-lg">
                    {company.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{company.name}</h1>
                  <p className="text-sm text-gray-500">ID: {company.id}</p>
                </div>
              </div>
              <Badge 
                variant="outline"
                className={
                  company.plan === 'Enterprise' 
                    ? 'border-purple-600 text-purple-600'
                    : company.plan === 'Pro'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-gray-600 text-gray-600'
                }
              >
                {company.plan}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Company
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Company
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Projects</p>
                    <p className="text-3xl font-bold">{company.stats.total_projects}</p>
                  </div>
                  <FolderKanban className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Agents</p>
                    <p className="text-3xl font-bold">{company.stats.total_agents}</p>
                  </div>
                  <Headphones className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tickets</p>
                    <p className="text-3xl font-bold">{totalTickets}</p>
                    <p className="text-xs text-green-600 mt-1">{resolvedTickets} resolved</p>
                  </div>
                  <Ticket className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Chats</p>
                    <p className="text-3xl font-bold">{company.stats.total_chats}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="pb-6">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Company Info */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{company.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{company.phone || '+1 (555) 123-4567'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Joined {formatDate(company.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{company.plan} Plan</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Ticket Activity (Last 6 Months)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={ticketActivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="tickets" fill="#3b82f6" name="Total Tickets" />
                        <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Active Tickets</p>
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold">{activeTickets}</p>
                    <p className="text-xs text-gray-500 mt-1">Awaiting resolution</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Resolved Tickets</p>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">{resolvedTickets}</p>
                    <p className="text-xs text-gray-500 mt-1">{totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0}% resolution rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Avg Response Time</p>
                      <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">2.4h</p>
                    <p className="text-xs text-green-600 mt-1">-15% from last month</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Projects ({companyProjects.length})</CardTitle>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyProjects.map((project) => (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate(`/superadmin/project/${project.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <FolderKanban className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-semibold">{project.name}</p>
                                <p className="text-xs text-gray-500">ID: {project.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-green-600 text-green-600">
                              {project.status || 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{project.tickets_count}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">Active</span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Agents ({companyAgents.length})</CardTitle>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Agent
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyAgents.map((agent) => (
                        <TableRow
                          key={agent.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate(`/superadmin/agent/${agent.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-green-600 text-white">
                                  {agent.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{agent.name}</p>
                                <p className="text-xs text-gray-500">ID: {agent.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{agent.email}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{agent.role || 'Agent'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              <span className="text-sm text-gray-600">{agent.status || 'Active'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Permissions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chats Tab */}
            <TabsContent value="chats">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Chats ({companyChats.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Message</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyChats.slice(0, 10).map((chat) => {
                        const project = companyProjects.find(p => p.id === chat.project_id);
                        return (
                          <TableRow key={chat.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-purple-600 text-white text-xs">
                                    {chat.customer.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold">{chat.customer}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">{project?.name || 'Unknown'}</span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={
                                  chat.status === 'active' 
                                    ? 'border-green-600 text-green-600'
                                    : chat.status === 'waiting'
                                    ? 'border-orange-600 text-orange-600'
                                    : 'border-gray-600 text-gray-600'
                                }
                              >
                                {chat.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">{chat.preview}</span>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets">
              <Card>
                <CardHeader>
                  <CardTitle>Tickets Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Ticket className="h-5 w-5 text-gray-600" />
                          <span className="text-sm text-gray-600">Total</span>
                        </div>
                        <p className="text-2xl font-bold">{totalTickets}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                          <span className="text-sm text-gray-600">Active</span>
                        </div>
                        <p className="text-2xl font-bold">{activeTickets}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-gray-600">Resolved</span>
                        </div>
                        <p className="text-2xl font-bold">{resolvedTickets}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-blue-500" />
                          <span className="text-sm text-gray-600">Resolution Rate</span>
                        </div>
                        <p className="text-2xl font-bold">{totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0}%</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Tickets by Project</h3>
                      <div className="space-y-2">
                        {companyProjects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/superadmin/project/${project.id}`)}
                          >
                            <div className="flex items-center gap-3">
                              <FolderKanban className="h-5 w-5 text-blue-600" />
                              <span className="font-medium">{project.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">{project.tickets_count} tickets</span>
                              <Button variant="ghost" size="sm">View</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Chat Volume (Last 7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chatVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="chats" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={ticketActivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} name="Created" />
                        <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">First Response Time</span>
                        <span className="font-semibold">1.2h</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Resolution Time</span>
                        <span className="font-semibold">4.8h</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Customer Satisfaction</span>
                        <span className="font-semibold">94%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Agent Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {companyAgents.slice(0, 3).map((agent, idx) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        onClick={() => navigate(`/superadmin/agent/${agent.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-green-600 text-white text-xs">
                              {agent.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{agent.name}</span>
                        </div>
                        <Badge variant="outline" className="border-green-600 text-green-600">
                          {95 - idx * 3}% CSAT
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Projects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {companyProjects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        onClick={() => navigate(`/superadmin/project/${project.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">{project.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">{project.tickets_count} tickets</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
    </>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Settings,
  Search,
  LogOut,
  User,
  Plus,
  MoreVertical,
  Headphones,
  Edit,
  Trash2,
  ChevronDown,
  FolderKanban,
  Loader2,
} from 'lucide-react';
import { ProjectSelector } from '../../components/ProjectSelector';
import { OverviewSection } from '../../components/superadmin/OverviewSection';
import { ChatsSection } from '../../components/superadmin/ChatsSection';
import { CompanyDetailView } from '../../components/superadmin/CompanyDetailView';
import { NotificationBell } from '../../components/superadmin/NotificationBell';
import { TeamSection } from '../../components/superadmin/TeamSection';
import { PermissionsSection } from '../../components/superadmin/PermissionsSection';
import { AddProjectForm } from '../../components/superadmin/AddProjectForm';
import { CompanySwitcher } from '../../components/superadmin/CompanySwitcher';
import { useSuperadminStore } from '../../lib/superadminStore';
import { api } from '../../api/client';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Types
interface Company {
  id: string;
  name: string;
  email: string;
  plan: string;
  projects_count: number;
  agents_count: number;
  created_at: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  domain: string;
  widget_id: string;
  status: string;
  agents: number;
  tickets: number;
  owner: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  status: string;
  project: string;
  active_tickets: number;
  resolved_today: number;
  avg_response_time: string;
}

interface ChatMessage {
  from: string;
  text: string;
  time: string;
}

interface Chat {
  id: string;
  chat_id: string;
  status: string;
  company: string;
  agent: string | null;
  customer_name: string;
  created_at: string;
  messages_count: number;
  messages?: ChatMessage[];
}

interface PlatformStats {
  total_users: number;
  active_agents: number;
  monthly_revenue: string;
  system_uptime: string;
  user_growth_data: { month: string; users: number }[];
  revenue_data: { month: string; revenue: number }[];
  total_tickets: number;
  avg_response_time: string;
  csat_score: string;
}

export default function SuperadminDashboard() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  // Loading states
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  // Derive active section from URL path: /superadmin/chats → 'chats'
  const pathSegments = location.pathname.split('/');
  const urlSection = pathSegments[2] || 'dashboard';
  const sectionMap: Record<string, string> = {
    'dashboard': 'overview',
    'chats': 'chats',
    'companies': 'companies',
    'projects': 'projects',
    'agents': 'agents',
    'team': 'team',
    'permissions': 'permissions',
    'plans': 'settings',
    'analytics': 'analytics',
    'logs': 'logs',
  };
  const activeSection = sectionMap[urlSection] || 'overview';

  // Fetch data based on active section
  useEffect(() => {
    if (activeSection === 'companies' || activeSection === 'overview') {
      fetchCompanies();
    }
    if (activeSection === 'projects' || activeSection === 'overview') {
      fetchProjects();
    }
    if (activeSection === 'agents' || activeSection === 'team') {
      fetchAgents();
    }
    if (activeSection === 'chats') {
      fetchChats();
    }
    if (activeSection === 'overview' || activeSection === 'analytics') {
      fetchPlatformStats();
    }
  }, [activeSection]);

  const fetchCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const response = await api.get<Company[]>('/superadmin/companies');
      setCompanies(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await api.get<Project[]>('/superadmin/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const fetchAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const response = await api.get<Agent[]>('/superadmin/agents');
      setAgents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const fetchChats = async () => {
    setIsLoadingChats(true);
    try {
      const response = await api.get<Chat[]>('/superadmin/chats');
      setChats(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const fetchPlatformStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await api.get<PlatformStats>('/superadmin/stats');
      setPlatformStats(response.data);
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Legacy ?section= query param support
  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      const reverseMap: Record<string, string> = {
        'overview': 'dashboard',
        'chats': 'chats',
        'companies': 'companies',
        'projects': 'projects',
        'team': 'team',
        'permissions': 'permissions',
        'settings': 'plans',
        'analytics': 'analytics',
        'logs': 'logs',
      };
      const routeSegment = reverseMap[section] || 'dashboard';
      navigate(`/superadmin/${routeSegment}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const setActiveSection = (section: string) => {
    const reverseMap: Record<string, string> = {
      'overview': 'dashboard',
      'chats': 'chats',
      'companies': 'companies',
      'projects': 'projects',
      'agents': 'agents',
      'team': 'team',
      'permissions': 'permissions',
      'settings': 'plans',
      'analytics': 'analytics',
      'logs': 'logs',
    };
    const routeSegment = reverseMap[section] || 'dashboard';
    navigate(`/superadmin/${routeSegment}`);
  };

  const [selectedProject] = useState('all');
  const [chatStatusFilter, setChatStatusFilter] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [viewingCompanyId, setViewingCompanyId] = useState<string | null>(null);
  const [companyDetailTab, setCompanyDetailTab] = useState('overview');

  // Read location state for deep-linking into a company detail view
  useEffect(() => {
    const state = location.state as { viewingCompanyId?: string; companyDetailTab?: string } | null;
    if (state?.viewingCompanyId && activeSection === 'companies') {
      setViewingCompanyId(state.viewingCompanyId);
      if (state.companyDetailTab) {
        setCompanyDetailTab(state.companyDetailTab);
      }
      // Clear the state so refreshing doesn't re-trigger
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, activeSection]);

  // selectedChat is derived after superadminChats is computed below

  const filteredAgents = selectedProject === 'all' 
    ? agents 
    : agents.filter(agent => agent.project === selectedProject);

  // Company selection state from store
  const { selectedCompanyId, setSelectedCompany: setSelectedCompanyInStore } = useSuperadminStore();

  // Filter data by selected company
  const filteredCompanies = selectedCompanyId 
    ? companies.filter(c => c.id === selectedCompanyId)
    : companies;
  
  const filteredProjects = selectedCompanyId
    ? projects.filter(p => {
        // Find company that owns this project
        const company = companies.find(c => c.id === selectedCompanyId);
        return company && p.owner === company.name;
      })
    : projects;
  
  const filteredChats = (selectedCompanyId
    ? chats.filter(c => c.company === companies.find(comp => comp.id === selectedCompanyId)?.name)
    : chats
  ).filter(c => !chatStatusFilter || c.status === chatStatusFilter);

  // Transform chats for ChatsSection
  const superadminChats = filteredChats.map(chat => ({
    id: chat.id,
    name: chat.customer_name,
    initials: chat.customer_name.substring(0, 2).toUpperCase(),
    avatarColor: 'bg-primary',
    status: chat.status as 'active' | 'waiting' | 'resolved',
    company: chat.company,
    chatId: chat.chat_id,
    time: new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    preview: chat.messages?.length ? (chat.messages[chat.messages.length - 1]?.text?.slice(0, 50) || `Chat with ${chat.customer_name}`) : `Chat with ${chat.customer_name}`,
    agent: chat.agent,
    msgs: chat.messages_count,
    duration: '5m',
    respTime: '1m',
    borderColor: chat.status === 'active' ? 'border-green-500' : chat.status === 'waiting' ? 'border-orange-500' : chat.status === 'ai_handling' ? 'border-purple-500' : 'border-primary',
    messages: (chat.messages || []).map(m => ({
      from: m.from,
      text: m.text,
      time: m.time ? new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    })),
  }));

  const selectedChat = superadminChats.find(c => c.id === selectedChatId) || superadminChats[0];

  return (
    <>
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
          <div className="flex items-center gap-4">
            <CompanySwitcher 
              selectedCompanyId={selectedCompanyId}
              onCompanyChange={(id) => {
                setSelectedCompanyInStore(id, null);
                if (id) {
                  // Load company-specific data
                }
              }}
            />
            {!['overview', 'companies', 'team', 'permissions', 'settings', 'analytics', 'logs'].includes(activeSection) && <ProjectSelector />}
            <div className="relative w-96">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users, settings..." className="pl-10" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 ml-4 pl-4 border-l hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer">
                  <div className="text-right">
                    <div className="text-sm font-semibold">{user?.first_name || 'Admin User'}</div>
                    <div className="text-xs text-muted-foreground">{user?.role || 'Superadmin'}</div>
                  </div>
                  <Avatar>
                    <AvatarFallback className="bg-secondary text-primary-foreground">{(user?.first_name || 'AD').substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <Link to="/superadmin/profile-settings">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-muted/50 px-6 pt-6">
          {activeSection === 'overview' && (
            <OverviewSection
              revenueData={platformStats?.revenue_data || []}
              userGrowthData={platformStats?.user_growth_data || []}
              setActiveSection={setActiveSection}
              selectedCompanyId={selectedCompanyId}
              stats={platformStats}
              isLoading={isLoadingStats}
            />
          )}

          {activeSection === 'chats' && (
            <ChatsSection
              superadminChats={superadminChats}
              selectedChatId={selectedChatId || ''}
              setSelectedChatId={setSelectedChatId}
              selectedChat={selectedChat}
              selectedCompanyId={selectedCompanyId}
              isLoading={isLoadingChats}
              onChatsRefresh={fetchChats}
              statusFilter={chatStatusFilter}
              onStatusFilterChange={setChatStatusFilter}
            />
          )}

          {activeSection === 'companies' && !viewingCompanyId && (
            <Card className="font-bold">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Company Management</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Company
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Company</DialogTitle>
                      <DialogDescription>Create a new company account</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm mb-2 block">Company Name</label>
                        <Input placeholder="Acme Corporation" />
                      </div>
                      <div>
                        <label className="text-sm mb-2 block">Plan</label>
                        <select className="w-full p-2 border rounded-lg">
                          <option>Starter</option>
                          <option>Pro</option>
                          <option>Enterprise</option>
                        </select>
                      </div>
                      <Button className="w-full bg-primary">Create Company</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingCompanies ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead>Agents</TableHead>
                        <TableHead>Sign Up Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company) => (
                        <TableRow 
                          key={company.id} 
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => { setViewingCompanyId(company.id); setCompanyDetailTab('overview'); }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {company.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{company.name}</p>
                                <p className="text-xs text-muted-foreground font-normal">ID: {company.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={
                                company.plan === 'Enterprise' 
                                  ? 'border-secondary text-secondary'
                                  : company.plan === 'Pro'
                                  ? 'border-primary text-primary'
                                  : 'border-muted-foreground text-muted-foreground'
                              }
                            >
                              {company.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FolderKanban className="h-4 w-4 text-primary" />
                                <span className="font-semibold">{company.projects_count}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Headphones className="h-4 w-4 text-green-600" />
                                <span className="font-semibold">{company.agents_count}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-normal">{new Date(company.created_at).toLocaleDateString()}</span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Company
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
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'companies' && viewingCompanyId && (
            <CompanyDetailView
              viewingCompanyId={viewingCompanyId}
              companyDetailTab={companyDetailTab}
              setCompanyDetailTab={setCompanyDetailTab}
              setViewingCompanyId={setViewingCompanyId}
            />
          )}

          {activeSection === 'projects' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project Management</CardTitle>
                <Button className="bg-primary" onClick={() => setAddProjectDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
                <Dialog open={addProjectDialogOpen} onOpenChange={setAddProjectDialogOpen}>
                  <DialogContent className="sm:max-w-[640px]">
                    <AddProjectForm
                      onClose={() => setAddProjectDialogOpen(false)}
                      onSuccess={(newProject) => {
                        setProjects((prev) => [newProject, ...prev]);
                        setAddProjectDialogOpen(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingProjects ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Widget ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Agents</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => (
                        <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/superadmin/project/${project.id}`)}>
                          <TableCell>
                            <Link to={`/superadmin/project/${project.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{project.name[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-bold">{project.name}</span>
                            </Link>
                          </TableCell>
                          <TableCell>{project.domain}</TableCell>
                          <TableCell>{project.widget_id}</TableCell>
                          <TableCell>
                            <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{project.agents}</TableCell>
                          <TableCell>{project.tickets}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'agents' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Agent Management</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Agent
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Agent</DialogTitle>
                      <DialogDescription>Assign a new agent to a project</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm mb-2 block">Name</label>
                        <Input placeholder="Sarah Johnson" />
                      </div>
                      <div>
                        <label className="text-sm mb-2 block">Email</label>
                        <Input placeholder="sarah@techcorp.com" />
                      </div>
                      <div>
                        <label className="text-sm mb-2 block">Project</label>
                        <select className="w-full p-2 border rounded-lg">
                          {filteredProjects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                          ))}
                        </select>
                      </div>
                      <Button className="w-full bg-primary">Add Agent</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingAgents ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Active Tickets</TableHead>
                        <TableHead>Resolved Today</TableHead>
                        <TableHead>Avg Response</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAgents.map((agent) => (
                        <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/superadmin/agent/${agent.id}`)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{agent.name[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="hover:text-primary transition-colors font-bold">{agent.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{agent.email}</TableCell>
                          <TableCell>{agent.project}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                agent.status === 'Active' 
                                  ? 'text-green-600 border-green-600' 
                                  : agent.status === 'Away' 
                                  ? 'text-yellow-600 border-yellow-600' 
                                  : 'text-muted-foreground border-muted-foreground'
                              }
                            >
                              {agent.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{agent.active_tickets}</TableCell>
                          <TableCell>{agent.resolved_today}</TableCell>
                          <TableCell>{agent.avg_response_time}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'team' && (
            <TeamSection />
          )}

          {activeSection === 'permissions' && (
            <PermissionsSection />
          )}

          {activeSection === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle>Plan Pricing Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                      
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Starter Plan</h4>
                            <p className="text-sm text-muted-foreground">Basic features for small teams</p>
                          </div>
                          <Badge variant="outline" className="text-muted-foreground border-muted-foreground">Active</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm mb-2 block">Monthly Price</label>
                            <Input defaultValue="29" type="number" />
                          </div>
                          <div>
                            <label className="text-sm mb-2 block">Annual Price</label>
                            <Input defaultValue="290" type="number" />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm mb-2 block">Max Users</label>
                          <Input defaultValue="5" type="number" />
                        </div>
                        <div>
                          <label className="text-sm mb-2 block font-semibold">Plan Benefits</label>
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">Up to 5 team members</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">Basic chat widget</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">Email support</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Input placeholder="Add new benefit..." className="flex-1" />
                            <Button size="sm" className="bg-primary">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Pro Plan</h4>
                            <p className="text-sm text-muted-foreground">Advanced features for growing teams</p>
                          </div>
                          <Badge variant="outline" className="text-primary border-primary">Active</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm mb-2 block">Monthly Price</label>
                            <Input defaultValue="79" type="number" />
                          </div>
                          <div>
                            <label className="text-sm mb-2 block">Annual Price</label>
                            <Input defaultValue="790" type="number" />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm mb-2 block">Max Users</label>
                          <Input defaultValue="25" type="number" />
                        </div>
                        <div>
                          <label className="text-sm mb-2 block font-semibold">Plan Benefits</label>
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">Up to 25 team members</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">Advanced chat widget with customization</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">Priority email & chat support</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">Advanced analytics</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Input placeholder="Add new benefit..." className="flex-1" />
                            <Button size="sm" className="bg-primary">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Enterprise Plan</h4>
                            <p className="text-sm text-muted-foreground">Full features for large organizations</p>
                          </div>
                          <Badge variant="outline" className="text-secondary border-secondary">Active</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm mb-2 block">Monthly Price</label>
                            <Input defaultValue="199" type="number" />
                          </div>
                          <div>
                            <label className="text-sm mb-2 block">Annual Price</label>
                            <Input defaultValue="1990" type="number" />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm mb-2 block">Max Users</label>
                          <Input placeholder="Unlimited" disabled />
                        </div>
                        <div>
                          <label className="text-sm mb-2 block font-semibold">Plan Benefits</label>
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">Unlimited team members</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">White-label solution</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">24/7 phone & email support</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">Custom integrations</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">Dedicated account manager</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Input placeholder="Add new benefit..." className="flex-1" />
                            <Button size="sm" className="bg-primary">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">Trial Period</h4>
                            <p className="text-sm text-muted-foreground">Free trial duration for new users</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div>
                          <label className="text-sm mb-2 block">Trial Days</label>
                          <Input defaultValue="14" type="number" />
                        </div>
                      </div>

                      <Button className="bg-primary w-full">Save Pricing Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Total Tickets</p>
                          <p className="text-2xl font-bold">{platformStats?.total_tickets || 0}</p>
                          <p className="text-xs text-green-600 mt-1">+8% this month</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Avg Response Time</p>
                          <p className="text-2xl font-bold">{platformStats?.avg_response_time || '0h'}</p>
                          <p className="text-xs text-green-600 mt-1">-12% improvement</p>
                        </div>
                        <div className="p-4 bg-secondary/10 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">CSAT Score</p>
                          <p className="text-2xl font-bold">{platformStats?.csat_score || '0%'}</p>
                          <p className="text-xs text-green-600 mt-1">+2% this month</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={platformStats?.user_growth_data || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Visitors</TableHead>
                        <TableHead>Conversions</TableHead>
                        <TableHead>Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Organic Search</TableCell>
                        <TableCell>12,450</TableCell>
                        <TableCell>1,240</TableCell>
                        <TableCell><Badge className="bg-green-600">9.96%</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Direct</TableCell>
                        <TableCell>8,320</TableCell>
                        <TableCell>890</TableCell>
                        <TableCell><Badge className="bg-primary">10.7%</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Referral</TableCell>
                        <TableCell>4,680</TableCell>
                        <TableCell>420</TableCell>
                        <TableCell><Badge className="bg-secondary">8.97%</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'logs' && (
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg font-mono text-xs">
                    <span className="text-muted-foreground">2024-12-20 14:32:18</span>
                    <Badge variant="outline" className="text-primary border-primary">INFO</Badge>
                    <span>User authentication successful: admin@chatsupport.com</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg font-mono text-xs">
                    <span className="text-muted-foreground">2024-12-20 14:28:45</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">SUCCESS</Badge>
                    <span>Database backup completed: backup_20241220.sql</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg font-mono text-xs">
                    <span className="text-muted-foreground">2024-12-20 14:15:03</span>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">WARNING</Badge>
                    <span>High CPU usage detected: 85% utilization</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg font-mono text-xs">
                    <span className="text-muted-foreground">2024-12-20 13:59:22</span>
                    <Badge variant="outline" className="text-primary border-primary">INFO</Badge>
                    <span>Email notification sent to 45 users</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg font-mono text-xs">
                    <span className="text-muted-foreground">2024-12-20 13:42:11</span>
                    <Badge variant="outline" className="text-red-600 border-red-600">ERROR</Badge>
                    <span>Failed to connect to external API: timeout after 30s</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg font-mono text-xs">
                    <span className="text-muted-foreground">2024-12-20 13:30:55</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">SUCCESS</Badge>
                    <span>Scheduled task completed: ticket_cleanup_job</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline">Load More Logs</Button>
                </div>
              </CardContent>
            </Card>
          )}

        </main>
    </>
  );
}

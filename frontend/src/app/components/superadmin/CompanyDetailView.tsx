import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Users,
  Settings,
  Shield,
  CreditCard,
  Search,
  Plus,
  MoreVertical,
  TrendingUp,
  Activity,
  Globe,
  Headphones,
  ExternalLink,
  Edit,
  Trash2,
  Building2,
  FolderKanban,
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Download,
  BookOpen,
  Eye,
  ThumbsUp,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot,
  Archive,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { AddProjectForm } from './AddProjectForm';

interface Company {
  id: string;
  name: string;
  plan: string;
  email?: string;
  location?: string;
  joined?: string;
  mrr?: string;
  status?: string;
  usage?: number;
  color?: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  website?: string;
  domain?: string;
  tickets: number;
  totalTickets: number;
  activeTickets: number;
  members: number;
  companyId: string;
  status?: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  status?: string;
  activeTickets?: number;
  resolvedToday?: number;
  companyId: string;
}

interface Chat {
  id: string;
  customer: string;
  avatar: string;
  preview: string;
  agent: string;
  status: string;
  time: string;
  unread: number;
  isAIBot?: boolean;
  projectId: string;
}

interface Ticket {
  id: string;
  subject: string;
  customer: string;
  priority: string;
  status: string;
  assignedTo: string;
  created: string;
  projectId: string;
}

interface CompanyDetailViewProps {
  viewingCompanyId: string;
  companyDetailTab: string;
  setCompanyDetailTab: (tab: string) => void;
  setViewingCompanyId: (id: string | null) => void;
}

export function CompanyDetailView({
  viewingCompanyId,
  companyDetailTab,
  setCompanyDetailTab,
  setViewingCompanyId,
}: CompanyDetailViewProps) {
  const navigate = useNavigate();
  
  // State for API data
  const [company, setCompany] = useState<Company | null>(null);
  const [companyProjects, setCompanyProjects] = useState<Project[]>([]);
  const [companyAgents, setCompanyAgents] = useState<Agent[]>([]);
  const [companyChats, setCompanyChats] = useState<Chat[]>([]);
  const [companyTickets, setCompanyTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch company data when viewingCompanyId changes
  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch company details
        const companyResponse = await api.get(`/api/superadmin/companies/${viewingCompanyId}`);
        setCompany(companyResponse.data);
        
        // Fetch company chats
        try {
          const chatsResponse = await api.get(`/api/superadmin/companies/${viewingCompanyId}/chats`);
          setCompanyChats(chatsResponse.data || []);
        } catch (chatsErr) {
          // Chats endpoint might not exist yet, use empty array
          setCompanyChats([]);
        }
        
        // Fetch company projects
        try {
          const projectsResponse = await api.get(`/api/superadmin/companies/${viewingCompanyId}/projects`);
          setCompanyProjects(projectsResponse.data || []);
        } catch (projectsErr) {
          // Projects endpoint might not exist yet, use empty array
          setCompanyProjects([]);
        }
        
        // Fetch company agents
        try {
          const agentsResponse = await api.get(`/api/superadmin/companies/${viewingCompanyId}/agents`);
          setCompanyAgents(agentsResponse.data || []);
        } catch (agentsErr) {
          // Agents endpoint might not exist yet, use empty array
          setCompanyAgents([]);
        }
        
        // Fetch company tickets
        try {
          const ticketsResponse = await api.get(`/api/superadmin/companies/${viewingCompanyId}/tickets`);
          setCompanyTickets(ticketsResponse.data || []);
        } catch (ticketsErr) {
          // Tickets endpoint might not exist yet, use empty array
          setCompanyTickets([]);
        }
      } catch (err) {
        setError('Failed to load company data. Please try again.');
        console.error('Error fetching company data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (viewingCompanyId) {
      fetchCompanyData();
    }
  }, [viewingCompanyId]);

  // Calculate total tickets from projects
  const totalTickets = companyProjects.reduce((sum, p) => sum + (p.tickets || 0), 0);
  
  // Company colors mapping
  const companyColors: Record<string, string> = {
    'comp-1': '#3B82F6',
    'comp-2': '#8B5CF6',
    'comp-3': '#10B981',
  };

  // Default meta data - will be overridden by API data when available
  const defaultMeta = {
    email: company?.email || 'admin@company.com',
    location: company?.location || 'Unknown Location',
    joined: company?.joined || 'N/A',
    mrr: company?.mrr || '$0',
    status: company?.status || 'Active',
    usage: company?.usage || 50,
  };

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Agent'>('Agent');
  const [invitedMembers, setInvitedMembers] = useState<
    { id: string; name: string; email: string; role: 'Admin' | 'Agent' }[]
  >([]);

  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectWebsite, setNewProjectWebsite] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
  const [addedProjects, setAddedProjects] = useState<
    { id: string; name: string; color: string; description: string; website: string; totalTickets: number; activeTickets: number; members: number; companyId: string; tickets: number; status: string }[]
  >([]);

  // Edit company state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [editedCompanyName, setEditedCompanyName] = useState(company?.name || '');
  const [editedEmail, setEditedEmail] = useState(defaultMeta.email);
  const [editedLocation, setEditedLocation] = useState(defaultMeta.location);
  const [editedStatus, setEditedStatus] = useState(defaultMeta.status);

  // Update edited values when company data changes
  useEffect(() => {
    if (company) {
      setEditedCompanyName(company.name);
      setEditedEmail(company.email || defaultMeta.email);
      setEditedLocation(company.location || defaultMeta.location);
      setEditedStatus(company.status || defaultMeta.status);
    }
  }, [company]);

  // Temp edit state (for dialog form before saving)
  const [tempName, setTempName] = useState(company?.name || '');
  const [tempEmail, setTempEmail] = useState(defaultMeta.email);
  const [tempLocation, setTempLocation] = useState(defaultMeta.location);
  const [tempStatus, setTempStatus] = useState(defaultMeta.status);

  // Update temp values when edit dialog opens
  useEffect(() => {
    setTempName(editedCompanyName);
    setTempEmail(editedEmail);
    setTempLocation(editedLocation);
    setTempStatus(editedStatus);
  }, [editDialogOpen, editedCompanyName, editedEmail, editedLocation, editedStatus]);

  const handleOpenEditDialog = () => {
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    setEditedCompanyName(tempName);
    setEditedEmail(tempEmail);
    setEditedLocation(tempLocation);
    setEditedStatus(tempStatus);
    setEditDialogOpen(false);
    // TODO: Call API to update company
  };

  const handleDeleteCompany = () => {
    setDeleteDialogOpen(false);
    setDeleteConfirmText('');
    setViewingCompanyId(null);
    // TODO: Call API to delete company
  };

  // Archive company state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [isArchived, setIsArchived] = useState(false);

  const handleArchiveCompany = () => {
    setIsArchived(true);
    setEditedStatus('Archived');
    setArchiveDialogOpen(false);
    setArchiveReason('');
    // TODO: Call API to archive company
  };

  const handleRestoreCompany = () => {
    setIsArchived(false);
    setEditedStatus('Active');
    // TODO: Call API to restore company
  };

  const projectColors = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#ef4444', label: 'Red' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#f97316', label: 'Orange' },
  ];

  const handleAddProject = () => {
    if (!newProjectName.trim() || !company) return;
    setAddedProjects(prev => [
      ...prev,
      {
        id: `proj-new-${Date.now()}`,
        name: newProjectName.trim(),
        color: newProjectColor,
        description: newProjectDescription.trim(),
        website: newProjectWebsite.trim() || '',
        totalTickets: 0,
        activeTickets: 0,
        members: 1,
        companyId: company.id,
        tickets: 0,
        status: 'Active',
      },
    ]);
    setNewProjectName('');
    setNewProjectWebsite('');
    setNewProjectDescription('');
    setNewProjectColor('#3b82f6');
    setAddProjectDialogOpen(false);
    // TODO: Call API to create project
  };

  const allCompanyProjects = [...companyProjects, ...addedProjects];

  const handleInviteMember = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setInvitedMembers(prev => [
      ...prev,
      {
        id: `invited-${Date.now()}`,
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      },
    ]);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('Agent');
    setInviteDialogOpen(false);
    // TODO: Call API to invite member
  };

  const handleRemoveInvited = (id: string) => {
    setInvitedMembers(prev => prev.filter(m => m.id !== id));
    // TODO: Call API to revoke invite
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading company data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !company) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-gray-700">{error || 'Company not found'}</p>
          <Button variant="outline" onClick={() => setViewingCompanyId(null)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  // Get project by ID helper
  const getProjectById = (projectId: string) => {
    return allCompanyProjects.find(p => p.id === projectId);
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setViewingCompanyId(null)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Button>
      </div>

      {/* Company Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="h-14 w-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: company.color || companyColors[company.id] || '#3B82F6' }}
              >
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{editedCompanyName}</h2>
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
                  <Badge className={editedStatus === 'Active' ? 'bg-green-100 text-green-700' : editedStatus === 'Suspended' ? 'bg-red-100 text-red-700' : editedStatus === 'Archived' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}>{editedStatus}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{editedEmail}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{editedLocation}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {defaultMeta.joined}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenEditDialog} disabled={isArchived}>
                <Edit className="h-4 w-4 mr-1.5" />Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveDialogOpen(true)}
                disabled={isArchived}
                className={isArchived ? 'opacity-50 cursor-not-allowed' : ''}
                title={isArchived ? 'Company is already archived' : 'Archive company'}
              >
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archived Banner */}
      {isArchived && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <Archive className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">This company has been archived</p>
            <p className="text-xs text-amber-700 mt-0.5">
              All projects, chats, tickets, and team operations are frozen. New projects, invitations, and plan changes are disabled. Data is preserved in read-only mode.
            </p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100" onClick={handleRestoreCompany}>
            Restore Company
          </Button>
        </div>
      )}

      {/* Company Detail Tabs */}
      <Tabs value={companyDetailTab} onValueChange={setCompanyDetailTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="kb">KB</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FolderKanban className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Projects</p>
                    <p className="text-xl font-bold">{allCompanyProjects.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Headphones className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Agents</p>
                    <p className="text-xl font-bold">{companyAgents.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Tickets</p>
                    <p className="text-xl font-bold">{totalTickets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Revenue</p>
                    <p className="text-xl font-bold">{defaultMeta.mrr}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects & Agents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Projects</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{allCompanyProjects.length}</Badge>
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600" onClick={() => setCompanyDetailTab('projects')}>View all</Button>
                </div>
              </CardHeader>
              <CardContent>
                {allCompanyProjects.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tickets</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCompanyProjects.map(project => (
                        <TableRow key={project.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-sm">{project.name}</p>
                              <p className="text-xs text-gray-500">{project.domain || project.website || '—'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={project.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                              {project.status || 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{project.tickets}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">No projects yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Members</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{companyAgents.length}</Badge>
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600" onClick={() => setCompanyDetailTab('team')}>View all</Button>
                </div>
              </CardHeader>
              <CardContent>
                {companyAgents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Resolved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyAgents.map(agent => (
                        <TableRow key={agent.id} className={`hover:bg-gray-50 ${isArchived ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isArchived && navigate(`/superadmin/agent/${agent.id}`)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs">{agent.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">{agent.name}</p>
                                <p className="text-xs text-gray-500">{agent.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              agent.status === 'Online' ? 'text-green-600 border-green-600 text-xs'
                              : agent.status === 'Away' ? 'text-yellow-600 border-yellow-600 text-xs'
                              : 'text-gray-600 border-gray-600 text-xs'
                            }>
                              {agent.status || 'Online'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{agent.activeTickets || 0}</TableCell>
                          <TableCell className="font-semibold">{agent.resolvedToday || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">No agents assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Usage & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Plan Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">API Requests</span>
                      <span className="text-sm font-semibold">{defaultMeta.usage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${defaultMeta.usage}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">Storage</span>
                      <span className="text-sm font-semibold">34%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '34%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">Seats Used</span>
                      <span className="text-sm font-semibold">{companyAgents.length} / {company.plan === 'Enterprise' ? 'Unlimited' : company.plan === 'Pro' ? '25' : '5'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min((companyAgents.length / (company.plan === 'Enterprise' ? 100 : company.plan === 'Pro' ? 25 : 5)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <div className="h-7 w-7 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Headphones className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm">New agent added: <span className="font-semibold">James Wilson</span></p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <div className="h-7 w-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm">Project <span className="font-semibold">Mobile App</span> created</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <div className="h-7 w-7 bg-purple-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <CreditCard className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm">Payment received: <span className="font-semibold">{defaultMeta.mrr}</span></p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <div className="h-7 w-7 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <TrendingUp className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm">Plan upgraded from <span className="font-semibold">Starter to {company.plan}</span></p>
                      <p className="text-xs text-gray-500">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">All Projects</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search projects..." className="pl-8 h-9 w-[200px]" />
                </div>
                <Button size="sm" className="bg-blue-600" onClick={() => setAddProjectDialogOpen(true)} disabled={isArchived}><Plus className="h-4 w-4 mr-1" />Add Project</Button>
              </div>
            </CardHeader>
            <CardContent>
              {allCompanyProjects.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Tickets</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCompanyProjects.map(project => (
                      <TableRow key={project.id} className={`hover:bg-gray-50 ${isArchived ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isArchived && navigate(`/superadmin/project/${project.id}`)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color + '20' }}>
                              <FolderKanban className="h-4 w-4" style={{ color: project.color }} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{project.name}</p>
                              <p className="text-xs text-gray-500 max-w-[200px] truncate">{project.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {project.website ? (
                            <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                              {project.website.replace('https://', '').replace('http://', '')}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-700 text-xs">Active</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{project.totalTickets}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-orange-600">{project.activeTickets}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm">{project.members}</span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10">
                  <FolderKanban className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No projects yet</p>
                  <Button size="sm" className="mt-3 bg-blue-600" onClick={() => setAddProjectDialogOpen(true)} disabled={isArchived}><Plus className="h-4 w-4 mr-1" />Create First Project</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Project Dialog */}
          <Dialog open={addProjectDialogOpen} onOpenChange={setAddProjectDialogOpen}>
            <DialogContent className="sm:max-w-[640px]">
              <AddProjectForm onClose={() => setAddProjectDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">All Agents</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search agents..." className="pl-8 h-9 w-[200px]" />
                </div>
                <Button size="sm" className="bg-blue-600"><UserPlus className="h-4 w-4 mr-1" />Invite Agent</Button>
              </div>
            </CardHeader>
            <CardContent>
              {companyAgents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active Tickets</TableHead>
                      <TableHead>Resolved Today</TableHead>
                      <TableHead>Avg Response</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyAgents.map((agent, idx) => {
                      const statuses = ['Online', 'Away', 'Offline'] as const;
                      const agentStatus = agent.status || statuses[idx % 3];
                      const activeCount = agent.activeTickets || [3, 5, 2, 4, 1][idx % 5];
                      const resolvedCount = agent.resolvedToday || [12, 8, 15, 6, 10][idx % 5];
                      const avgResp = ['1.8 min', '2.3 min', '1.5 min', '3.1 min', '2.0 min'][idx % 5];
                      return (
                        <TableRow key={agent.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${agentStatus === 'Online' ? 'bg-green-500' : agentStatus === 'Away' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                              </div>
                              <span className="font-semibold text-sm">{agent.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{agent.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${agentStatus === 'Online' ? 'text-green-600 border-green-600' : agentStatus === 'Away' ? 'text-yellow-600 border-yellow-600' : 'text-gray-500 border-gray-400'}`}>
                              {agentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{activeCount}</TableCell>
                          <TableCell className="font-semibold text-green-600">{resolvedCount}</TableCell>
                          <TableCell className="text-sm">{avgResp}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                <DropdownMenuItem><MessageSquare className="mr-2 h-4 w-4" />View Chats</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Remove</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10">
                  <Headphones className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No agents assigned</p>
                  <Button size="sm" className="mt-3 bg-blue-600"><UserPlus className="h-4 w-4 mr-1" />Invite First Agent</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Current Plan</CardTitle>
                <Badge className={company.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : company.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                  {company.plan}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Monthly Recurring Revenue</p>
                    <p className="text-xl font-bold">{defaultMeta.mrr}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Billing Cycle</p>
                    <p className="text-xl font-bold">Monthly</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Next Billing Date</p>
                    <p className="text-xl font-bold">Mar 1, 2026</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                    <p className="text-xl font-bold flex items-center gap-1"><CreditCard className="h-4 w-4" /> •••• 4242</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Plan Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(company.plan === 'Enterprise'
                      ? ['Unlimited agents', 'AI chatbots', 'Advanced analytics', 'Priority support', 'Unlimited history', 'Custom integrations', 'SLA management', 'White-label options']
                      : company.plan === 'Pro'
                      ? ['Up to 25 agents', 'AI chatbots', 'Advanced analytics', 'Priority support', 'Unlimited history', 'Custom integrations']
                      : ['Up to 5 agents', 'Basic chat widget', '500 tickets/month', 'Email support', '30-day history', 'Basic analytics']
                    ).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Agents</span>
                    <span className="text-xs font-semibold">{companyAgents.length} / {company.plan === 'Enterprise' ? '∞' : company.plan === 'Pro' ? '25' : '5'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min((companyAgents.length / (company.plan === 'Enterprise' ? 100 : company.plan === 'Pro' ? 25 : 5)) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Projects</span>
                    <span className="text-xs font-semibold">{allCompanyProjects.length} / {company.plan === 'Enterprise' ? '∞' : company.plan === 'Pro' ? '20' : '3'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min((allCompanyProjects.length / (company.plan === 'Enterprise' ? 50 : company.plan === 'Pro' ? 20 : 3)) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Tickets This Month</span>
                    <span className="text-xs font-semibold">{totalTickets} / {company.plan === 'Enterprise' ? '∞' : company.plan === 'Pro' ? '10,000' : '500'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min((totalTickets / (company.plan === 'Enterprise' ? 10000 : company.plan === 'Pro' ? 10000 : 500)) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Storage</span>
                    <span className="text-xs font-semibold">{defaultMeta.usage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${defaultMeta.usage > 80 ? 'bg-red-500' : defaultMeta.usage > 60 ? 'bg-orange-500' : 'bg-green-600'}`} style={{ width: `${defaultMeta.usage}%` }} />
                  </div>
                </div>
                <div className="pt-2">
                  {company.plan !== 'Enterprise' && (
                    <Button size="sm" className="w-full bg-blue-600" disabled={isArchived}>
                      <ArrowUpRight className="h-4 w-4 mr-1" />Upgrade Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Adjust Plan */}
            <Card className="md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Adjust Plan</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">Change the subscription plan for {editedCompanyName}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'Free', price: '$0', period: 'forever', color: 'gray', features: ['1 agent', 'Basic chat widget', '100 tickets/month', 'Email support', '7-day chat history'] },
                    { name: 'Starter', price: '$19', period: 'per user/month', color: 'green', features: ['Up to 5 agents', 'Unlimited chats', 'Unlimited tickets', 'Email & chat support', '30-day history', 'Basic analytics'] },
                    { name: 'Pro', price: '$49', period: 'per user/month', color: 'blue', popular: true, features: ['Up to 25 agents', 'AI chatbots', 'Advanced analytics', 'Priority support', 'Unlimited history', 'Custom integrations', 'SLA management'] },
                    { name: 'Enterprise', price: 'Custom', period: 'contact us', color: 'purple', features: ['Unlimited agents', 'AI chatbots', 'Advanced analytics', 'Dedicated account manager', 'Custom AI training', 'White-label options', 'GDPR compliance', '24/7 phone support'] },
                  ].map((plan) => {
                    const isCurrent = company.plan === plan.name;
                    const borderColor = plan.color === 'gray' ? 'border-gray-300' : plan.color === 'green' ? 'border-green-500' : plan.color === 'blue' ? 'border-blue-500' : 'border-purple-500';
                    const badgeBg = plan.color === 'gray' ? 'bg-gray-100 text-gray-700' : plan.color === 'green' ? 'bg-green-100 text-green-700' : plan.color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
                    const isDowngrade = (['Free', 'Starter', 'Pro', 'Enterprise'].indexOf(plan.name) < ['Free', 'Starter', 'Pro', 'Enterprise'].indexOf(company.plan));
                    return (
                      <div key={plan.name} className={`relative rounded-xl border-2 p-4 transition-all ${isCurrent ? borderColor + ' bg-gray-50/50' : 'border-gray-200 hover:border-gray-300'} ${plan.popular && !isCurrent ? 'ring-1 ring-blue-200' : ''}`}>
                        {plan.popular && !isCurrent && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                            <Badge className="bg-blue-600 text-white text-[10px] px-2">Popular</Badge>
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                            <Badge className={`${badgeBg} text-[10px] px-2`}>Current Plan</Badge>
                          </div>
                        )}
                        <div className="text-center pt-2 pb-3">
                          <h4 className="text-sm font-semibold">{plan.name}</h4>
                          <div className="mt-1.5">
                            <span className="text-2xl font-bold">{plan.price}</span>
                            {plan.period !== 'forever' && plan.period !== 'contact us' && (
                              <span className="text-xs text-gray-500 ml-1">/{plan.period.split('/')[1]}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{plan.period}</p>
                        </div>
                        <div className="space-y-1.5 mb-4">
                          {plan.features.map((f, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                              <span className="text-gray-600">{f}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          {isCurrent ? (
                            <Button size="sm" variant="outline" className="w-full text-xs" disabled>Current Plan</Button>
                          ) : isDowngrade ? (
                            <Button size="sm" variant="outline" className="w-full text-xs text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700" disabled={isArchived}>
                              <ArrowDownRight className="h-3.5 w-3.5 mr-1" />Downgrade
                            </Button>
                          ) : (
                            <Button size="sm" className="w-full text-xs bg-blue-600 hover:bg-blue-700" disabled={isArchived}>
                              <ArrowUpRight className="h-3.5 w-3.5 mr-1" />Upgrade
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-800 font-semibold">Plan changes take effect immediately</p>
                    <p className="text-xs text-amber-700 mt-0.5">Upgrades are prorated. Downgrades apply at the end of the current billing cycle. The company admin will be notified by email.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Chats Tab */}
        <TabsContent value="chats" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Chats</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search chats..." className="pl-8 h-9 w-[200px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {companyChats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyChats.map(chat => {
                      const project = getProjectById(chat.projectId);
                      return (
                        <TableRow key={chat.id} className={`hover:bg-gray-50 ${isArchived ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isArchived && navigate(`/superadmin/chats/${chat.id}`)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs">{chat.avatar}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">{chat.customer}</p>
                                {chat.unread > 0 && <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">{chat.unread}</Badge>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{chat.preview}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              {chat.isAIBot && <CircleDot className="h-3.5 w-3.5 text-purple-500" />}
                              <span>{chat.agent}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{project?.name || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={chat.status === 'active' ? 'text-green-600 border-green-600 text-xs' : 'text-gray-500 border-gray-400 text-xs'}>
                              {chat.status === 'active' ? 'Active' : 'Offline'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{chat.time}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No chats found for this company</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Support Tickets</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search tickets..." className="pl-8 h-9 w-[200px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {companyTickets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyTickets.map(ticket => (
                      <TableRow key={ticket.id} className={`hover:bg-gray-50 ${isArchived ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isArchived && navigate(`/superadmin/tickets/${ticket.id}`)}>
                        <TableCell className="font-mono text-sm text-blue-600">{ticket.id}</TableCell>
                        <TableCell className="font-semibold text-sm">{ticket.subject}</TableCell>
                        <TableCell className="text-sm">{ticket.customer}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${ticket.priority === 'high' ? 'text-red-600 border-red-600' : ticket.priority === 'medium' ? 'text-yellow-600 border-yellow-600' : 'text-gray-500 border-gray-400'}`}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{ticket.assignedTo}</TableCell>
                        <TableCell className="text-sm text-gray-500">{ticket.created}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No tickets found for this company</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KB Tab */}
        <TabsContent value="kb" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Knowledge Base Articles</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search articles..." className="pl-8 h-9 w-[200px]" />
                </div>
                <Button size="sm" className="bg-blue-600" disabled={isArchived} onClick={() => navigate('/superadmin/create-article', { state: { companyId: viewingCompanyId, companyName: company.name } })}><Plus className="h-4 w-4 mr-1" />New Article</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: 1, title: 'Getting Started Guide', category: 'Onboarding', status: 'Published', views: 1250, helpful: 89, updated: 'Feb 5, 2026' },
                    { id: 2, title: 'How to Reset Your Password', category: 'Account', status: 'Published', views: 890, helpful: 95, updated: 'Jan 28, 2026' },
                    { id: 3, title: 'Billing & Invoices FAQ', category: 'Billing', status: 'Published', views: 560, helpful: 72, updated: 'Jan 15, 2026' },
                    { id: 4, title: 'API Integration Guide', category: 'Developer', status: 'Draft', views: 120, helpful: 60, updated: 'Feb 8, 2026' },
                    { id: 5, title: 'Troubleshooting Common Issues', category: 'Support', status: 'Published', views: 734, helpful: 81, updated: 'Feb 1, 2026' },
                  ].map(article => (
                    <TableRow key={article.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold text-sm">{article.title}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{article.category}</Badge></TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${article.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {article.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{article.updated}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Team Members</CardTitle>
              <Button size="sm" className="bg-blue-600" onClick={() => setInviteDialogOpen(true)} disabled={isArchived}><UserPlus className="h-4 w-4 mr-1" />Invite Member</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chats</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-purple-100 text-purple-700">A</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">{editedCompanyName.split(' ')[0]} Admin</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{editedEmail}</TableCell>
                    <TableCell><Badge className="bg-purple-100 text-purple-700 text-xs">Admin</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-green-600 border-green-600 text-xs">Online</Badge></TableCell>
                    <TableCell className="text-sm text-gray-500">—</TableCell>
                    <TableCell className="text-sm text-gray-500">—</TableCell>
                    <TableCell className="text-sm text-gray-500">Just now</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                  {companyAgents.map((agent, idx) => {
                    const statuses = ['Online', 'Away', 'Offline'] as const;
                    const agentStatus = agent.status || statuses[idx % 3];
                    const lastActives = ['2 min ago', '15 min ago', '1 hour ago', '30 min ago', '5 min ago'];
                    const chatCounts = [4, 7, 2, 5, 3];
                    const ticketCounts = [3, 5, 2, 4, 1];
                    return (
                      <TableRow key={agent.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm">{agent.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{agent.email}</TableCell>
                        <TableCell><Badge className="bg-blue-100 text-blue-700 text-xs">Agent</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${agentStatus === 'Online' ? 'text-green-600 border-green-600' : agentStatus === 'Away' ? 'text-yellow-600 border-yellow-600' : 'text-gray-500 border-gray-400'}`}>
                            {agentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{chatCounts[idx % 5]}</TableCell>
                        <TableCell className="text-sm">{ticketCounts[idx % 5]}</TableCell>
                        <TableCell className="text-sm text-gray-500">{lastActives[idx % 5]}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit Role</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {invitedMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm">{member.name}</span>
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-500">Invited</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{member.email}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${member.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-gray-500 border-gray-400 text-xs">Pending</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">—</TableCell>
                      <TableCell className="text-sm text-gray-500">—</TableCell>
                      <TableCell className="text-sm text-gray-500">—</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Mail className="mr-2 h-4 w-4" />Resend Invite</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveInvited(member.id)}><Trash2 className="mr-2 h-4 w-4" />Revoke Invite</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Invite Member Dialog */}
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join {editedCompanyName}'s team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="invite-name">Full Name</Label>
                  <Input
                    id="invite-name"
                    placeholder="e.g. Jane Smith"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="e.g. jane@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as 'Admin' | 'Agent')}>
                    <SelectTrigger id="invite-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agent">Agent</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                <Button
                  className="bg-blue-600"
                  onClick={handleInviteMember}
                  disabled={!inviteName.trim() || !inviteEmail.trim()}
                >
                  <Mail className="h-4 w-4 mr-1" />Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Transaction History</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Export CSV</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: 'INV-2026-012', date: 'Feb 1, 2026', desc: `${company.plan} Plan - Monthly`, amount: defaultMeta.mrr, status: 'Paid' },
                    { id: 'INV-2026-008', date: 'Jan 1, 2026', desc: `${company.plan} Plan - Monthly`, amount: defaultMeta.mrr, status: 'Paid' },
                    { id: 'INV-2025-052', date: 'Dec 1, 2025', desc: `${company.plan} Plan - Monthly`, amount: defaultMeta.mrr, status: 'Paid' },
                    { id: 'INV-2025-047', date: 'Nov 1, 2025', desc: `${company.plan} Plan - Monthly`, amount: defaultMeta.mrr, status: 'Paid' },
                    { id: 'INV-2025-039', date: 'Oct 1, 2025', desc: `${company.plan} Plan - Monthly`, amount: defaultMeta.mrr, status: 'Paid' },
                    { id: 'INV-2025-031', date: 'Sep 1, 2025', desc: 'Plan Upgrade Fee', amount: '$49.00', status: 'Paid' },
                  ].map(tx => (
                    <TableRow key={tx.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm text-blue-600">{tx.id}</TableCell>
                      <TableCell className="text-sm">{tx.date}</TableCell>
                      <TableCell className="text-sm">{tx.desc}</TableCell>
                      <TableCell className="font-semibold">{tx.amount}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 text-xs">{tx.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-xs"><Download className="h-3.5 w-3.5 mr-1" />PDF</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Activity History</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Search activity..." className="pl-8 h-9 w-[200px]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {[
                  { icon: Headphones, color: 'bg-green-100 text-green-600', action: 'New agent added', detail: 'James Wilson joined the team', time: '2 hours ago', date: 'Feb 11, 2026' },
                  { icon: FolderKanban, color: 'bg-blue-100 text-blue-600', action: 'Project created', detail: 'Mobile App project was created', time: '1 day ago', date: 'Feb 10, 2026' },
                  { icon: CreditCard, color: 'bg-purple-100 text-purple-600', action: 'Payment received', detail: `Invoice INV-2026-012 paid — ${defaultMeta.mrr}`, time: '3 days ago', date: 'Feb 8, 2026' },
                  { icon: ArrowUpRight, color: 'bg-orange-100 text-orange-600', action: 'Plan upgraded', detail: `Upgraded from Starter to ${company.plan}`, time: '1 week ago', date: 'Feb 4, 2026' },
                  { icon: Settings, color: 'bg-gray-100 text-gray-600', action: 'Settings updated', detail: 'Chat widget appearance was customized', time: '1 week ago', date: 'Feb 3, 2026' },
                  { icon: UserPlus, color: 'bg-teal-100 text-teal-600', action: 'Agent invited', detail: 'Invitation sent to emily@company.com', time: '2 weeks ago', date: 'Jan 28, 2026' },
                  { icon: BookOpen, color: 'bg-indigo-100 text-indigo-600', action: 'KB article published', detail: 'Published "Getting Started Guide"', time: '2 weeks ago', date: 'Jan 27, 2026' },
                  { icon: Shield, color: 'bg-red-100 text-red-600', action: 'Security alert', detail: 'Admin password was changed', time: '3 weeks ago', date: 'Jan 21, 2026' },
                  { icon: Globe, color: 'bg-cyan-100 text-cyan-600', action: 'Domain verified', detail: `${allCompanyProjects[0]?.website?.replace('https://', '') || 'company.com'} was verified`, time: '1 month ago', date: 'Jan 11, 2026' },
                  { icon: Building2, color: 'bg-amber-100 text-amber-600', action: 'Company registered', detail: `${company.name} account was created`, time: defaultMeta.joined, date: defaultMeta.joined },
                ].map((event, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${event.color.split(' ')[0]}`}>
                      <event.icon className={`h-4 w-4 ${event.color.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{event.action}</p>
                      <p className="text-xs text-gray-500">{event.detail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{event.time}</p>
                      <p className="text-[10px] text-gray-300">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update {editedCompanyName}'s information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Company Name</Label>
              <Input
                id="edit-name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={tempStatus} onValueChange={setTempStatus}>
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-blue-600"
              onClick={handleSaveEdit}
              disabled={!tempName.trim() || !tempEmail.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Company Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Company
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete <span className="font-semibold text-gray-900">{editedCompanyName}</span> and all associated data including projects, tickets, chats, and team members.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-confirm" className="text-sm text-gray-600">
              Type <span className="font-mono font-semibold text-gray-900">{editedCompanyName}</span> to confirm deletion:
            </Label>
            <Input
              id="delete-confirm"
              className="mt-2"
              placeholder={editedCompanyName}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(''); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCompany}
              disabled={deleteConfirmText !== editedCompanyName}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Company Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <Archive className="h-5 w-5" />
              Archive Company
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to archive <span className="font-semibold text-gray-900">{editedCompanyName}</span>? This will apply the following restrictions:
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>All active projects will be frozen — no new tickets or chats can be created</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <Users className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Team invitations and role changes will be disabled</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <CreditCard className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Billing will be paused — no plan upgrades or downgrades allowed</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <Edit className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Company details will become read-only</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <Eye className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>All existing data will be preserved and viewable</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="archive-reason" className="text-sm">Reason for archiving <span className="text-gray-400">(optional)</span></Label>
              <Textarea
                id="archive-reason"
                placeholder="e.g. Customer requested account closure, non-payment, etc."
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setArchiveDialogOpen(false); setArchiveReason(''); }}>Cancel</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleArchiveCompany}
            >
              <Archive className="h-4 w-4 mr-1.5" />
              Archive Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

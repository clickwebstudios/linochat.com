import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, CheckCircle,
  TrendingUp, Star, MessageSquare, User, MoreVertical, Edit,
  UserX, Shield, ThumbsUp, FolderOpen, ChevronDown, Plus, Loader2,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { useAgentStatus, agentStatusStore } from '../../data/agentStatusStore';
import { useLayout } from '../../components/layouts/LayoutContext';

interface AgentData {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  phone?: string;
  location?: string;
  role: string;
  status: string;
  avatar_url?: string;
  bio?: string;
  join_date?: string;
  last_active?: string;
  tickets_resolved?: number;
  active_chats_count?: number;
  projects?: Array<{ id: string; name: string; color?: string }>;
  ownedProjects?: Array<{ id: string; name: string; color?: string }>;
  response_time_data?: Array<{ day: string; time: number }>;
}

interface Project {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

interface Ticket {
  id: number;
  ticket_id?: string;
  subject: string;
  customer: string;
  status: string;
  priority: string;
  lastUpdate?: string;
}

function getInitials(agent: AgentData) {
  const f = agent.first_name?.[0] ?? '';
  const l = agent.last_name?.[0] ?? '';
  return (f + l).toUpperCase() || (agent.email?.[0]?.toUpperCase() ?? '?');
}

export default function AgentDetails() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleMobileSidebar } = useLayout();
  const currentUser = useAuthStore((s) => s.user);

  const pathSegments = location.pathname.split('/');
  const basePath = `/${pathSegments[1]}`;

  const [agent, setAgent] = useState<AgentData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);

  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone: '', location: '', bio: '' });
  const [selectedRole, setSelectedRole] = useState('agent');
  const [pendingProjectIds, setPendingProjectIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const agentStatus = useAgentStatus(agentId ?? '');

  // Fetch agent + projects + tickets in parallel
  useEffect(() => {
    if (!agentId) return;
    setLoading(true);

    Promise.all([
      api.get<{ success: boolean; data: AgentData[] }>('/api/agent/users'),
      api.get<{ success: boolean; data: Project[] }>('/api/projects'),
      api.get<{ success: boolean; data: Ticket[] }>('/api/agent/tickets', { params: { per_page: 100 } }),
    ])
      .then(([usersRes, projectsRes, ticketsRes]) => {
        const users: AgentData[] = (usersRes.data as any)?.data ?? (usersRes.data as any) ?? [];
        const found = users.find((u) => String(u.id) === String(agentId));
        if (found) {
          setAgent(found);
          setEditForm({
            first_name: found.first_name ?? '',
            last_name: found.last_name ?? '',
            email: found.email ?? '',
            phone: found.phone ?? '',
            location: found.location ?? '',
            bio: found.bio ?? '',
          });
          setSelectedRole((found.role ?? 'agent').toLowerCase());
          const assignedIds = (found.projects ?? []).map((p) => String(p.id));
          setPendingProjectIds(assignedIds);
        }
        const allProjects: Project[] = (projectsRes.data as any)?.data ?? (projectsRes.data as any) ?? [];
        setProjects(allProjects);

        const allTickets: Ticket[] = (ticketsRes.data as any)?.data ?? (ticketsRes.data as any) ?? [];
        setTickets(allTickets);
      })
      .catch(() => { /* silently ignore */ })
      .finally(() => setLoading(false));
  }, [agentId]);

  const agentProjects = agent
    ? [...(agent.projects ?? []), ...(agent.ownedProjects ?? [])].filter(
        (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
      )
    : [];

  const agentTickets = tickets.filter(
    (t: any) => String(t.assigned_to) === String(agentId) || String(t.agent_id) === String(agentId)
  );

  const responseTimeData = agent?.response_time_data ?? [
    { day: 'Mon', time: 0 }, { day: 'Tue', time: 0 }, { day: 'Wed', time: 0 },
    { day: 'Thu', time: 0 }, { day: 'Fri', time: 0 }, { day: 'Sat', time: 0 }, { day: 'Sun', time: 0 },
  ];

  const handleSaveEdit = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      await api.put(`/api/superadmin/agents/${agent.id}`, editForm);
      setAgent((prev) => prev ? { ...prev, ...editForm } : prev);
      setEditOpen(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleChangeRole = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      await api.put(`/api/superadmin/agents/${agent.id}`, { role: selectedRole });
      setAgent((prev) => prev ? { ...prev, role: selectedRole } : prev);
      setChangeRoleOpen(false);
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      await api.delete(`/api/superadmin/agents/${agent.id}`);
      agentStatusStore.setStatus(agent.id, 'Deactivated');
      setAgent((prev) => prev ? { ...prev, status: 'Deactivated' } : prev);
      setDeactivateOpen(false);
      toast.success('Agent deactivated');
    } catch {
      toast.error('Failed to deactivate agent');
    } finally { setSaving(false); }
  };

  const handleSaveProjects = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      // For each newly added project, call the project agents assign endpoint
      const currentIds = agentProjects.map((p) => String(p.id));
      const toAdd = pendingProjectIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !pendingProjectIds.includes(id));

      await Promise.all([
        ...toAdd.map((pid) =>
          api.post(`/api/projects/${pid}/invitations`, { email: agent.email, role: agent.role })
        ),
        ...toRemove.map((pid) =>
          api.delete(`/api/projects/${pid}/agents/${agent.id}`)
        ),
      ]);

      // Refresh agent
      const res = await api.get<{ data: AgentData[] }>('/api/agent/users');
      const users: AgentData[] = (res.data as any)?.data ?? [];
      const updated = users.find((u) => String(u.id) === String(agentId));
      if (updated) setAgent(updated);
      setAssignOpen(false);
      toast.success('Projects updated');
    } catch {
      toast.error('Failed to update projects');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Agent not found.</p>
        <Button variant="outline" onClick={() => navigate(`${basePath}/users`)}>Back to Team</Button>
      </div>
    );
  }

  const displayName = agent.name ?? `${agent.first_name} ${agent.last_name}`.trim();
  const currentUserInitials = currentUser
    ? (((currentUser as any).first_name?.[0] ?? '') + ((currentUser as any).last_name?.[0] ?? ''))
    : '?';

  return (
    <>
      {/* Inner page header */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileSidebar}>
            <span className="sr-only">Menu</span>
          </Button>
          <Button variant="ghost" onClick={() => navigate(`${basePath}/users`)} className="hidden md:inline-flex">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team
          </Button>
        </div>
        <div className="hidden md:flex items-center gap-3 pl-4 border-l">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-blue-600 text-white">
              {currentUserInitials.toUpperCase() || 'ME'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold">
              {(currentUser as any)?.first_name} {(currentUser as any)?.last_name}
            </div>
            <div className="text-xs text-gray-500 capitalize">{(currentUser as any)?.role ?? 'Agent'}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><ChevronDown className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`${basePath}/profile-settings`)}>
                <User className="mr-2 h-4 w-4" /> Profile Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {/* Agent Header Card */}
        <Card className="mb-6">
          <CardContent className="px-5 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {getInitials(agent)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">{displayName}</h1>
                  <Badge variant={
                    agentStatus === 'Active' ? 'default' :
                    agentStatus === 'Away' ? 'secondary' :
                    agentStatus === 'Deactivated' ? 'destructive' : 'outline'
                  }>
                    {agentStatus || agent.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">{agent.role}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" />{agent.email}</span>
                  {agent.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" />{agent.phone}</span>}
                  {agent.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" />{agent.location}</span>}
                  {agent.join_date && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      Joined {new Date(agent.join_date).toLocaleDateString()}
                    </span>
                  )}
                  {agent.last_active && (
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-400" />Active {agent.last_active}</span>
                  )}
                </div>
                {agent.bio && <p className="text-sm text-gray-500 mt-1.5 line-clamp-1">{agent.bio}</p>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChangeRoleOpen(true)}>
                    <Shield className="h-4 w-4 mr-2" /> Change Role
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => setDeactivateOpen(true)}>
                    <UserX className="h-4 w-4 mr-2" /> Deactivate Agent
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
              <h3 className="text-3xl font-bold">{agent.tickets_resolved ?? 0}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">All time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Active Chats</p>
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold">{agent.active_chats_count ?? 0}</h3>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-gray-500">Currently open</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Projects</p>
                <FolderOpen className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold">{agentProjects.length}</h3>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-gray-500">Assigned</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Status</p>
                <ThumbsUp className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-xl font-bold capitalize">{agentStatus || agent.status}</h3>
              <div className="flex items-center gap-1 mt-2">
                <Star className="h-3 w-3 text-yellow-500" />
                <span className="text-xs text-gray-500">Current</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Assigned Tickets</TabsTrigger>
            <TabsTrigger value="projects">Assign Projects</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assigned Projects */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Assigned Projects</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => { setPendingProjectIds(agentProjects.map((p) => String(p.id))); setAssignOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" /> Assign
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {agentProjects.length > 0 ? agentProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color ? `${project.color}20` : '#dbeafe' }}>
                            <FolderOpen className="h-5 w-5" style={{ color: project.color || '#2563eb' }} />
                          </div>
                          <div className="flex items-center gap-2">
                            {project.color && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />}
                            <span className="font-medium">{project.name}</span>
                          </div>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    )) : (
                      <div className="text-center py-6 text-gray-500">
                        <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No projects assigned</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Response Time Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
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
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Tickets ({agentTickets.length})</CardTitle>
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
                    {agentTickets.length > 0 ? agentTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.ticket_id ?? `#T-${ticket.id}`}</TableCell>
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
                        <TableCell>{ticket.lastUpdate ?? '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/tickets/${ticket.id}`)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
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

          {/* Assign Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Assign Projects</CardTitle>
                  <p className="text-sm text-gray-500">{agentProjects.length} project{agentProjects.length !== 1 ? 's' : ''} assigned</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {projects.map((project) => {
                    const isAssigned = agentProjects.some((p) => String(p.id) === String(project.id));
                    return (
                      <div key={project.id} className={`flex items-center justify-between p-3 rounded-lg border ${isAssigned ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color ? `${project.color}20` : '#dbeafe' }}>
                            <FolderOpen className="h-4 w-4" style={{ color: project.color || '#2563eb' }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {project.color && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />}
                              <span className="text-sm font-medium">{project.name}</span>
                            </div>
                          </div>
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Agent Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={editForm.first_name} onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={editForm.last_name} onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleOpen} onOpenChange={setChangeRoleOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>Select a new role for {displayName}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeRole} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {displayName}? They will lose access to the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Projects Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Assign Projects</DialogTitle>
            <DialogDescription>Select projects for {displayName}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                <Checkbox
                  id={`assign-${project.id}`}
                  checked={pendingProjectIds.includes(String(project.id))}
                  onCheckedChange={() =>
                    setPendingProjectIds((prev) =>
                      prev.includes(String(project.id))
                        ? prev.filter((id) => id !== String(project.id))
                        : [...prev, String(project.id)]
                    )
                  }
                />
                <label htmlFor={`assign-${project.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                  {project.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />}
                  <span className="text-sm">{project.name}</span>
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">{pendingProjectIds.length} project{pendingProjectIds.length !== 1 ? 's' : ''} selected</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProjects} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

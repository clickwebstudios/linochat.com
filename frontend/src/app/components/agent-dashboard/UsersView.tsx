import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
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
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import {
  User,
  MoreVertical,
  X,
  ChevronDown,
  UserPlus,
  ArrowRightLeft,
  Loader2,
  Send,
} from 'lucide-react';
import { useProjectsStore, selectProjects, selectProjectsLoading } from '../../stores/projectsStore';
import { useAgentStatuses, agentStatusStore } from '../../data/agentStatusStore';
import { toast } from 'sonner';
import { api } from '../../api/client';

interface UsersViewProps {
  basePath: string;
  selectedProjects?: string[];
  selectedCompanyId?: string | null;
}

interface AgentRow {
  id: string;
  invitation_id?: string | null;
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: string;
  projects: string[];
  ticketsResolved: number;
  avgResponseTime: string;
  rating: number | null;
  lastActive: string;
}

export function UsersView({ basePath, selectedProjects, selectedCompanyId }: UsersViewProps) {
  const navigate = useNavigate();
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [agentToDeactivate, setAgentToDeactivate] = useState<AgentRow | null>(null);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const agentStatuses = useAgentStatuses();
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'agent' as 'agent' | 'admin',
    projects: [] as string[]
  });
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const projects = useProjectsStore(selectProjects);
  const projectsLoading = useProjectsStore(selectProjectsLoading);
  const fetchProjects = useProjectsStore((s) => s.fetchProjects);

  const loadAgents = useCallback(async (companyId?: string | null) => {
    setAgentsLoading(true);
    setAgentsError(null);
    try {
      // Build URL with company_id filter for superadmin
      const targetCompanyId = companyId !== undefined ? companyId : selectedCompanyId;
      const url = targetCompanyId
        ? `/agent/users?company_id=${targetCompanyId}`
        : '/agent/users';
      
      const response = await api.get<{ success: boolean; data: Array<{
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
        status: string;
        projects: string[];
        tickets_resolved: number;
        last_active: string | null;
      }> }>(url);
      if (response.success && Array.isArray(response.data)) {
        const mapped: AgentRow[] = response.data.map((u: any) => {
          const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email;
          const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
          const roleLabel = u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Agent';
          return {
            id: String(u.id),
            invitation_id: u.invitation_id ?? null,
            name,
            email: u.email,
            role: roleLabel,
            avatar: initials,
            status: u.status || 'Offline',
            projects: u.projects || [],
            ticketsResolved: u.tickets_resolved ?? 0,
            avgResponseTime: '—',
            rating: null,
            lastActive: u.last_active || 'Never',
          };
        });
        setAgents(mapped);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      setAgentsError('Failed to load team members');
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents, selectedCompanyId]);

  useEffect(() => {
    if (addUserDialogOpen) {
      fetchProjects();
    }
  }, [addUserDialogOpen, fetchProjects]);

  // Filter agents based on selected projects
  const selectedProjectNames = selectedProjects
    ? projects.filter(p => selectedProjects.includes(String(p.id))).map(p => p.name)
    : [];

  const filteredAgents = (!selectedProjects || selectedProjects.length === projects.length)
    ? agents
    : agents.filter(agent =>
        agent.projects.some(projectName => selectedProjectNames.includes(projectName))
      );

  const handleAddUser = async () => {
    if (!newUser.email.trim()) {
      setAddUserError('Email is required');
      return;
    }
    if (newUser.projects.length === 0) {
      setAddUserError('Select at least one project');
      return;
    }
    setAddUserSubmitting(true);
    setAddUserError(null);
    try {
      const response = await api.post<{ email_sent?: boolean }>('/agent/invitations', {
        email: newUser.email.trim(),
        first_name: newUser.firstName.trim() || undefined,
        last_name: newUser.lastName.trim() || undefined,
        role: newUser.role,
        project_ids: newUser.projects,
      });
      if (response.success) {
        setAddUserDialogOpen(false);
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          role: 'agent',
          projects: [],
        });
        loadAgents();
        const msg = response.message || 'Invitation sent';
        if (response.data?.email_sent === false || msg.includes('Configure MAIL')) {
          toast.warning(msg);
        } else {
          toast.success(msg);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation';
      setAddUserError(msg);
    } finally {
      setAddUserSubmitting(false);
    }
  };

  const handleDeactivateAgent = () => {
    if (agentToDeactivate) {
      agentStatusStore.setStatus(agentToDeactivate.id, 'Deactivated');
      setDeactivateDialogOpen(false);
      setAgentToDeactivate(null);
    }
  };

  const handleResendInvite = async (agent: AgentRow) => {
    const invId = agent.invitation_id;
    if (!invId) return;
    setResendingId(agent.id);
    setResendError(null);
    try {
      const res = await api.post<unknown>(`/agent/invitations/${invId}/resend`, {});
      if (res.success) {
        loadAgents();
        if (res.message?.includes('Configure MAIL')) {
          toast.warning(res.message);
        } else {
          toast.success(res.message || 'Invitation resent');
        }
      } else {
        setResendError(res.message || 'Failed to resend invitation');
      }
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Failed to resend invitation');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your support team and their permissions</p>
          {resendError && (
            <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {resendError}
              <button type="button" className="ml-2 underline" onClick={() => setResendError(null)}>Dismiss</button>
            </div>
          )}
        </div>
        <Button onClick={() => setAddUserDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Agents ({filteredAgents.length})</CardTitle>
            <div className="flex gap-2">
              <Input 
                placeholder="Search agents..." 
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Tickets Resolved</TableHead>
                <TableHead>Avg Response</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading team members...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : agentsError ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="text-muted-foreground">
                      <User className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="font-medium">{agentsError}</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => loadAgents()}>
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="text-muted-foreground">
                      <User className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="font-medium">No agents found</p>
                      <p className="text-sm mt-1">
                        {selectedProjects && selectedProjects.length > 0
                          ? 'No team members match the selected project filter.'
                          : 'No team members in your organization yet.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
              filteredAgents.map((agent) => (
                <TableRow 
                  key={agent.id} 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => !agent.invitation_id && navigate(`${basePath}/users/${agent.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {agent.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground">{agent.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={agent.role === 'Admin' ? 'default' : 'secondary'}>
                      {agent.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const status = agentStatuses[agent.id] ?? agent.status;
                        return (
                          <>
                            <div className={`h-2 w-2 rounded-full ${
                              status === 'Active' ? 'bg-green-500' :
                              status === 'Away' ? 'bg-yellow-500' :
                              status === 'Deactivated' ? 'bg-red-500' :
                              status === 'Invited' ? 'bg-primary' : 'bg-muted-foreground'
                            }`} />
                            <span className="text-sm">{status}</span>
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {agent.projects.slice(0, 2).map((project, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {project}
                        </Badge>
                      ))}
                      {agent.projects.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.projects.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{agent.ticketsResolved}</TableCell>
                  <TableCell>{agent.avgResponseTime}</TableCell>
                  <TableCell>
                    {agent.rating != null ? (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{agent.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{agent.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        {/* Show profile for all agents except invited ones */}
                        {!agent.invitation_id && (
                          <DropdownMenuItem onClick={() => navigate(`${basePath}/users/${agent.id}`)}>
                            <User className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                        )}
                        
                        {/* Resend invite for invited agents */}
                        {agent.status === 'Invited' && agent.invitation_id && (
                          <DropdownMenuItem
                            onSelect={() => handleResendInvite(agent)}
                            disabled={resendingId === agent.id}
                          >
                            {resendingId === agent.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Resend Invite
                          </DropdownMenuItem>
                        )}
                        
                        {/* Assign Projects - available for all */}
                        <DropdownMenuItem>
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Assign Projects
                        </DropdownMenuItem>
                        
                        {/* Deactivate - available for all */}
                        <DropdownMenuItem className="text-red-600" onSelect={() => {
                          setAgentToDeactivate(agent);
                          setTimeout(() => setDeactivateDialogOpen(true), 0);
                        }}>
                          <X className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={(open) => {
        setAddUserDialogOpen(open);
        if (!open) setAddUserError(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Agent</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new agent. They will receive a link to create their account and join the selected project(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john.doe@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {newUser.role === 'admin' ? 'Admin' : 'Agent'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => setNewUser({ ...newUser, role: 'agent' })}>
                    Agent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNewUser({ ...newUser, role: 'admin' })}>
                    Admin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {addUserError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {addUserError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Assign Projects</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {projectsLoading ? (
                  <p className="text-sm text-muted-foreground py-2">Loading projects...</p>
                ) : projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No projects available. Create a project first.</p>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={newUser.projects.includes(String(project.id))}
                        onCheckedChange={(checked) => {
                          const id = String(project.id);
                          if (checked) {
                            setNewUser({ ...newUser, projects: [...newUser.projects, id] });
                          } else {
                            setNewUser({ ...newUser, projects: newUser.projects.filter(p => p !== id) });
                          }
                        }}
                      />
                      <label 
                        htmlFor={`project-${project.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color || '#3b82f6' }}
                        />
                        <span className="text-sm">{project.name}</span>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserDialogOpen(false)} disabled={addUserSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={addUserSubmitting}>
              {addUserSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Agent
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Agent Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {agentToDeactivate?.name}? They will lose access to the platform and their tickets will need to be reassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeactivateAgent}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
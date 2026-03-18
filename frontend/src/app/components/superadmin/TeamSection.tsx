import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import { api, User } from '../../api/client';

const editableRoles = ['Admin', 'Agent', 'Viewer'];

interface ProjectOption {
  id: string;
  name: string;
}

export function TeamSection() {
  const navigate = useNavigate();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviteProjectId, setInviteProjectId] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRoleUserId, setEditRoleUserId] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get<User[]>('/superadmin/agents');
      setUsers(response.data ?? []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (inviteDialogOpen) {
      api.get<{ data: Array<{ id: string; name: string }> }>('/superadmin/projects')
        .then((res) => setProjects(Array.isArray(res.data) ? res.data : (res as any).data?.data ?? []))
        .catch(() => setProjects([]));
    }
  }, [inviteDialogOpen]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteProjectId || inviteLoading) return;
    setInviteLoading(true);
    try {
      await api.post('/superadmin/agents/invite', {
        email: inviteEmail.trim(),
        first_name: inviteFirstName.trim() || undefined,
        last_name: inviteLastName.trim() || undefined,
        role: inviteRole,
        project_id: inviteProjectId,
      });
      toast.success('Invitation sent');
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('agent');
      setInviteProjectId('');
      setInviteFirstName('');
      setInviteLastName('');
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditRole = async (userId: string, newRole: string) => {
    try {
      const response = await api.put<{ success: boolean }>(`/superadmin/agents/${userId}`, { role: newRole.toLowerCase() });
      if (response.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as User['role'] } : u));
        setEditRoleUserId(null);
        toast.success('Role updated');
      }
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (!window.confirm(`Deactivate ${userName}? They will no longer have access.`)) return;
    try {
      const response = await api.delete<{ success: boolean }>(`/superadmin/agents/${userId}`);
      if (response.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success('Agent deactivated');
      }
    } catch (error) {
      toast.error('Failed to deactivate agent');
    }
  };

  const getFullName = (user: User) => {
    return `${user.first_name} ${user.last_name}`.trim();
  };

  const getInitials = (user: User) => {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team</h2>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>Send an invitation to join a project as an agent</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm mb-2 block">Email *</label>
                <Input
                  type="email"
                  placeholder="user@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm mb-2 block">First Name</label>
                  <Input placeholder="John" value={inviteFirstName} onChange={(e) => setInviteFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm mb-2 block">Last Name</label>
                  <Input placeholder="Doe" value={inviteLastName} onChange={(e) => setInviteLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm mb-2 block">Project *</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={inviteProjectId}
                  onChange={(e) => setInviteProjectId(e.target.value)}
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm mb-2 block">Role</label>
                <select className="w-full p-2 border rounded-lg" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  {editableRoles.map((role) => (
                    <option key={role} value={role.toLowerCase()}>{role}</option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full bg-primary"
                onClick={handleInvite}
                disabled={inviteLoading || !inviteEmail.trim() || !inviteProjectId}
              >
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/superadmin/user/${user.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold">{getFullName(user)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          user.status === 'Active' 
                            ? 'text-green-600 border-green-600' 
                            : user.status === 'Away'
                            ? 'text-yellow-600 border-yellow-600'
                            : 'text-muted-foreground border-muted-foreground'
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.join_date).toLocaleDateString()}</TableCell>
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
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditRoleUserId(user.id);
                              setEditRoleValue(user.role);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(user.id, getFullName(user));
                            }}
                          >
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
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editRoleUserId} onOpenChange={(open) => !open && setEditRoleUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Change the user&apos;s role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm mb-2 block">Role</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={editRoleValue}
                onChange={(e) => setEditRoleValue(e.target.value)}
              >
                {editableRoles.map((role) => (
                  <option key={role} value={role.toLowerCase()}>{role}</option>
                ))}
              </select>
            </div>
            <Button
              className="w-full bg-primary"
              onClick={() => editRoleUserId && handleEditRole(editRoleUserId, editRoleValue)}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

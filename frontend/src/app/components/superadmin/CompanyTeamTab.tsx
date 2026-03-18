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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
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
import {
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { api } from '../../api/client';

interface Agent {
  id: string;
  name: string;
  email: string;
  status?: string;
  activeTickets?: number;
  resolvedToday?: number;
  companyId: string;
}

interface InvitedMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Agent';
}

interface CompanyTeamTabProps {
  companyAgents: Agent[];
  editedCompanyName: string;
  editedEmail: string;
  viewingCompanyId: string;
  isArchived: boolean;
  invitedMembers: InvitedMember[];
  setInvitedMembers: React.Dispatch<React.SetStateAction<InvitedMember[]>>;
}

export function CompanyTeamTab({
  companyAgents,
  editedCompanyName,
  editedEmail,
  viewingCompanyId,
  isArchived,
  invitedMembers,
  setInvitedMembers,
}: CompanyTeamTabProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Agent'>('Agent');

  const handleInviteMember = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    try {
      const res = await api.post(`/superadmin/companies/${viewingCompanyId}/invite`, {
        email: inviteEmail.trim(),
        name: inviteName.trim(),
        role: inviteRole.toLowerCase(),
      });
      const data = res.data as { invitation_id: number; email: string; name: string; role: string };
      setInvitedMembers((prev) => [
        ...prev,
        {
          id: String(data.invitation_id),
          name: data.name,
          email: data.email,
          role: inviteRole,
        },
      ]);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('Agent');
      setInviteDialogOpen(false);
    } catch (err) {
      console.error('Failed to invite member:', err);
    }
  };

  const handleRemoveInvited = async (id: string) => {
    try {
      await api.delete(`/invitations/${id}`);
      setInvitedMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to revoke invite:', err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Team Members</CardTitle>
          <Button size="sm" className="bg-primary" onClick={() => setInviteDialogOpen(true)} disabled={isArchived}><UserPlus className="h-4 w-4 mr-1" />Invite Member</Button>
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
              <TableRow className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-secondary/10 text-secondary">A</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{editedCompanyName.split(' ')[0]} Admin</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{editedEmail}</TableCell>
                <TableCell><Badge className="bg-secondary/10 text-secondary text-xs">Admin</Badge></TableCell>
                <TableCell><Badge variant="outline" className="text-green-600 border-green-600 text-xs">Online</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{'\u2014'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{'\u2014'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">Just now</TableCell>
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
                  <TableRow key={agent.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">{agent.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{agent.email}</TableCell>
                    <TableCell><Badge className="bg-primary/10 text-primary text-xs">Agent</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${agentStatus === 'Online' ? 'text-green-600 border-green-600' : agentStatus === 'Away' ? 'text-yellow-600 border-yellow-600' : 'text-muted-foreground border-muted-foreground'}`}>
                        {agentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{chatCounts[idx % 5]}</TableCell>
                    <TableCell className="text-sm">{ticketCounts[idx % 5]}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lastActives[idx % 5]}</TableCell>
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
                <TableRow key={member.id} className="hover:bg-muted/50">
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
                  <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${member.role === 'Admin' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-muted-foreground border-muted-foreground text-xs">Pending</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{'\u2014'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{'\u2014'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{'\u2014'}</TableCell>
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
              className="bg-primary"
              onClick={handleInviteMember}
              disabled={!inviteName.trim() || !inviteEmail.trim()}
            >
              <Mail className="h-4 w-4 mr-1" />Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Switch } from '../ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Edit,
  Ticket,
  ChevronDown,
  Mail,
  X,
  Plus,
  User,
  Bot,
  Sparkles,
  Tag,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/client';

// --- Invite Member Dialog ---
interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onSuccess?: () => void;
}

const roleToApiRole = (role: string): 'agent' | 'admin' => {
  if (role === 'Admin') return 'admin';
  return 'agent';
};

export function InviteMemberDialog({ open, onOpenChange, projectId, onSuccess }: InviteMemberDialogProps) {
  const [emailInvites, setEmailInvites] = useState<Array<{ email: string; role: string }>>([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState('Agent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddEmailInvite = () => {
    const trimmed = newInviteEmail.trim();
    if (trimmed && !emailInvites.find(inv => inv.email.toLowerCase() === trimmed.toLowerCase())) {
      setEmailInvites([...emailInvites, { email: trimmed, role: newInviteRole }]);
      setNewInviteEmail('');
      setNewInviteRole('Agent');
      setError(null);
    }
  };

  const handleRemoveEmailInvite = (email: string) => {
    setEmailInvites(emailInvites.filter(inv => inv.email !== email));
    setError(null);
  };

  const handleAddMembers = async () => {
    if (!projectId || emailInvites.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      let successCount = 0;
      const errors: string[] = [];
      for (const invite of emailInvites) {
        try {
          const res = await api.post<{ success: boolean; message?: string }>('/agent/invitations', {
            email: invite.email,
            role: roleToApiRole(invite.role),
            project_ids: [projectId],
          });
          if (res.success) {
            successCount++;
          } else {
            errors.push(`${invite.email}: ${res.message || 'Failed'}`);
          }
        } catch (err) {
          errors.push(`${invite.email}: ${err instanceof Error ? err.message : 'Failed'}`);
        }
      }
      if (successCount > 0) {
        toast.success(successCount === emailInvites.length
          ? 'Invitations sent successfully'
          : `${successCount} of ${emailInvites.length} invitations sent`);
        setEmailInvites([]);
        setNewInviteEmail('');
        onOpenChange(false);
        onSuccess?.();
      }
      if (errors.length > 0) {
        setError(errors.join('; '));
        if (successCount === 0) {
          toast.error('Failed to send invitations');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitations';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>Invite new members to this project by entering their email address.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter email address"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmailInvite(); } }}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-32">
                  {newInviteRole}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setNewInviteRole('Agent')}>Agent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNewInviteRole('Senior Agent')}>Senior Agent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNewInviteRole('Admin')}>Admin</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleAddEmailInvite} className="bg-blue-600 hover:bg-blue-700">
              <Mail className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {emailInvites.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
              <Label className="text-xs text-gray-600">Pending Invitations ({emailInvites.length})</Label>
              {emailInvites.map((invite, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-gray-500">Role: {invite.role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveEmailInvite(invite.email)}>
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            {emailInvites.length > 0 ? `${emailInvites.length} invitation${emailInvites.length > 1 ? 's' : ''} pending` : 'No invitations added'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleAddMembers}
              disabled={emailInvites.length === 0 || !projectId || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitations
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Create Ticket Dialog ---
interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTicket: {
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    assignTo: string;
    customerId: string;
    aiAutoFill: boolean;
  };
  setNewTicket: (ticket: any) => void;
}

export function CreateTicketDialogPD({ open, onOpenChange, newTicket, setNewTicket }: CreateTicketDialogProps) {
  const resetTicket = () => {
    setNewTicket({ subject: '', description: '', priority: 'medium', assignTo: '', customerId: '', aiAutoFill: false });
  };

  // Get project data from context or props if needed
  const projectName = 'Current Project'; // This should come from context or props
  const projectAgents: { id: string; name: string }[] = []; // This should come from context or props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-600" />
            Create New Ticket
          </DialogTitle>
          <DialogDescription>
            Create a new support ticket for {projectName}. You can manually fill in the details or let AI auto-generate content based on the description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-ticket-subject">Subject *</Label>
            <Input id="new-ticket-subject" placeholder="Brief description of the issue" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-ticket-customer">Customer *</Label>
            <Select value={newTicket.customerId} onValueChange={(value) => setNewTicket({ ...newTicket, customerId: value })}>
              <SelectTrigger id="new-ticket-customer"><SelectValue placeholder="Select a customer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Emma Thompson - emma@example.com</SelectItem>
                <SelectItem value="2">James Wilson - james@example.com</SelectItem>
                <SelectItem value="3">Sarah Martinez - sarah@example.com</SelectItem>
                <SelectItem value="4">Michael Brown - michael@example.com</SelectItem>
                <SelectItem value="5">Lisa Anderson - lisa@example.com</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-ticket-description">Description *</Label>
              <div className="flex items-center gap-2">
                <Switch id="new-ticket-ai-autofill" checked={newTicket.aiAutoFill} onCheckedChange={(checked) => setNewTicket({ ...newTicket, aiAutoFill: checked })} />
                <Label htmlFor="new-ticket-ai-autofill" className="text-sm text-gray-600 cursor-pointer flex items-center gap-1">
                  <Bot className="h-3.5 w-3.5 text-purple-600" />
                  AI Auto-fill
                </Label>
              </div>
            </div>
            <Textarea id="new-ticket-description" placeholder="Detailed description of the issue..." value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} rows={5} />
            {newTicket.aiAutoFill && (
              <p className="text-xs text-purple-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI will automatically categorize and suggest solutions based on this description
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-ticket-priority">Priority *</Label>
              <Select value={newTicket.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTicket({ ...newTicket, priority: value })}>
                <SelectTrigger id="new-ticket-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-400" />Low</div></SelectItem>
                  <SelectItem value="medium"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500" />Medium</div></SelectItem>
                  <SelectItem value="high"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" />High</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-ticket-assign">Assign To</Label>
              <Select value={newTicket.assignTo} onValueChange={(value) => setNewTicket({ ...newTicket, assignTo: value })}>
                <SelectTrigger id="new-ticket-assign"><SelectValue placeholder="Select agent (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned"><div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />Unassigned</div></SelectItem>
                  {projectAgents.map((agent: any) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5"><AvatarFallback className="text-xs">{agent.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
                        {agent.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {newTicket.aiAutoFill && newTicket.description && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-900">
                <Bot className="h-4 w-4" />
                AI Suggestions
              </div>
              <div className="space-y-2 text-sm text-purple-800">
                <div className="flex items-start gap-2"><Tag className="h-4 w-4 mt-0.5 flex-shrink-0" /><div><span className="font-medium">Suggested Category:</span> Technical Support</div></div>
                <div className="flex items-start gap-2"><Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" /><div><span className="font-medium">Similar Tickets:</span> 3 related tickets found</div></div>
                <div className="flex items-start gap-2"><FileText className="h-4 w-4 mt-0.5 flex-shrink-0" /><div><span className="font-medium">Knowledge Base:</span> 2 relevant articles available</div></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => { onOpenChange(false); resetTicket(); }}>Cancel</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { onOpenChange(false); resetTicket(); }} disabled={!newTicket.subject || !newTicket.description || !newTicket.customerId}>
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Project Dialog ---
interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
}

export function EditProjectDialog({ open, onOpenChange, project }: EditProjectDialogProps) {
  const [editedProject, setEditedProject] = useState({
    name: project?.name || '',
    description: project?.description || '',
    website: project?.website || '',
    color: project?.color || '#3B82F6'
  });

  // Sync when project changes
  const handleOpen = (isOpen: boolean) => {
    if (isOpen && project) {
      setEditedProject({
        name: project.name || '',
        description: project.description || '',
        website: project.website || '',
        color: project.color || '#3B82F6'
      });
    }
    onOpenChange(isOpen);
  };

  const handleEditProject = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update your project details and settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-project-name">Project Name</Label>
            <Input id="edit-project-name" placeholder="Enter project name" value={editedProject.name} onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-description">Description</Label>
            <Textarea id="edit-project-description" placeholder="Describe your project..." rows={3} value={editedProject.description} onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-website">Website URL</Label>
            <Input id="edit-project-website" type="url" placeholder="https://www.example.com" value={editedProject.website || ''} onChange={(e) => setEditedProject({ ...editedProject, website: e.target.value })} />
            <p className="text-xs text-gray-500">The website associated with this project</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-color">Project Color</Label>
            <div className="flex items-center gap-3">
              <Input id="edit-project-color" type="color" value={editedProject.color} onChange={(e) => setEditedProject({ ...editedProject, color: e.target.value })} className="w-20 h-10" />
              <div className="flex gap-2">
                {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map((color) => (
                  <button key={color} className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform" style={{ backgroundColor: color }} onClick={() => setEditedProject({ ...editedProject, color })} />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-3 p-4 rounded-lg border" style={{ backgroundColor: editedProject.color + '10', borderColor: editedProject.color }}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: editedProject.color }}>
                {editedProject.name ? editedProject.name.substring(0, 2).toUpperCase() : 'NP'}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{editedProject.name || 'Project Name'}</p>
                <p className="text-sm text-gray-600">{editedProject.description || 'Project description will appear here'}</p>
                {editedProject.website && <p className="text-xs text-blue-600 mt-1">{editedProject.website}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleEditProject}>
            <Edit className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
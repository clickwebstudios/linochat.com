import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Ticket,
  Plus,
  Tag,
  FileText,
  Sparkles,
  Bot,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { useProjectsStore, selectProjects, selectProjectsLoading } from '../stores/projectsStore';
import { TICKET_CATEGORIES } from '../lib/constants';
import { toast } from 'sonner';

interface NewTicket {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  assignTo: string;
  projectId: string;
  customerEmail: string;
  customerName: string;
  aiAutoFill: boolean;
}

const INITIAL_TICKET: NewTicket = {
  subject: '',
  description: '',
  priority: 'medium',
  category: '',
  assignTo: '',
  projectId: '',
  customerEmail: '',
  customerName: '',
  aiAutoFill: false,
};

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMember[];
  onTicketCreated?: (ticket: { id: string } & Partial<NewTicket>) => void;
}

interface ValidationErrors {
  subject?: string;
  description?: string;
  customerEmail?: string;
  projectId?: string;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  teamMembers,
  onTicketCreated,
}: CreateTicketDialogProps) {
  const [newTicket, setNewTicket] = useState<NewTicket>(INITIAL_TICKET);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use projects store
  const projects = useProjectsStore(selectProjects);
  const projectsLoading = useProjectsStore(selectProjectsLoading);
  const fetchProjects = useProjectsStore(state => state.fetchProjects);

  // Load projects when dialog opens
  useEffect(() => {
    if (open) {
      fetchProjects();
      setErrors({});
    }
  }, [open, fetchProjects]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!newTicket.subject.trim()) newErrors.subject = 'Subject is required';
    if (!newTicket.description.trim()) newErrors.description = 'Description is required';
    if (!newTicket.customerEmail.trim()) newErrors.customerEmail = 'Customer email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTicket.customerEmail)) {
      newErrors.customerEmail = 'Valid email is required';
    }
    if (!newTicket.projectId) newErrors.projectId = 'Project is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post<{ success: boolean; data: { id: string } }>('/agent/tickets', {
        project_id: newTicket.projectId,
        customer_email: newTicket.customerEmail.trim(),
        customer_name: newTicket.customerName.trim() || undefined,
        subject: newTicket.subject.trim(),
        description: newTicket.description.trim(),
        priority: newTicket.priority,
        category: newTicket.category || undefined,
        assigned_to: (newTicket.assignTo && newTicket.assignTo !== 'unassigned') ? newTicket.assignTo : undefined,
      });
      if (response.success) {
        onTicketCreated?.(response.data as any);
        toast.success('Ticket created successfully!');
        resetAndClose();
      } else {
        toast.error('Failed to create ticket');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setNewTicket(INITIAL_TICKET);
    setErrors({});
    onOpenChange(false);
  };

  const handleFieldChange = (field: keyof NewTicket, value: any) => {
    setNewTicket({ ...newTicket, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Create New Ticket
          </DialogTitle>
          <DialogDescription>
            Create a new support ticket. You can manually fill in the details or
            let AI auto-generate content based on the description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject *</Label>
            <Input
              id="ticket-subject"
              placeholder="Brief description of the issue"
              value={newTicket.subject}
              onChange={(e) => handleFieldChange('subject', e.target.value)}
              className={errors.subject ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.subject && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.subject}
              </p>
            )}
          </div>

          {/* Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-customer-email">Customer Email *</Label>
              <Input
                id="ticket-customer-email"
                type="email"
                placeholder="customer@example.com"
                value={newTicket.customerEmail}
                onChange={(e) => handleFieldChange('customerEmail', e.target.value)}
                className={errors.customerEmail ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.customerEmail && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.customerEmail}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-customer-name">Customer Name</Label>
              <Input
                id="ticket-customer-name"
                placeholder="John Doe"
                value={newTicket.customerName}
                onChange={(e) => handleFieldChange('customerName', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ticket-description">Description *</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="ai-autofill"
                  checked={newTicket.aiAutoFill}
                  onCheckedChange={(checked) =>
                    handleFieldChange('aiAutoFill', checked)
                  }
                />
                <Label
                  htmlFor="ai-autofill"
                  className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
                >
                  <Bot className="h-3.5 w-3.5 text-secondary" />
                  AI Auto-fill
                </Label>
              </div>
            </div>
            <Textarea
              id="ticket-description"
              placeholder="Detailed description of the issue..."
              value={newTicket.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={5}
              className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.description}
              </p>
            )}
            {newTicket.aiAutoFill && (
              <p className="text-xs text-secondary flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI will automatically categorize and suggest solutions based on
                this description
              </p>
            )}
          </div>

          {/* Priority and Project Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Priority *</Label>
              <Select
                value={newTicket.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') =>
                  handleFieldChange('priority', value)
                }
              >
                <SelectTrigger id="ticket-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      High
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
            <div className="space-y-2">
              <Label htmlFor="ticket-project">Project *</Label>
              <Select
                value={newTicket.projectId}
                onValueChange={(value) =>
                  handleFieldChange('projectId', value)
                }
              >
                <SelectTrigger id="ticket-project" className={errors.projectId ? 'border-red-500 focus:ring-red-500' : ''}>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading projects...
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No projects found</div>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: project.color || '#4F46E5' }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.projectId}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="ticket-category">Category</Label>
            <Select
              value={newTicket.category || undefined}
              onValueChange={(value) => handleFieldChange('category', value)}
            >
              <SelectTrigger id="ticket-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {TICKET_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assign To */}
          <div className="space-y-2">
            <Label htmlFor="ticket-assign">Assign To</Label>
            <Select
              value={newTicket.assignTo}
              onValueChange={(value) =>
                handleFieldChange('assignTo', value)
              }
            >
              <SelectTrigger id="ticket-assign">
                <SelectValue placeholder="Select agent (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Unassigned
                  </div>
                </SelectItem>
                {teamMembers
                  .filter(
                    (member) =>
                      member.role === 'agent' || member.role === 'admin' ||
                      member.role === 'Agent' || member.role === 'Admin'
                  )
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Suggestion Preview (when AI is enabled) */}
          {newTicket.aiAutoFill && newTicket.description && (
            <div className="rounded-lg border border-secondary/20 bg-secondary/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                <Bot className="h-4 w-4" />
                AI Suggestions
              </div>
              <div className="space-y-2 text-sm text-secondary/80">
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Suggested Category:</span>{' '}
                    Technical Support
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Similar Tickets:</span> 3
                    related tickets found
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Knowledge Base:</span> 2
                    relevant articles available
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

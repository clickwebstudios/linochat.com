import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Star,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  Bell,
  LogOut,
  Search,
  Menu,
  ChevronDown,
  Paperclip,
  UserPlus,
  AlertTriangle,
  Ticket,
  Tag,
  User,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { mockProjects } from '../../data/mockData';
import { useLayout } from '../../components/layouts/LayoutContext';
import { api } from '../../api/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function TicketDetails() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleMobileSidebar } = useLayout();

  const pathSegments = location.pathname.split('/');
  const basePath = `/${pathSegments[1]}`;
  const isSuperadmin = basePath === '/superadmin';

  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [ticket, setTicket] = useState<{
    id: string | number;
    subject?: string;
    description?: string;
    priority?: string;
    category?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    service_address?: string;
    ticket_number?: string;
    project?: { id: string; name: string; companyId?: string; color?: string };
    project_id?: string;
    assigned_to?: string | number;
    assigned_agent?: { first_name?: string; last_name?: string; email?: string };
    messages?: Array<{ id: string; sender_type: string; content: string; created_at?: string }>;
  } | null>(null);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAssignId, setSelectedAssignId] = useState<string>('');
  const [customerTickets, setCustomerTickets] = useState<Array<{ id: number; subject: string; status: string; created_at: string }>>([]);
  const [editForm, setEditForm] = useState({ subject: '', description: '', priority: 'medium', category: '' });
  const [escalateTo, setEscalateTo] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);
  const [isCreatingFrubixLead, setIsCreatingFrubixLead] = useState(false);
  const [frubixLeadCreated, setFrubixLeadCreated] = useState(false);
  const [frubixLeadUrl, setFrubixLeadUrl] = useState<string | null>(null);

  const loadTicket = async () => {
    if (!ticketId) return;
    setTicketLoading(true);
    try {
      const data = await api.get<any>(`/agent/tickets/${ticketId}`);
      if (data.success) setTicket(data.data);
    } catch (error) {
      console.error('Failed to load ticket:', error);
    } finally {
      setTicketLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadCustomerTickets = async () => {
    if (!ticket?.customer_email) return;
    try {
      const res = await api.get<any>(`/agent/tickets?customer_email=${encodeURIComponent(ticket.customer_email)}&per_page=50`);
      const list = res.success && res.data ? (res.data.data ?? res.data) : [];
      setCustomerTickets(Array.isArray(list) ? list : []);
    } catch {
      setCustomerTickets([]);
    }
  };

  useEffect(() => {
    if (ticket?.customer_email) loadCustomerTickets();
  }, [ticket?.customer_email]);

  const project = ticket ? (ticket.project || mockProjects.find((p: any) => p.id === ticket.project_id)) : null;
  const assignedAgentName = ticket?.assigned_agent
    ? `${ticket.assigned_agent.first_name || ''} ${ticket.assigned_agent.last_name || ''}`.trim() || ticket.assigned_agent.email
    : 'Unassigned';

  // Build conversation from API messages, or fallback to description
  const ticketMessages = ticket?.messages;
  const conversationHistory = ticket
    ? (ticketMessages?.length
        ? ticketMessages.map((m: any) => ({
            id: m.id,
            sender: m.sender_type === 'agent' ? 'agent' as const : 'customer' as const,
            name: m.sender_type === 'agent' ? assignedAgentName : (ticket.customer_name || 'Customer'),
            avatar: String(m.sender_type === 'agent' ? assignedAgentName : (ticket!.customer_name ?? 'C'))
              .substring(0, 2)
              .toUpperCase(),
            message: m.content,
            time: m.created_at ? new Date(m.created_at).toLocaleString() : '',
            isSystemMessage: false,
          }))
        : [
            {
              id: 1,
              sender: 'customer' as const,
              name: ticket.customer_name || 'Customer',
              avatar: (ticket.customer_name || 'C').substring(0, 2).toUpperCase(),
              message: ticket.description || 'No description provided.',
              time: ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '',
              isSystemMessage: false,
            },
          ])
    : [];

  const activityTimeline = ticket
    ? [
        {
          time: ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '',
          action: 'Ticket created',
          user: ticket.customer_name || 'Customer',
          icon: Ticket,
          color: 'text-primary',
        },
        ...(ticket.assigned_agent
          ? [{
              time: ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : '',
              action: 'Assigned to',
              user: assignedAgentName,
              icon: UserPlus,
              color: 'text-secondary',
            }]
          : []),
        {
          time: ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : '',
          action: 'Status',
          user: ticket.status,
          icon: AlertCircle,
          color: 'text-orange-600',
        },
      ]
    : [];

  const customerInfo = ticket
    ? {
        name: ticket.customer_name || ticket.customer_email || 'Customer',
        email: ticket.customer_email || '',
        phone: ticket.customer_phone || '—',
        location: ticket.service_address || '—',
        totalTickets: 0,
        openTickets: 0,
        satisfaction: 0,
      }
    : { name: '', email: '', phone: '', location: '', totalTickets: 0, openTickets: 0, satisfaction: 0 };

  const handleEditSubmit = async () => {
    if (!ticketId || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await api.put<any>(`/agent/tickets/${ticketId}`, {
        subject: editForm.subject,
        description: editForm.description,
        priority: editForm.priority,
        category: editForm.category || undefined,
      });
      if (res.success && res.data) setTicket(res.data);
      setEditDialogOpen(false);
      toast.success('Ticket updated');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update ticket');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendResponse = async () => {
    if (!responseMessage.trim() || !ticketId || isSendingReply) return;
    setIsSendingReply(true);
    try {
      await api.post(`/agent/tickets/${ticketId}/reply`, { message: responseMessage.trim() });
      setResponseMessage('');
      loadTicket();
      toast.success('Reply sent');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleResolve = async () => {
    if (!ticketId || isResolving) return;
    setIsResolving(true);
    try {
      await api.post(`/agent/tickets/${ticketId}/status`, { status: 'resolved' });
      setCloseDialogOpen(false);
      setResolutionNotes('');
      loadTicket();
      toast.success('Ticket resolved');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to resolve ticket');
    } finally {
      setIsResolving(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Array<{ id: string; first_name: string; last_name: string; email: string }> }>('/agent/users');
      if (res.success && Array.isArray(res.data)) {
        // Only include actual users (not pending invitations) for reassignment
        const users = res.data.filter((u: any) => !String(u.id).startsWith('invitation-'));
        setTeamMembers(users.map((u: any) => ({
          id: String(u.id),
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        })));
      }
    } catch {
      setTeamMembers([]);
    }
  };

  const handleEscalate = async () => {
    if (!ticketId || !escalateTo || isEscalating) return;
    setIsEscalating(true);
    try {
      const res = await api.post<any>(`/agent/tickets/${ticketId}/escalate`, {
        escalate_to: escalateTo,
        reason: escalateReason.trim() || undefined,
      });
      if (res.success && res.data) setTicket(res.data);
      setEscalateDialogOpen(false);
      setEscalateTo('');
      setEscalateReason('');
      loadTicket();
      toast.success('Ticket escalated');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to escalate');
    } finally {
      setIsEscalating(false);
    }
  };

  const handleReassign = async () => {
    if (!ticketId || isReassigning) return;
    setIsReassigning(true);
    try {
      await api.post(`/agent/tickets/${ticketId}/assign`, {
        agent_id: selectedAssignId || null,
      });
      setReassignDialogOpen(false);
      setSelectedAssignId('');
      loadTicket();
      toast.success(selectedAssignId ? 'Ticket reassigned' : 'Ticket unassigned');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reassign');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleDelete = async () => {
    if (!ticketId || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/agent/tickets/${ticketId}`);
      setDeleteDialogOpen(false);
      toast.success('Ticket deleted');
      navigate(`${basePath}/tickets`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete ticket');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFrubixLead = async () => {
    if (!ticketId || isCreatingFrubixLead || frubixLeadCreated) return;
    setIsCreatingFrubixLead(true);
    try {
      const res = await api.post<any>(`/agent/tickets/${ticketId}/frubix-lead`, {});
      setFrubixLeadCreated(true);
      const leadUrl = res?.data?.frubix_lead_url;
      if (leadUrl) setFrubixLeadUrl(leadUrl);
      toast.success('Lead created in Frubix!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create Frubix lead');
    } finally {
      setIsCreatingFrubixLead(false);
    }
  };

  if (ticketLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-muted-foreground mb-2">Ticket not found</h2>
        <Button variant="outline" onClick={() => navigate(`${basePath}/tickets`)}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileSidebar}
          >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative w-96 hidden md:block">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tickets, chats, customers..." className="pl-10" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
            </Button>
            <Button className="bg-primary hover:bg-primary/90 hidden md:inline-flex">
              + New Ticket
            </Button>
            {/* Agent Info */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l">
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">SC</AvatarFallback>
                </Avatar>
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
              </div>
              <div>
                <div className="text-sm font-semibold">Sarah Chen</div>
                <div className="text-xs text-muted-foreground">Admin</div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/agent/profile-settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
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
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => {
                if (isSuperadmin && project?.companyId) {
                  navigate('/superadmin/companies', {
                    state: { viewingCompanyId: project.companyId, companyDetailTab: 'tickets' },
                  });
                  return;
                }
                navigate(`${basePath}/tickets`);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isSuperadmin ? 'Back to Company Tickets' : 'Back to Tickets'}
            </Button>

            <div className="flex gap-2">
              {(ticket.status !== 'resolved' && ticket.status !== 'closed') && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setCloseDialogOpen(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve Ticket
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setReassignDialogOpen(true);
                  loadTeamMembers();
                  setSelectedAssignId(ticket.assigned_to ? String(ticket.assigned_to) : '');
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Reassign
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setEditForm({
                      subject: ticket.subject || '',
                      description: ticket.description || '',
                      priority: ticket.priority || 'medium',
                      category: ticket.category || '',
                    });
                    setEditDialogOpen(true);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  {(ticket.status !== 'resolved' && ticket.status !== 'closed') && (
                    <DropdownMenuItem onClick={() => {
                      setEscalateTo('');
                      setEscalateReason('');
                      loadTeamMembers();
                      setEscalateDialogOpen(true);
                    }}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Escalate Ticket
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleCreateFrubixLead}
                    disabled={isCreatingFrubixLead || frubixLeadCreated}
                  >
                    {isCreatingFrubixLead ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    {frubixLeadCreated ? 'Lead Created in Frubix' : 'Create Frubix Lead'}
                  </DropdownMenuItem>
                  {frubixLeadUrl && (
                    <DropdownMenuItem asChild>
                      <a href={frubixLeadUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Lead in Frubix
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-red-600" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Ticket
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Ticket Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-3xl font-bold">{ticket.subject}</h1>
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      <Badge variant={ticket.status === 'open' ? 'default' : ticket.status === 'pending' ? 'secondary' : 'outline'}>
                        {ticket.status}
                      </Badge>
                      <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'secondary'}>
                        {ticket.priority} priority
                      </Badge>
                      {project && (
                        <div 
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-white"
                          style={{ backgroundColor: project.color }}
                        >
                          <div className="w-2 h-2 rounded-full bg-white/80"></div>
                          {project.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created: {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last update: {ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Assigned to: {assignedAgentName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Category: {ticket.category || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground font-mono">{ticket.ticket_number || `#${ticket.id}`}</span>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Customer Profile */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {(customerInfo.name?.split(' ').map((n: string) => n[0]).join('') || '?').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{customerInfo.name}</p>
                        </div>
                      </div>

                      {/* Contact Details */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{customerInfo.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{customerInfo.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{customerInfo.location}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-6 text-sm flex-shrink-0">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs mb-1">Total Tickets</p>
                          <p className="font-semibold text-lg">{customerInfo.totalTickets}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs mb-1">Open Tickets</p>
                          <p className="font-semibold text-lg">{customerInfo.openTickets}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs mb-1">Satisfaction</p>
                          <div className="flex items-center gap-1 justify-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-lg">{customerInfo.satisfaction}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="conversation" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <User className="h-4 w-4" />
                    Customer Tickets
                    <Badge variant="secondary" className="ml-1">{customerTickets.length}</Badge>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80 max-h-80 overflow-y-auto">
                  <div className="px-2 py-1.5 text-sm font-semibold border-b sticky top-0 bg-card z-10">
                    {customerInfo.name}'s Tickets
                    <span className="text-xs text-muted-foreground font-normal ml-2">
                      {customerTickets.length} total, {customerTickets.filter((t) => t.status === 'open' || t.status === 'pending').length} open
                    </span>
                  </div>
                  {customerTickets.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground">No other tickets for this customer</div>
                  ) : (
                    customerTickets.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        className="flex items-start gap-2 py-2"
                        onClick={() => navigate(`${basePath}/tickets/${t.id}`)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{t.subject || 'No subject'}</div>
                          <div className="text-xs text-muted-foreground">
                            #{t.id} • {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                          </div>
                        </div>
                        <Badge variant={t.status === 'open' || t.status === 'pending' ? 'default' : 'outline'}>
                          {t.status}
                        </Badge>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <TabsList>
                <TabsTrigger value="conversation">Conversation</TabsTrigger>
                <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
              </TabsList>
            </div>

          {/* Conversation Tab */}
          <TabsContent value="conversation" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4 mb-6">
                  {conversationHistory.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.sender === 'agent' ? 'flex-row-reverse' : ''}`}>
                      <Avatar className={`h-10 w-10 ${message.isSystemMessage ? 'bg-muted' : ''}`}>
                        <AvatarFallback className={message.sender === 'agent' ? 'bg-primary text-primary-foreground' : message.isSystemMessage ? 'bg-muted-foreground text-white' : 'bg-muted'}>
                          {message.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${message.sender === 'agent' ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{message.name}</span>
                          <span className="text-xs text-muted-foreground">{message.time}</span>
                        </div>
                        <div className={`rounded-lg p-3 ${
                          message.sender === 'agent' ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]' :
                          message.isSystemMessage ? 'bg-yellow-50 border border-yellow-200 text-foreground italic' :
                          'bg-muted text-foreground max-w-[80%]'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Response Area */}
                <div className="border-t pt-4">
                  <Label className="mb-2 block">Your Response</Label>
                  <Textarea 
                    placeholder="Type your response to the customer..." 
                    rows={4}
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach File
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Save Draft
                      </Button>
                      <Button
                        className="bg-primary hover:bg-primary/90"
                        size="sm"
                        onClick={handleSendResponse}
                        disabled={isSendingReply || !responseMessage.trim() || ticket.status === 'resolved' || ticket.status === 'closed'}
                      >
                        {isSendingReply ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Send Response
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Timeline Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityTimeline.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                        <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {activity.action} {activity.user && <span className="text-primary">{activity.user}</span>}
                            {(activity as any).status && <Badge variant="outline" className="ml-2">{(activity as any).status}</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </main>

      {/* Escalate Dialog */}
      <Dialog open={escalateDialogOpen} onOpenChange={(open) => {
        setEscalateDialogOpen(open);
        if (!open) { setEscalateTo(''); setEscalateReason(''); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Ticket</DialogTitle>
            <DialogDescription>
              Escalate this ticket to a senior agent or manager for additional support.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="escalate-to">Escalate To</Label>
              <Select value={escalateTo} onValueChange={setEscalateTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Escalation (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this ticket needs escalation..."
                rows={3}
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialogOpen(false)} disabled={isEscalating}>Cancel</Button>
            <Button onClick={handleEscalate} disabled={!escalateTo || isEscalating}>
              {isEscalating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              Escalate Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Ticket Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={(open) => { setCloseDialogOpen(open); if (!open) setResolutionNotes(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
            <DialogDescription>
              Mark this ticket as resolved. The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Notes (optional)</Label>
              <Textarea
                id="resolution"
                placeholder="Describe how the issue was resolved..."
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)} disabled={isResolving}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleResolve} disabled={isResolving}>
              {isResolving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Resolve Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={(open) => { setReassignDialogOpen(open); if (!open) setSelectedAssignId(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Ticket</DialogTitle>
            <DialogDescription>Assign this ticket to another agent or leave unassigned.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={selectedAssignId} onValueChange={setSelectedAssignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent (or leave unassigned)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialogOpen(false)} disabled={isReassigning}>Cancel</Button>
            <Button onClick={handleReassign} disabled={isReassigning}>
              {isReassigning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Details Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ticket Details</DialogTitle>
            <DialogDescription>Update subject, description, priority, and category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Ticket subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ticket description"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Technical Support"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isUpdating}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this ticket?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
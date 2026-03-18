import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Edit,
  Trash2,
  Ticket,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';

interface TicketsTabProps {
  basePath: string;
  onCreateTicketClick: () => void;
  projectId: string;
}

interface TicketItem {
  id: string;
  subject: string;
  customer_name: string;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  created_at: string;
}

export function TicketsTab({ basePath, onCreateTicketClick, projectId }: TicketsTabProps) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await api.get<TicketItem[] | { data: TicketItem[] }>(`/projects/${projectId}/tickets`);
        if (response.success) {
          const d = response.data as any;
          const ticketsData: TicketItem[] = d?.data || d || [];
          setTickets(ticketsData);
        }
      } catch (error) {
        console.error('Failed to load tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      loadTickets();
    }
  }, [projectId]);

  const filteredTickets = tickets.filter((ticket) =>
    ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Optimistic status update — update local state immediately, rollback on error
  const updateTicketStatus = useCallback(async (ticketId: string, newStatus: TicketItem['status']) => {
    const prev = tickets;
    setTickets(t => t.map(tk => tk.id === ticketId ? { ...tk, status: newStatus } : tk));
    try {
      await api.put(`/projects/${projectId}/tickets/${ticketId}`, { status: newStatus });
    } catch {
      setTickets(prev);
      toast.error('Failed to update ticket status');
    }
  }, [tickets, projectId]);

  const deleteTicket = useCallback(async (ticketId: string) => {
    const prev = tickets;
    setTickets(t => t.filter(tk => tk.id !== ticketId));
    try {
      await api.delete(`/projects/${projectId}/tickets/${ticketId}`);
      toast.success('Ticket deleted');
    } catch {
      setTickets(prev);
      toast.error('Failed to delete ticket');
    }
  }, [tickets, projectId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default">Open</Badge>;
      case 'pending':
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'closed':
      case 'resolved':
        return <Badge variant="outline">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return <Badge variant="destructive">{priority.charAt(0).toUpperCase() + priority.slice(1)}</Badge>;
      case 'medium':
        return <Badge variant="default">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Tickets</CardTitle>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Search tickets..." 
              className="w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="bg-primary hover:bg-primary/90" onClick={onCreateTicketClick}>
              <Ticket className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No tickets yet</h3>
              <p className="text-muted-foreground mb-6">Create your first ticket to get started</p>
              <Button className="bg-primary hover:bg-primary/90" onClick={onCreateTicketClick}>
                <Ticket className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id} 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => navigate(`${basePath}/tickets/${ticket.id}`)}
                  >
                    <TableCell className="font-medium">TICK-{ticket.id}</TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>{ticket.customer_name || 'Unknown'}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{ticket.assigned_to || 'Unassigned'}</TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/tickets/${ticket.id}`); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {ticket.status !== 'closed' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.id, 'closed'); }}>
                              Close Ticket
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => { e.stopPropagation(); deleteTicket(ticket.id); }}
                          >
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
    </div>
  );
}
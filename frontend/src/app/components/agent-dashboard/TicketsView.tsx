import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Ticket,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Send,
} from 'lucide-react';

interface TicketsViewProps {
  filteredTickets: any[];
  allTickets: any[];
  ticketFilter: 'all' | 'open' | 'pending' | 'closed';
  setTicketFilter: (filter: 'all' | 'open' | 'pending' | 'closed') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getProjectById: (id: string) => any;
  basePath: string;
  onCreateTicketClick: () => void;
}

function formatTicketDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHr = Math.floor(diffMs / 3600000);
  if (diffHr < 24) return diffHr < 1 ? 'Just now' : `${diffHr} hr ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function TicketsView({
  filteredTickets,
  allTickets,
  ticketFilter,
  setTicketFilter,
  searchQuery,
  setSearchQuery,
  getProjectById,
  basePath,
  onCreateTicketClick,
}: TicketsViewProps) {
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Calculate counts from real data
  const totalCount = allTickets?.length || 0;
  const openCount = allTickets?.filter((t) => t.status === 'open').length || 0;
  const pendingCount = allTickets?.filter((t) => t.status === 'pending').length || 0;
  const resolvedCount = allTickets?.filter((t) => t.status === 'closed' || t.status === 'resolved').length || 0;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTicketFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">All Tickets</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <Ticket className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTicketFilter('open')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-primary">{openCount}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTicketFilter('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTicketFilter('closed')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>
              {ticketFilter === 'all' ? 'All Tickets' : `${ticketFilter.charAt(0).toUpperCase() + ticketFilter.slice(1)} Tickets`}
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tickets..." 
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={onCreateTicketClick}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setSelectedTicket(null)}>
                  ← Back to list
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Escalate</Button>
                  <Button variant="outline" size="sm">Transfer</Button>
                  <Button className="bg-green-600 hover:bg-green-700" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </Button>
                </div>
              </div>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{selectedTicket.subject}</h3>
                        <Badge variant={selectedTicket.status === 'open' ? 'default' : 'secondary'}>
                          {selectedTicket.status}
                        </Badge>
                        <Badge
                          variant={
                            selectedTicket.priority === 'high' ? 'destructive' :
                            selectedTicket.priority === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono">{selectedTicket.id}</span>
                        <span>•</span>
                        <span>Customer: {selectedTicket.customer_name || selectedTicket.customer_email || '—'}</span>
                        <span>•</span>
                        <span>Created: {formatTicketDate(selectedTicket.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      The customer is experiencing issues accessing their dashboard. They've tried multiple browsers and cleared cache but the problem persists.
                    </p>
                  </div>
                  <div>
                    <Label>Response</Label>
                    <Textarea 
                      placeholder="Type your response to the customer..." 
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Save Draft</Button>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => {
                    const project = getProjectById(String(ticket.project_id)) || ticket.project;
                    const customerDisplay = ticket.customer_name || (ticket.customer_email ? ticket.customer_email.split('@')[0] : '—');
                    return (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`${basePath}/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-mono">{ticket.id}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>{customerDisplay}</TableCell>
                      <TableCell>
                        {(project?.name) && (
                          <div
                            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-white w-fit"
                            style={{ backgroundColor: project.color || '#3b82f6' }}
                          >
                            <div className="w-2 h-2 rounded-full bg-white/80"></div>
                            {project.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ticket.priority === 'high' ? 'destructive' :
                            ticket.priority === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTicketDate(ticket.updated_at)}</TableCell>
                    </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No tickets found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

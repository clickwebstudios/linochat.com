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
  Tag,
  History,
  UserPlus,
  Share2,
  Bookmark,
  AlertTriangle,
  XCircle,
  Ticket,
  User,
  FileText,
} from 'lucide-react';
import { mockProjects } from '../../data/mockData';
import { Sheet, SheetContent } from '../../components/ui/sheet';
import { AdminSidebar } from '../../components/AdminSidebar';
import { useLayout } from '../../components/layouts/LayoutContext';

export default function TicketDetails() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleMobileSidebar } = useLayout();

  // Derive basePath from URL for back navigation
  const pathSegments = location.pathname.split('/');
  const basePath = `/${pathSegments[1]}`; // /agent, /admin, or /superadmin
  const isSuperadmin = basePath === '/superadmin';

  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [ticket, setTicket] = useState<any>(null);
  const [ticketLoading, setTicketLoading] = useState(true);

  // Fetch real ticket data from API
  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) return;
      
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setTicketLoading(false);
          return;
        }
        
        const response = await fetch(`/api/agent/tickets/${ticketId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error('Ticket API error:', response.status);
          setTicketLoading(false);
          return;
        }
        
        const data = await response.json();
        if (data.success) {
          setTicket(data.data);
        }
      } catch (error) {
        console.error('Failed to load ticket:', error);
      } finally {
        setTicketLoading(false);
      }
    };
    
    loadTicket();
  }, [ticketId]);

  const project = ticket ? mockProjects.find(p => p.id === ticket.project_id) : null;

  // Use real ticket messages if available, otherwise empty
  const conversationHistory = ticket ? [
    {
      id: 1,
      sender: 'customer' as const,
      name: ticket.customer_name,
      avatar: ticket.customer_name?.substring(0, 2).toUpperCase() || '??',
      message: ticket.description || 'No description provided.',
      time: new Date(ticket.created_at).toLocaleString(),
      attachments: [],
    },
    {
      id: 5,
      sender: 'internal' as const,
      name: 'System',
      avatar: 'SYS',
      message: `Account security lock removed. Password reset link sent to customer's email.`,
      time: '55 min ago',
      attachments: [],
      isSystemMessage: true,
    },
  ] : [];

  // Mock activity timeline
  const activityTimeline = [
    { time: ticket.created, action: 'Ticket created', user: ticket.customer, icon: Ticket, color: 'text-blue-600' },
    { time: '2 hours ago', action: 'Assigned to', user: ticket.assignedTo, icon: UserPlus, color: 'text-purple-600' },
    { time: '1 hour ago', action: 'Status changed to', user: ticket.assignedTo, status: ticket.status, icon: AlertCircle, color: 'text-orange-600' },
    { time: '55 min ago', action: 'Internal note added', user: ticket.assignedTo, icon: FileText, color: 'text-gray-600' },
    { time: ticket.lastUpdate, action: 'Last update', user: ticket.assignedTo, icon: History, color: 'text-gray-600' },
  ];

  // Mock customer info
  const customerInfo = {
    name: ticket.customer,
    email: `${ticket.customer.toLowerCase().replace(' ', '.')}@example.com`,
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    customerSince: 'Jan 2023',
    totalTickets: 12,
    openTickets: 2,
    satisfaction: 4.5,
  };

  const handleSendResponse = () => {
    if (responseMessage.trim()) {
      // Handle sending response
      console.log('Sending response:', responseMessage);
      setResponseMessage('');
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
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
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search tickets, chats, customers..." className="pl-10" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 hidden md:inline-flex">
              + New Ticket
            </Button>
            {/* Agent Info */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l">
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-blue-600 text-white">SC</AvatarFallback>
                </Avatar>
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
              </div>
              <div>
                <div className="text-sm font-semibold">Sarah Chen</div>
                <div className="text-xs text-gray-500">Admin</div>
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
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setCloseDialogOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve Ticket
              </Button>
              <Button variant="outline">
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
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
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
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Created: {ticket.created}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Last update: {ticket.lastUpdate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Assigned to: {ticket.assignedTo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Category: Technical Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 font-mono">{ticket.id}</span>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Customer Profile */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {customerInfo.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{customerInfo.name}</p>
                        </div>
                      </div>

                      {/* Contact Details */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{customerInfo.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{customerInfo.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{customerInfo.location}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-6 text-sm flex-shrink-0">
                        <div className="text-center">
                          <p className="text-gray-600 text-xs mb-1">Total Tickets</p>
                          <p className="font-semibold text-lg">{customerInfo.totalTickets}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600 text-xs mb-1">Open Tickets</p>
                          <p className="font-semibold text-lg">{customerInfo.openTickets}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600 text-xs mb-1">Satisfaction</p>
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
                    <Badge variant="secondary" className="ml-1">12</Badge>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80 max-h-80 overflow-y-auto">
                  <div className="px-2 py-1.5 text-sm font-semibold border-b sticky top-0 bg-white z-10">
                    {customerInfo.name}'s Tickets
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      12 total, 2 open
                    </span>
                  </div>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-1001`)}>
                    <div className="flex-1">
                      <div className="font-medium">Login issues with dashboard</div>
                      <div className="text-xs text-gray-500">TICK-1001 • 2 days ago</div>
                    </div>
                    <Badge variant="default">Open</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0989`)}>
                    <div className="flex-1">
                      <div className="font-medium">Password reset not working</div>
                      <div className="text-xs text-gray-500">TICK-0989 • 1 week ago</div>
                    </div>
                    <Badge variant="default">Open</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0965`)}>
                    <div className="flex-1">
                      <div className="font-medium">Account billing inquiry</div>
                      <div className="text-xs text-gray-500">TICK-0965 • 2 weeks ago</div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0943`)}>
                    <div className="flex-1">
                      <div className="font-medium">Feature request - Dark mode</div>
                      <div className="text-xs text-gray-500">TICK-0943 • 3 weeks ago</div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0912`)}>
                    <div className="flex-1">
                      <div className="font-medium">Integration setup help</div>
                      <div className="text-xs text-gray-500">TICK-0912 • 1 month ago</div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0901`)}>
                    <div className="flex-1">
                      <div className="font-medium">API rate limit exceeded</div>
                      <div className="text-xs text-gray-500">TICK-0901 • 1 month ago</div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0887`)}>
                    <div className="flex-1">
                      <div className="font-medium">Email notifications not sending</div>
                      <div className="text-xs text-gray-500">TICK-0887 • 2 months ago</div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0872`)}>
                    <div className="flex-1">
                      <div className="font-medium">Profile picture upload failed</div>
                      <div className="text-xs text-gray-500">TICK-0872 • 2 months ago</div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0856`)}>
                    <div className="flex-1">
                      <div className="font-medium">Mobile app crashes on startup</div>
                      <div className="text-xs text-gray-500">TICK-0856 • 3 months ago</div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0843`)}>
                    <div className="flex-1">
                      <div className="font-medium">Data export request</div>
                      <div className="text-xs text-gray-500">TICK-0843 • 3 months ago</div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0829`)}>
                    <div className="flex-1">
                      <div className="font-medium">Two-factor auth setup help</div>
                      <div className="text-xs text-gray-500">TICK-0829 • 4 months ago</div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2 py-2" onClick={() => navigate(`${basePath}/tickets/TICK-0815`)}>
                    <div className="flex-1">
                      <div className="font-medium">Account upgrade questions</div>
                      <div className="text-xs text-gray-500">TICK-0815 • 4 months ago</div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </DropdownMenuItem>
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
                      <Avatar className={`h-10 w-10 ${message.isSystemMessage ? 'bg-gray-200' : ''}`}>
                        <AvatarFallback className={message.sender === 'agent' ? 'bg-blue-600 text-white' : message.isSystemMessage ? 'bg-gray-400 text-white' : 'bg-gray-200'}>
                          {message.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${message.sender === 'agent' ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{message.name}</span>
                          <span className="text-xs text-gray-500">{message.time}</span>
                        </div>
                        <div className={`rounded-lg p-3 ${
                          message.sender === 'agent' ? 'bg-blue-600 text-white ml-auto max-w-[80%]' :
                          message.isSystemMessage ? 'bg-yellow-50 border border-yellow-200 text-gray-700 italic' :
                          'bg-gray-100 text-gray-900 max-w-[80%]'
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
                        className="bg-blue-600 hover:bg-blue-700" 
                        size="sm"
                        onClick={handleSendResponse}
                      >
                        <Send className="h-4 w-4 mr-2" />
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
                        <div className={`h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {activity.action} {activity.user && <span className="text-blue-600">{activity.user}</span>}
                            {activity.status && <Badge variant="outline" className="ml-2">{activity.status}</Badge>}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
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
      <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
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
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="senior1">Lisa Anderson (Senior Agent)</SelectItem>
                  <SelectItem value="manager1">Michael Brown (Manager)</SelectItem>
                  <SelectItem value="tech1">Technical Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Escalation</Label>
              <Textarea id="reason" placeholder="Explain why this ticket needs escalation..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setEscalateDialogOpen(false)}>Escalate Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Ticket Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
            <DialogDescription>
              Mark this ticket as resolved. The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Notes</Label>
              <Textarea id="resolution" placeholder="Describe how the issue was resolved..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="satisfaction">Customer Satisfaction</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Rate the interaction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ Excellent</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ Good</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ Fair</SelectItem>
                  <SelectItem value="2">⭐⭐ Poor</SelectItem>
                  <SelectItem value="1">⭐ Very Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setCloseDialogOpen(false)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
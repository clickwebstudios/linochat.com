import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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
  TrendingUp,
  TrendingDown,
  Star,
  MessageCircle,
  MoreVertical,
  Edit,
  UserX,
  Shield,
  Activity,
  Award,
  Target,
  Zap,
  ThumbsUp,
  MessageSquare,
  FileText,
  FolderOpen,
  Building2,
  Headphones,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';
import { SuperadminTopbar } from '../../components/superadmin/SuperadminTopbar';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Agent data interfaces
interface Company {
  id: string;
  name: string;
  email: string;
  plan: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  website?: string;
  status: string;
  active_tickets: number;
}

interface TicketData {
  id: number;
  ticket_id: string;
  subject: string;
  customer: string;
  customer_email?: string;
  status: string;
  priority: string;
  lastUpdate: string;
  created_at: string;
}

interface ActivityItem {
  time: string;
  action: string;
  details: string;
  icon: string;
  color: string;
}

interface AgentStats {
  total_tickets: number;
  tickets_resolved: number;
  active_tickets: number;
  total_chats: number;
  avg_response_time: string;
  rating: number;
  customer_satisfaction: number;
}

interface PerformanceData {
  month: string;
  tickets: number;
  satisfaction: number;
}

interface ResponseTimeData {
  day: string;
  time: number;
}

interface AgentData {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  status: string;
  avatar_url?: string;
  bio: string;
  join_date: string;
  last_active_at?: string;
  last_active: string;
  company: Company | null;
  projects: Project[];
  stats: AgentStats;
  tickets: TicketData[];
  performance_data: PerformanceData[];
  response_time_data: ResponseTimeData[];
  recent_activity: ActivityItem[];
}

// Icon mapping for activity feed
const iconMap: Record<string, React.ElementType> = {
  CheckCircle,
  MessageCircle,
  AlertCircle,
  FileText,
};

export default function SuperadminAgentDetails() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  
  // Data states
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent data
  useEffect(() => {
    if (!agentId) return;

    const fetchAgent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<{ data: AgentData }>(`/superadmin/agents/${agentId}`);
        if (response.success && response.data) {
          setAgent((response.data as unknown as { data: AgentData }).data);
        } else {
          setError(response.message || 'Failed to load agent');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [agentId]);

  const initials = agent
    ? `${agent.first_name[0]}${agent.last_name[0]}`.toUpperCase()
    : 'NA';

  // Loading state
  if (loading) {
    return (
      <>
        <SuperadminTopbar />
        <main className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading agent details...</p>
          </div>
        </main>
      </>
    );
  }

  // Error state
  if (error || !agent) {
    return (
      <>
        <SuperadminTopbar />
        <main className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Headphones className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Agent Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "The agent you're looking for doesn't exist."}</p>
            <Button onClick={() => navigate('/superadmin/team')}>Back to Team</Button>
          </div>
        </main>
      </>
    );
  }

  // Destructure agent data
  const {
    company,
    projects,
    stats,
    tickets,
    performance_data,
    response_time_data,
    recent_activity,
  } = agent;

  return (
    <>
      {/* Top Bar */}
      <SuperadminTopbar />

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 pt-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/superadmin/team')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>

        {/* Agent Header Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-blue-600 text-white text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold">{agent.name}</h1>
                      <Badge variant={agent.status === 'Active' ? 'default' : agent.status === 'Away' ? 'secondary' : 'outline'}>
                        {agent.status}
                      </Badge>
                      <Badge variant="outline">{agent.role}</Badge>
                    </div>
                    <p className="text-gray-600 max-w-2xl">{agent.bio}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Shield className="h-4 w-4 mr-2" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeactivateDialogOpen(true)}>
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate Agent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{agent.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{agent.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{agent.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Joined {new Date(agent.join_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {company && (
                  <div className="mt-3 pt-3 border-t">
                    <button
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                      onClick={() => navigate(`/superadmin/company/${company.id}`)}
                    >
                      <Building2 className="h-4 w-4" />
                      <span>{company.name}</span>
                      <Badge variant="outline" className="text-xs">{company.plan}</Badge>
                    </button>
                  </div>
                )}
              </div>
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
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold">{stats.tickets_resolved}</h3>
                <span className="text-sm text-gray-500">/ {stats.total_tickets}</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold">{stats.avg_response_time}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingDown className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">-8% faster</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Customer Rating</p>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold">{stats.rating}</h3>
                <span className="text-sm text-gray-500">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">Excellent</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Satisfaction Rate</p>
                <ThumbsUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold">{stats.customer_satisfaction}%</h3>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">Above target</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4 pb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Assigned Tickets</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Projects */}
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects.map(project => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => navigate(`/superadmin/project/${project.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: project.color + '20' }}
                          >
                            <FolderOpen className="h-5 w-5" style={{ color: project.color }} />
                          </div>
                          <div>
                            <span className="font-medium">{project.name}</span>
                            <p className="text-xs text-gray-500">{project.active_tickets} active tickets</p>
                          </div>
                        </div>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No projects assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>This Month&apos;s Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tickets Closed</p>
                          <p className="font-semibold">{stats.tickets_resolved} tickets</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">+15%</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Chat Sessions</p>
                          <p className="font-semibold">{stats.total_chats} sessions</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">+8%</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                          <Award className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">First Response Time</p>
                          <p className="font-semibold">1.2 min avg</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">Excellent</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Response Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={response_time_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Currently Assigned Tickets ({tickets.length})</CardTitle>
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
                    {tickets.length > 0 ? (
                      tickets.map(ticket => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.ticket_id}</TableCell>
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
                          <TableCell>{ticket.lastUpdate}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">View</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
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

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recent_activity.map((activity, index) => {
                    const Icon = iconMap[activity.icon] || FileText;
                    return (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Icon className={`h-5 w-5 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-gray-600">{activity.details}</p>
                          <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>6-Month Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performance_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="tickets" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performance_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="satisfaction" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="h-8 w-8 text-blue-600" />
                      <h4 className="font-semibold">Resolution Rate</h4>
                    </div>
                    <p className="text-3xl font-bold">
                      {stats.total_tickets > 0 
                        ? ((stats.tickets_resolved / stats.total_tickets) * 100).toFixed(1) 
                        : 0}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{stats.tickets_resolved} of {stats.total_tickets} tickets resolved</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="h-8 w-8 text-yellow-600" />
                      <h4 className="font-semibold">First Contact Resolution</h4>
                    </div>
                    <p className="text-3xl font-bold">78%</p>
                    <p className="text-sm text-gray-600 mt-1">Above team average of 72%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Activity className="h-8 w-8 text-green-600" />
                      <h4 className="font-semibold">Active Days</h4>
                    </div>
                    <p className="text-3xl font-bold">22/23</p>
                    <p className="text-sm text-gray-600 mt-1">Days active this month</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Agent Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Agent Profile</DialogTitle>
            <DialogDescription>
              Update agent information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={agent.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select defaultValue={agent.role.toLowerCase()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={agent.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" defaultValue={agent.phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" defaultValue={agent.location} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" defaultValue={agent.bio} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setEditDialogOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Agent Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {agent.name}? They will lose access to the platform and their tickets will need to be reassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setDeactivateDialogOpen(false)}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

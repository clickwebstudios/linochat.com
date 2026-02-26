import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Activity,
  MessageCircle,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  UserX,
  Users,
  Ticket,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';
import { SuperadminSidebar } from '../../components/superadmin/SuperadminSidebar';
import { SuperadminTopbar } from '../../components/superadmin/SuperadminTopbar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// User data from API
interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'agent' | 'superadmin';
  status: 'Active' | 'Away' | 'Offline' | 'Deactivated' | 'Invited';
  avatar_url?: string;
  join_date: string;
  phone?: string;
  location?: string;
  department?: string;
  last_login?: string;
  tickets_handled?: number;
  chats_handled?: number;
  avg_response_time?: string;
  satisfaction?: number;
  bio?: string;
  permissions?: string[];
}

// Extended user data for detail view (fallback data)
const defaultDetails = {
  phone: '+1 (555) 000-0000',
  location: 'Unknown',
  department: 'General',
  lastLogin: 'Recently',
  ticketsHandled: 0,
  chatsHandled: 0,
  avgResponseTime: 'N/A',
  satisfaction: 0,
  bio: 'Team member.',
  permissions: ['View Tickets'],
};

const activityData = [
  { day: 'Mon', tickets: 12, chats: 18 },
  { day: 'Tue', tickets: 15, chats: 22 },
  { day: 'Wed', tickets: 10, chats: 16 },
  { day: 'Thu', tickets: 18, chats: 25 },
  { day: 'Fri', tickets: 14, chats: 20 },
  { day: 'Sat', tickets: 6, chats: 8 },
  { day: 'Sun', tickets: 4, chats: 5 },
];

const recentActivity = [
  { time: '2 min ago', action: 'Resolved ticket', details: 'T-1045 - Login issues', icon: CheckCircle, color: 'text-green-600' },
  { time: '15 min ago', action: 'Started chat', details: 'with Customer Lisa M.', icon: MessageCircle, color: 'text-blue-600' },
  { time: '1 hour ago', action: 'Updated ticket', details: 'T-1032 - Changed priority to high', icon: AlertCircle, color: 'text-orange-600' },
  { time: '2 hours ago', action: 'Closed ticket', details: 'T-1028 - Billing inquiry resolved', icon: CheckCircle, color: 'text-green-600' },
  { time: '3 hours ago', action: 'Added note', details: 'T-1015 - Escalated to technical team', icon: FileText, color: 'text-gray-600' },
];

const loginHistory = [
  { date: 'Feb 11, 2026', time: '9:15 AM', ip: '192.168.1.45', location: 'San Francisco, CA', device: 'Chrome / macOS' },
  { date: 'Feb 10, 2026', time: '8:42 AM', ip: '192.168.1.45', location: 'San Francisco, CA', device: 'Chrome / macOS' },
  { date: 'Feb 9, 2026', time: '10:30 AM', ip: '10.0.0.12', location: 'San Francisco, CA', device: 'Safari / iOS' },
  { date: 'Feb 7, 2026', time: '9:05 AM', ip: '192.168.1.45', location: 'San Francisco, CA', device: 'Chrome / macOS' },
  { date: 'Feb 6, 2026', time: '8:50 AM', ip: '192.168.1.45', location: 'San Francisco, CA', device: 'Chrome / macOS' },
];

export default function UserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  
  // User data state
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from API
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setError('User ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get<UserData>(`/superadmin/agents/${userId}`);
        if (response.success) {
          setUser(response.data);
        } else {
          setError(response.message || 'Failed to fetch user');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // Get user display name
  const userName = user 
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : '';

  // Get user initials for avatar
  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
    : 'U';

  // Get details with fallbacks
  const d = {
    phone: user?.phone || defaultDetails.phone,
    location: user?.location || defaultDetails.location,
    department: user?.department || defaultDetails.department,
    lastLogin: user?.last_login || defaultDetails.lastLogin,
    ticketsHandled: user?.tickets_handled || defaultDetails.ticketsHandled,
    chatsHandled: user?.chats_handled || defaultDetails.chatsHandled,
    avgResponseTime: user?.avg_response_time || defaultDetails.avgResponseTime,
    satisfaction: user?.satisfaction || defaultDetails.satisfaction,
    bio: user?.bio || defaultDetails.bio,
    permissions: user?.permissions || defaultDetails.permissions,
  };

  // Loading state
  if (loading) {
    return (
      <>
        <SuperadminTopbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading user details...</span>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <>
        <SuperadminTopbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "The user you're looking for doesn't exist."}</p>
            <Button onClick={() => navigate('/superadmin/team')}>Back to Team</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SuperadminTopbar />

        <main className="flex-1 overflow-y-auto bg-gray-50 px-6 pt-6">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/superadmin/team')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Button>
          </div>

          {/* User Header Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-5">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-600 text-white text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold">{userName}</h1>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {user.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{d.bio}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{user.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{d.phone}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{d.location}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Joined {user.join_date}</span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => setDeactivateDialogOpen(true)}>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Ticket className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tickets Handled</p>
                    <p className="text-2xl font-bold">{d.ticketsHandled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Chats Handled</p>
                    <p className="text-2xl font-bold">{d.chatsHandled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Response Time</p>
                    <p className="text-2xl font-bold">{d.avgResponseTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Satisfaction</p>
                    <p className="text-2xl font-bold">{d.satisfaction}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="activity" className="mb-6">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="logins">Login History</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-6 mt-4">
              {/* Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="tickets" stroke="#3B82F6" strokeWidth={2} name="Tickets" />
                        <Line type="monotone" dataKey="chats" stroke="#10B981" strokeWidth={2} name="Chats" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <item.icon className={`h-5 w-5 mt-0.5 ${item.color}`} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{item.action}</p>
                          <p className="text-xs text-gray-600">{item.details}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Role & Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold">Role</p>
                        <p className="text-sm text-gray-600">{user.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Activity className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold">Department</p>
                        <p className="text-sm text-gray-600">{d.department}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-3">Assigned Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {d.permissions.map((perm) => (
                          <Badge key={perm} variant="outline" className="px-3 py-1">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logins" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Login History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Device</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginHistory.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>{entry.time}</TableCell>
                          <TableCell className="font-mono text-sm">{entry.ip}</TableCell>
                          <TableCell>{entry.location}</TableCell>
                          <TableCell>{entry.device}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role assignment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Full Name</Label>
              <Input defaultValue={userName} className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue={user.email} className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input defaultValue={d.phone} className="mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <Select defaultValue={user.role}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600" onClick={() => setEditDialogOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate <span className="font-semibold">{userName}</span>? They will lose access to the platform immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setDeactivateDialogOpen(false)}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

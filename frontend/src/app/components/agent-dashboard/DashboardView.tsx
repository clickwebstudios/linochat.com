import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  MessageCircle,
  Ticket,
  BarChart,
  Users,
  ExternalLink,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
  filteredChats: any[];
  getProjectById: (id: string) => any;
  existingTeamMembers: any[];
  basePath: string;
  role: string;
}

interface DashboardStats {
  activeChats: number;
  openTickets: number;
  totalTickets: number;
  avgResponseTime: string;
  satisfaction: string;
}

interface ActivityItem {
  id: string;
  type: 'ticket_assigned' | 'chat_resolved' | 'ticket_escalated' | 'ticket_created' | 'chat_started';
  message: string;
  timestamp: string;
}

interface TicketVolumeData {
  name: string;
  tickets: number;
}

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  assignee?: { id: string; first_name: string; last_name: string };
  requester?: { id: string; first_name: string; last_name: string };
}

interface Chat {
  id: string;
  status: 'active' | 'pending' | 'resolved' | 'closed';
  customer_name: string;
  last_message?: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

// Get token from localStorage
const getToken = () => localStorage.getItem('access_token');

// Format relative time
const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// Get activity icon based on type
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'ticket_assigned':
    case 'ticket_created':
      return { icon: Ticket, color: 'bg-blue-100 text-blue-600' };
    case 'chat_resolved':
    case 'chat_started':
      return { icon: MessageCircle, color: 'bg-green-100 text-green-600' };
    case 'ticket_escalated':
      return { icon: Ticket, color: 'bg-orange-100 text-orange-600' };
    default:
      return { icon: Ticket, color: 'bg-gray-100 text-gray-600' };
  }
};

// Calculate stats from real data
const calculateStats = (tickets: Ticket[], chats: Chat[]): DashboardStats => {
  const activeChats = chats.filter(c => c.status === 'active').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const totalTickets = tickets.length;
  
  // Calculate average response time from tickets
  const ticketsWithUpdates = tickets.filter(t => t.updated_at && t.created_at);
  let avgResponseMinutes: number | null = null;

  if (ticketsWithUpdates.length > 0) {
    const totalMinutes = ticketsWithUpdates.reduce((sum, t) => {
      const created = new Date(t.created_at).getTime();
      const updated = new Date(t.updated_at).getTime();
      return sum + (updated - created) / 60000;
    }, 0);
    avgResponseMinutes = Math.round(totalMinutes / ticketsWithUpdates.length);
  }
  
  // Satisfaction would come from ratings API - show dash when no data
  const satisfaction = '—';
  
  return {
    activeChats,
    openTickets,
    totalTickets,
    avgResponseTime: avgResponseMinutes != null
      ? (avgResponseMinutes < 60 ? `${avgResponseMinutes} min` : `${Math.round(avgResponseMinutes / 60)}h`)
      : '—',
    satisfaction,
  };
};

// Generate activity from real tickets and chats
const generateActivity = (tickets: Ticket[], chats: Chat[]): ActivityItem[] => {
  const activities: ActivityItem[] = [];
  
  // Add ticket activities
  tickets.slice(0, 5).forEach((ticket, index) => {
    const type = ticket.status === 'escalated' ? 'ticket_escalated' : 
                 ticket.status === 'open' ? 'ticket_created' : 'ticket_assigned';
    
    activities.push({
      id: `ticket-${ticket.id}`,
      type,
      message: type === 'ticket_escalated' 
        ? `Ticket escalated: ${ticket.title.substring(0, 30)}`
        : type === 'ticket_created'
        ? `New ticket: ${ticket.title.substring(0, 30)}`
        : `Ticket assigned: ${ticket.title.substring(0, 30)}`,
      timestamp: ticket.updated_at || ticket.created_at,
    });
  });
  
  // Add chat activities
  chats.filter(c => c.status === 'resolved').slice(0, 3).forEach(chat => {
    activities.push({
      id: `chat-${chat.id}`,
      type: 'chat_resolved',
      message: `Chat resolved with ${chat.customer_name || 'customer'}`,
      timestamp: chat.updated_at || chat.created_at,
    });
  });
  
  // Sort by timestamp (newest first) and take top 5
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
};

// Calculate ticket volume for the last 7 days
const calculateTicketVolume = (tickets: Ticket[]): TicketVolumeData[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const volume: TicketVolumeData[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayName = days[date.getDay()];
    
    const count = tickets.filter(t => {
      const ticketDate = new Date(t.created_at);
      return ticketDate.toDateString() === date.toDateString();
    }).length;
    
    volume.push({ name: dayName, tickets: count });
  }
  
  return volume;
};

export function DashboardView({
  filteredChats,
  getProjectById,
  existingTeamMembers,
  basePath,
  role,
}: DashboardViewProps) {
  const navigate = useNavigate();
  
  // Real data from API - start with zeros until fetched
  const [stats, setStats] = useState<DashboardStats>({
    activeChats: 0,
    openTickets: 0,
    totalTickets: 0,
    avgResponseTime: '—',
    satisfaction: '—',
  });
  const [chartData, setChartData] = useState<TicketVolumeData[]>([
    { name: 'Mon', tickets: 0 },
    { name: 'Tue', tickets: 0 },
    { name: 'Wed', tickets: 0 },
    { name: 'Thu', tickets: 0 },
    { name: 'Fri', tickets: 0 },
    { name: 'Sat', tickets: 0 },
    { name: 'Sun', tickets: 0 },
  ]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch tickets
        const ticketsResponse = await fetch('/api/agent/tickets', {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        
        let ticketsData: Ticket[] = [];
        if (ticketsResponse.ok) {
          const result = await ticketsResponse.json();
          ticketsData = result.data?.data || result.data || [];
          setTickets(ticketsData);
        }

        // Fetch chats
        const chatsResponse = await fetch('/api/agent/chats', {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        
        let chatsData: Chat[] = [];
        if (chatsResponse.ok) {
          const result = await chatsResponse.json();
          chatsData = result.data?.data || result.data || [];
          setChats(chatsData);
        }

        // Calculate stats from real data
        if (ticketsData.length > 0 || chatsData.length > 0) {
          const realStats = calculateStats(ticketsData, chatsData);
          setStats(realStats);
          
          const activity = generateActivity(ticketsData, chatsData);
          setRecentActivity(activity);
          
          const volume = calculateTicketVolume(ticketsData);
          setChartData(volume);
          
          setHasRealData(true);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Use props filtered chats or real chats
  const displayChats = hasRealData && chats.length > 0 
    ? chats.map(c => ({
        id: c.id,
        status: c.status,
        customer: c.customer_name || 'Unknown',
        avatar: c.customer_name ? c.customer_name.split(' ').map(n => n[0]).join('') : '??',
        preview: c.last_message || 'No messages',
        time: formatRelativeTime(c.updated_at || c.created_at),
        unread: c.unread_count || 0,
        projectId: '',
      }))
    : filteredChats;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Chats</p>
                <p className="text-3xl font-bold">{stats.activeChats}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Tickets</p>
                <p className="text-3xl font-bold">{stats.openTickets}</p>
              </div>
              <Ticket className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response</p>
                <p className="text-3xl font-bold">{stats.avgResponseTime}</p>
              </div>
              <BarChart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfaction</p>
                <p className="text-3xl font-bold">{stats.satisfaction}</p>
              </div>
              <span className="text-4xl">😊</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Volume (This Week)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="tickets" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-6 text-gray-400">Loading...</div>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const { icon: Icon, color } = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Chats and Active Agents Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Active Chats */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`${basePath}/chats`)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Active Chats
                </CardTitle>
                <Badge className="bg-blue-600">{displayChats.filter(chat => chat.status === 'active').length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayChats.filter(chat => chat.status === 'active').slice(0, 4).map((chat) => {
                  const project = getProjectById(chat.projectId);
                  return (
                    <div key={chat.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">{chat.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{chat.customer}</p>
                          <span className="text-xs text-gray-500 ml-auto text-right">{chat.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{chat.preview}</p>
                        {project && (
                          <div className="mt-1 flex items-center gap-1">
                            <div 
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white"
                              style={{ backgroundColor: project.color }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white/80"></div>
                              {project.name}
                            </div>
                          </div>
                        )}
                      </div>
                      {chat.unread > 0 && (
                        <Badge className="bg-blue-600 text-xs">{chat.unread}</Badge>
                      )}
                    </div>
                  );
                })}
                {displayChats.filter(chat => chat.status === 'active').length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No active chats</p>
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`${basePath}/chats`);
                }}
              >
                View All Chats
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Active Agents */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`${basePath}/users`)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Active Agents
                </CardTitle>
                <Badge className="bg-green-600">{existingTeamMembers.filter(m => m.role === 'Agent' || m.role === 'Admin').slice(0, 5).length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingTeamMembers
                  .filter(member => member.role === 'Agent' || member.role === 'Admin')
                  .slice(0, 4)
                  .map((agent) => (
                    <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100 text-green-700">{agent.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {agent.role}
                      </Badge>
                    </div>
                  ))}
                {existingTeamMembers.filter(m => m.role === 'Agent' || m.role === 'Admin').length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No active agents</p>
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`${basePath}/users`);
                }}
              >
                View All Agents
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

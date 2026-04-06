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
  Eye,
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

interface DayData {
  name: string;
  value: number;
}

interface TicketItem {
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

const getToken = () => localStorage.getItem('access_token');

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

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'ticket_assigned':
    case 'ticket_created':
      return { icon: Ticket, color: 'bg-primary/10 text-primary' };
    case 'chat_resolved':
    case 'chat_started':
      return { icon: MessageCircle, color: 'bg-green-100 text-green-600' };
    case 'ticket_escalated':
      return { icon: Ticket, color: 'bg-orange-100 text-orange-600' };
    default:
      return { icon: Ticket, color: 'bg-muted text-muted-foreground' };
  }
};

const calculateStats = (tickets: TicketItem[], chats: Chat[]): DashboardStats => {
  const activeChats = chats.filter(c => c.status === 'active').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const totalTickets = tickets.length;
  const ticketsWithUpdates = tickets.filter(t => t.updated_at && t.created_at);
  let avgResponseMinutes: number | null = null;
  if (ticketsWithUpdates.length > 0) {
    const totalMinutes = ticketsWithUpdates.reduce((sum, t) => {
      return sum + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / 60000;
    }, 0);
    avgResponseMinutes = Math.round(totalMinutes / ticketsWithUpdates.length);
  }
  return {
    activeChats, openTickets, totalTickets,
    avgResponseTime: avgResponseMinutes != null
      ? (avgResponseMinutes < 60 ? `${avgResponseMinutes} min` : `${Math.round(avgResponseMinutes / 60)}h`)
      : '—',
    satisfaction: '—',
  };
};

const generateActivity = (tickets: TicketItem[], chats: Chat[]): ActivityItem[] => {
  const activities: ActivityItem[] = [];
  tickets.slice(0, 5).forEach((ticket) => {
    const type = ticket.status === 'escalated' ? 'ticket_escalated' :
                 ticket.status === 'open' ? 'ticket_created' : 'ticket_assigned';
    activities.push({
      id: `ticket-${ticket.id}`, type,
      message: type === 'ticket_escalated' ? `Ticket escalated: ${ticket.title.substring(0, 30)}`
        : type === 'ticket_created' ? `New ticket: ${ticket.title.substring(0, 30)}`
        : `Ticket assigned: ${ticket.title.substring(0, 30)}`,
      timestamp: ticket.updated_at || ticket.created_at,
    });
  });
  chats.filter(c => c.status === 'resolved').slice(0, 3).forEach(chat => {
    activities.push({
      id: `chat-${chat.id}`, type: 'chat_resolved',
      message: `Chat resolved with ${chat.customer_name || 'customer'}`,
      timestamp: chat.updated_at || chat.created_at,
    });
  });
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
};

const getLast7Days = (): { date: Date; name: string }[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    result.push({ date, name: days[date.getDay()] });
  }
  return result;
};

const calculateTicketVolume = (tickets: TicketItem[]): TicketVolumeData[] => {
  return getLast7Days().map(({ date, name }) => ({
    name,
    tickets: tickets.filter(t => new Date(t.created_at).toDateString() === date.toDateString()).length,
  }));
};

const calculateVisitors = (chats: Chat[]): DayData[] => {
  return getLast7Days().map(({ date, name }) => ({
    name,
    value: chats.filter(c => new Date(c.created_at).toDateString() === date.toDateString()).length,
  }));
};

const calculatePageViews = (tickets: TicketItem[], chats: Chat[]): DayData[] => {
  return getLast7Days().map(({ date, name }) => {
    const dayStr = date.toDateString();
    const t = tickets.filter(t => new Date(t.created_at).toDateString() === dayStr).length;
    const c = chats.filter(c => new Date(c.created_at).toDateString() === dayStr).length;
    return { name, value: t + c };
  });
};

const emptyDays = (): DayData[] =>
  getLast7Days().map(({ name }) => ({ name, value: 0 }));

export function DashboardView({
  filteredChats,
  getProjectById,
  existingTeamMembers,
  basePath,
}: DashboardViewProps) {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    activeChats: 0, openTickets: 0, totalTickets: 0,
    avgResponseTime: '—', satisfaction: '—',
  });
  const [ticketData, setTicketData] = useState<TicketVolumeData[]>(
    getLast7Days().map(({ name }) => ({ name, tickets: 0 }))
  );
  const [visitorsData, setVisitorsData] = useState<DayData[]>(emptyDays());
  const [pageViewsData, setPageViewsData] = useState<DayData[]>(emptyDays());
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [_tickets, setTickets] = useState<TicketItem[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) { setLoading(false); return; }
      try {
        setLoading(true);
        const [ticketsRes, chatsRes] = await Promise.all([
          fetch('/api/agent/tickets', { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }),
          fetch('/api/agent/chats',   { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }),
        ]);
        let ticketsData: TicketItem[] = [];
        let chatsData: Chat[] = [];
        if (ticketsRes.ok) { const r = await ticketsRes.json(); ticketsData = r.data?.data || r.data || []; setTickets(ticketsData); }
        if (chatsRes.ok)   { const r = await chatsRes.json();   chatsData = r.data?.data || r.data || []; setChats(chatsData); }
        if (ticketsData.length > 0 || chatsData.length > 0) {
          setStats(calculateStats(ticketsData, chatsData));
          setRecentActivity(generateActivity(ticketsData, chatsData));
          setTicketData(calculateTicketVolume(ticketsData));
          setVisitorsData(calculateVisitors(chatsData));
          setPageViewsData(calculatePageViews(ticketsData, chatsData));
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

  const displayChats = hasRealData && chats.length > 0
    ? chats.map(c => ({
        id: c.id, status: c.status,
        customer: c.customer_name || 'Unknown',
        avatar: c.customer_name ? c.customer_name.split(' ').map(n => n[0]).join('') : '??',
        preview: c.last_message || 'No messages',
        time: formatRelativeTime(c.updated_at || c.created_at),
        unread: c.unread_count || 0,
        projectId: '',
      }))
    : filteredChats;

  const chartContent = (data: { name: string; value?: number; tickets?: number }[], dataKey: string, color: string) => {
    if (loading) {
      return <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">Loading...</div>;
    }
    const hasData = data.some(d => ((d as any)[dataKey] ?? 0) > 0);
    if (!hasData) {
      return (
        <div className="h-[160px] flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No data for this period</p>
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Active Chats</p><p className="text-3xl font-bold">{stats.activeChats}</p></div>
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Open Tickets</p><p className="text-3xl font-bold">{stats.openTickets}</p></div>
              <Ticket className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Avg Response</p><p className="text-3xl font-bold">{stats.avgResponseTime}</p></div>
              <BarChart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Satisfaction</p><p className="text-3xl font-bold">{stats.satisfaction}</p></div>
              <span className="text-4xl">😊</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Row 1: 3 charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Ticket className="h-4 w-4 text-primary" />
                Ticket Volume
              </CardTitle>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardHeader>
            <CardContent>{chartContent(ticketData, 'tickets', 'var(--primary)')}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-green-600" />
                Visitors
              </CardTitle>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardHeader>
            <CardContent>{chartContent(visitorsData, 'value', '#16a34a')}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-violet-600" />
                Page Views
              </CardTitle>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardHeader>
            <CardContent>{chartContent(pageViewsData, 'value', '#7c3aed')}</CardContent>
          </Card>
        </div>

        {/* Row 2: Active Chats | Active Agents | Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Chats */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`${basePath}/chats`)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Active Chats
                </CardTitle>
                <Badge className="bg-primary">{displayChats.filter(c => c.status === 'active').length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayChats.filter(c => c.status === 'active').slice(0, 4).map((chat) => {
                  const project = getProjectById(chat.projectId);
                  return (
                    <div key={chat.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">{chat.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{chat.customer}</p>
                          <span className="text-xs text-muted-foreground ml-auto">{chat.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{chat.preview}</p>
                        {project && (
                          <div className="mt-1">
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white" style={{ backgroundColor: project.color }}>
                              <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                              {project.name}
                            </div>
                          </div>
                        )}
                      </div>
                      {chat.unread > 0 && <Badge className="bg-primary text-xs">{chat.unread}</Badge>}
                    </div>
                  );
                })}
                {displayChats.filter(c => c.status === 'active').length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted" />
                    <p className="text-sm">No active chats</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary hover:bg-primary/10"
                onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/chats`); }}>
                View All Chats <ExternalLink className="ml-2 h-4 w-4" />
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
                {existingTeamMembers.filter(m => m.role === 'Agent' || m.role === 'Admin').slice(0, 4).map((agent) => (
                  <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-100 text-green-700">{agent.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{agent.role}</Badge>
                  </div>
                ))}
                {existingTeamMembers.filter(m => m.role === 'Agent' || m.role === 'Admin').length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted" />
                    <p className="text-sm">No active agents</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/users`); }}>
                View All Agents <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const { icon: Icon, color } = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

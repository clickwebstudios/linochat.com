import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  MessageCircle, 
  Ticket, 
  BarChart, 
  TrendingUp,
  Users,
  Clock,
  ThumbsUp,
  Search,
} from 'lucide-react';
import { 
  DashboardLayout, 
  DashboardHeader, 
  DashboardStats,
  DashboardContent,
  DashboardSection 
} from '../../components/layouts';
import { AdminSidebar } from '../../components/AdminSidebar';
import { mockStats } from '../../data/mockData';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

/**
 * Example Dashboard using slot-based composition pattern
 * 
 * This demonstrates how to build a dashboard using the new layout components
 */
export default function ExampleDashboard() {
  const navigate = useNavigate();
  const [, setActiveSection] = useState('dashboard');

  // Sample data
  const chartData = [
    { name: 'Mon', tickets: 24 },
    { name: 'Tue', tickets: 35 },
    { name: 'Wed', tickets: 28 },
    { name: 'Thu', tickets: 42 },
    { name: 'Fri', tickets: 38 },
    { name: 'Sat', tickets: 18 },
    { name: 'Sun', tickets: 12 },
  ];

  const notifications = [
    {
      id: '1',
      message: 'New ticket assigned: T-1001',
      time: '2 minutes ago',
      unread: true,
    },
    {
      id: '2',
      message: 'Chat resolved with Lisa Anderson',
      time: '15 minutes ago',
      unread: true,
    },
    {
      id: '3',
      message: 'New feature: AI-powered responses',
      time: '1 hour ago',
      unread: false,
    },
    {
      id: '4',
      message: 'System maintenance scheduled',
      time: '2 hours ago',
      unread: false,
    },
    {
      id: '5',
      message: 'Monthly report is ready',
      time: '1 day ago',
      unread: false,
    },
  ];

  const user = {
    name: 'Sarah Johnson',
    email: 'sarah@linochat.com',
    avatar: 'SJ',
    role: 'Admin',
  };

  // Header actions slot
  const headerActions = (
    <>
      <Button variant="outline" size="sm">
        <TrendingUp className="mr-2 h-4 w-4" />
        Export Report
      </Button>
      <Button size="sm" className="bg-primary hover:bg-primary/90">
        <Ticket className="mr-2 h-4 w-4" />
        New Ticket
      </Button>
    </>
  );

  // Stats data
  const stats = [
    {
      title: 'Active Chats',
      value: mockStats.activeChats,
      icon: MessageCircle,
      iconColor: 'text-primary',
      trend: { value: '+12% from last week', positive: true },
    },
    {
      title: 'Open Tickets',
      value: mockStats.openTickets,
      icon: Ticket,
      iconColor: 'text-orange-600',
      trend: { value: '-5% from last week', positive: true },
    },
    {
      title: 'Avg Response',
      value: mockStats.avgResponseTime,
      icon: Clock,
      iconColor: 'text-green-600',
      trend: { value: '30s faster', positive: true },
    },
    {
      title: 'Satisfaction',
      value: mockStats.satisfaction,
      icon: ThumbsUp,
      iconColor: 'text-secondary',
      trend: { value: '+3% this month', positive: true },
    },
  ];

  return (
    <DashboardLayout
      sidebar={
        <AdminSidebar
          role="Admin"
        />
      }
      header={
        <DashboardHeader
          user={user}
          notificationsList={notifications}
          unreadCount={2}
          actions={headerActions}
          onSearch={() => {}}
          search={
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats, tickets, customers..."
                  className="pl-10 bg-muted/50 border-border"
                  onChange={() => {}}
                />
              </div>
            </div>
          }
        />
      }
    >
      <DashboardContent padding="lg">
        {/* Stats Section using slot composition */}
        <DashboardSection className="mb-6">
          <DashboardStats stats={stats} />
        </DashboardSection>

        {/* Main Content Section */}
        <DashboardSection
          title="Overview"
          description="Your performance metrics and activity"
        >
          <Tabs defaultValue="analytics" className="space-y-4">
            <TabsList>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="team">Team Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Volume (This Week)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="tickets" 
                          stroke="var(--primary)" 
                          fill="var(--primary)" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Recent Activity Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <ActivityItem
                        icon={<Ticket className="h-4 w-4" />}
                        iconColor="bg-primary/10 text-primary"
                        title="New ticket assigned: T-1001"
                        time="2 minutes ago"
                      />
                      <ActivityItem
                        icon={<MessageCircle className="h-4 w-4" />}
                        iconColor="bg-green-100 text-green-600"
                        title="Chat resolved with Lisa Anderson"
                        time="15 minutes ago"
                      />
                      <ActivityItem
                        icon={<Users className="h-4 w-4" />}
                        iconColor="bg-secondary/10 text-secondary"
                        title="New team member joined"
                        time="1 hour ago"
                      />
                      <ActivityItem
                        icon={<Ticket className="h-4 w-4" />}
                        iconColor="bg-orange-100 text-orange-600"
                        title="Ticket escalated: T-998"
                        time="2 hours ago"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Activity timeline content...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Team performance metrics...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DashboardSection>

        {/* Another Section - Demonstrating flexibility */}
        <DashboardSection
          title="Quick Actions"
          description="Common tasks and shortcuts"
          actions={
            <Button variant="link" size="sm">
              Customize
            </Button>
          }
          className="mt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              title="Create Ticket"
              description="Start a new support ticket"
              icon={<Ticket className="h-8 w-8 text-primary" />}
              onClick={() => navigate('/tickets/new')}
            />
            <QuickActionCard
              title="View Reports"
              description="Access analytics and reports"
              icon={<BarChart className="h-8 w-8 text-green-600" />}
              onClick={() => setActiveSection('reports')}
            />
            <QuickActionCard
              title="Manage Team"
              description="Add or edit team members"
              icon={<Users className="h-8 w-8 text-secondary" />}
              onClick={() => setActiveSection('users')}
            />
          </div>
        </DashboardSection>
      </DashboardContent>
    </DashboardLayout>
  );
}

// Helper Components

interface ActivityItemProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  time: string;
}

function ActivityItem({ icon, iconColor, title, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function QuickActionCard({ title, description, icon, onClick }: QuickActionCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow" 
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-3">
          {icon}
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

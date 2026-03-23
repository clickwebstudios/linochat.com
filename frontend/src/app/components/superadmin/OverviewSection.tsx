import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';
import {
  Users,
  Shield,
  CreditCard,
  Bell,
  TrendingUp,
  Activity,
  Globe,
  Headphones,
  Building2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface OverviewSectionProps {
  revenueData: { month: string; revenue: number }[];
  userGrowthData: { month: string; users: number }[];
  setActiveSection: (section: string) => void;
  selectedCompanyId?: string | null;
  stats?: {
    total_users: number;
    active_agents: number;
    monthly_revenue: string;
    system_uptime: string;
    total_tickets?: number;
    avg_response_time?: string;
  } | null;
  isLoading?: boolean;
  companies?: { id: string; name: string; email: string; plan: string; created_at: string }[];
}

export function OverviewSection({ revenueData, userGrowthData, setActiveSection, stats, isLoading, companies = [] }: OverviewSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats?.monthly_revenue || '$0'}</p>
                  </>
                )}
              </div>
              <div className="h-12 w-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
                  </>
                )}
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Agents</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats?.active_agents || 0}</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Online now
                    </p>
                  </>
                )}
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">System Uptime</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats?.system_uptime || '99.9%'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last 30 days
                    </p>
                  </>
                )}
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Headphones className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Sign Ups — from real data */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Sign Ups</CardTitle>
            <Badge variant="outline" className="text-primary border-primary">
              {companies.length} Total
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {companies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No companies yet.</p>
              ) : (
                companies.slice(0, 5).map((company) => (
                  <div
                    key={company.id}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/superadmin/company/${company.id}`)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {company.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold truncate">{company.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(company.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{company.email}</p>
                      <Badge variant="secondary" className="text-xs capitalize">{company.plan}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" size="sm" onClick={() => setActiveSection('companies')}>
                View All Companies
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Visitors — placeholder until analytics is implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Live Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Live visitor tracking coming soon.</p>
              <p className="text-xs mt-1">Connect analytics to see real-time visitor data.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="var(--secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <Bell className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Server maintenance scheduled</p>
                <p className="text-xs text-muted-foreground">Planned downtime on Dec 25, 2024 at 2:00 AM UTC</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Security audit completed</p>
                <p className="text-xs text-muted-foreground">No vulnerabilities found in latest scan</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
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
  Monitor,
  Smartphone,
  Tablet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

interface LiveVisitor {
  id: string;
  customer_id: string;
  customer_name: string | null;
  current_page: string | null;
  referral_source: string;
  browser: string;
  device: string;
  project_name: string;
  started_at: string;
  last_seen_at: string;
  pages_count: number;
  pages_visited: { url: string; title: string; timestamp: string }[];
}

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
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([]);
  const [totalOnline, setTotalOnline] = useState(0);
  const [expandedVisitor, setExpandedVisitor] = useState<string | null>(null);

  useEffect(() => {
    const fetchLive = () => {
      api.get<any>('/superadmin/live-visitors').then(res => {
        if (res.success && res.data) {
          setLiveVisitors(res.data.visitors || []);
          setTotalOnline(res.data.total_online || 0);
        }
      }).catch(() => {});
    };
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, []);

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

        {/* Live Visitors — real-time data */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Live Visitors</CardTitle>
            <div className="flex items-center gap-2">
              {totalOnline > 0 && <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />}
              <Badge variant="outline" className={totalOnline > 0 ? 'text-green-600 border-green-600' : ''}>
                {totalOnline} Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {liveVisitors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active visitors right now.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {liveVisitors.map(v => {
                  const DeviceIcon = v.device === 'Mobile' ? Smartphone : v.device === 'Tablet' ? Tablet : Monitor;
                  const isExpanded = expandedVisitor === v.id;
                  const timeAgo = v.last_seen_at ? getTimeAgo(v.last_seen_at) : '';
                  const pagePath = v.current_page ? new URL(v.current_page, 'http://x').pathname : '—';
                  return (
                    <div key={v.id} className="bg-muted/50 rounded-lg">
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors rounded-lg"
                        onClick={() => setExpandedVisitor(isExpanded ? null : v.id)}
                      >
                        <div className="relative">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              <Globe className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{v.customer_name || 'Anonymous'}</p>
                            <span className="text-xs text-muted-foreground">{timeAgo}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{v.project_name} — {pagePath}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <DeviceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{v.browser}</span>
                          {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-muted-foreground">Source:</span> {v.referral_source}</div>
                            <div><span className="text-muted-foreground">Pages:</span> {v.pages_count}</div>
                          </div>
                          {v.pages_visited.length > 0 && (
                            <div className="space-y-1 pt-1 border-t">
                              <p className="text-xs font-medium text-muted-foreground">Page History</p>
                              {v.pages_visited.map((p, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                  <span className="truncate flex-1 text-muted-foreground">{p.title || new URL(p.url, 'http://x').pathname}</span>
                                  <span className="text-muted-foreground/60 shrink-0 ml-2">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DollarSign,
  Building2,
  MessageSquare,
  Ticket,
  Bot,
  TrendingUp,
  Users,
  Clock,
  ThumbsUp,
  Zap,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../../api/client';

// ── Types ──────────────────────────────────────────────────────────
interface Stats {
  total_users: number;
  active_agents: number;
  monthly_revenue: string;
  system_uptime: string;
  total_tickets: number;
  avg_response_time: string;
  csat_score: string;
  user_growth_data: { month: string; users: number }[];
  revenue_data: { month: string; revenue: number }[];
}

interface DashboardStats {
  total_users: number;
  total_projects: number;
  total_chats: number;
  total_tickets: number;
  active_chats: number;
}

interface Company {
  id: string;
  name: string;
  plan: string;
  projects_count: number;
  users_count: number;
  created_at: string;
  status: string;
}

interface AiUsage {
  totals: { calls: number; input_tokens: number; output_tokens: number; base_cost: number; charged_cost: number; profit: number };
  by_model: { model: string; calls: number; base_cost: number; charged_cost: number }[];
  by_project: { project_id: number; project_name: string; calls: number; base_cost: number; charged_cost: number }[];
  daily_trend: { date: string; calls: number; base_cost: number; charged_cost: number }[];
}

interface AnalyticsOverview {
  chat_volume: { date: string; total: number; ai_handled: number; human_handled: number }[];
  ticket_distribution: Record<string, number>;
  comparisons: {
    chats: { current: number; previous: number };
    tickets: { current: number; previous: number };
    new_users: { current: number; previous: number };
  };
  top_agents: { id: string; name: string; resolved: number; active_chats: number; status: string }[];
  at_risk_companies: { id: string; name: string; plan: string; last_active: string | null; days_inactive: number }[];
}

const PERIODS = ['7d', '30d', '90d', '6m', '1y'] as const;

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#6B7280'];
const STATUS_COLORS: Record<string, string> = { open: '#3B82F6', in_progress: '#F59E0B', waiting: '#8B5CF6', resolved: '#10B981', closed: '#6B7280', pending: '#EF4444' };

// ── Main Component ─────────────────────────────────────────────────
export default function PlatformAnalytics() {
  const [period, setPeriod] = useState<string>('30d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, dashRes, compRes, aiRes, analyticsRes] = await Promise.all([
        api.get<any>('/superadmin/stats').catch(() => null),
        api.get<any>('/superadmin/dashboard-stats').catch(() => null),
        api.get<any>('/superadmin/companies?per_page=100').catch(() => null),
        api.get<any>('/superadmin/ai-usage-stats').catch(() => null),
        api.get<any>(`/superadmin/analytics/overview?period=${period}`).catch(() => null),
      ]);
      if (statsRes?.success) setStats(statsRes.data);
      if (dashRes?.success) setDashStats(dashRes.data);
      if (compRes?.success) setCompanies(Array.isArray(compRes.data) ? compRes.data : []);
      if (aiRes?.success) setAiUsage(aiRes.data);
      if (analyticsRes?.success) setAnalytics(analyticsRes.data);
    } catch {}
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived data
  const planDistribution = companies.reduce<Record<string, number>>((acc, c) => {
    const plan = c.plan || 'Free';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});
  const planData = Object.entries(planDistribution).map(([name, value]) => ({ name, value }));
  const totalCompanies = companies.length;

  const ticketStatusData = [
    { name: 'Active', value: dashStats?.active_chats || 0 },
    { name: 'Total Tickets', value: dashStats?.total_tickets || 0 },
    { name: 'Total Chats', value: dashStats?.total_chats || 0 },
    { name: 'Projects', value: dashStats?.total_projects || 0 },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header + Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Platform Analytics</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  period === p ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Monthly Revenue" value={stats?.monthly_revenue || '$0'} icon={DollarSign} color="text-green-600" bg="bg-green-100" />
        <KPICard label="Companies" value={totalCompanies} icon={Building2} color="text-blue-600" bg="bg-blue-100" />
        <KPICard label="Active Chats" value={dashStats?.active_chats || 0} icon={MessageSquare} color="text-purple-600" bg="bg-purple-100" />
        <KPICard label="Total Tickets" value={stats?.total_tickets || 0} icon={Ticket} color="text-orange-600" bg="bg-orange-100" />
        <KPICard label="AI API Calls" value={aiUsage?.totals?.calls?.toLocaleString() || '0'} icon={Bot} color="text-cyan-600" bg="bg-cyan-100" />
        <KPICard label="AI Profit" value={`$${(aiUsage?.totals?.profit || 0).toFixed(2)}`} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-100" />
      </div>

      {/* Revenue & Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.revenue_data?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.revenue_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => [`$${v}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User & Company Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.user_growth_data?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.user_growth_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={2} name="Users" />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
      </div>

      {/* Product Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chat Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.chat_volume?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={analytics.chat_volume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={10} tickFormatter={d => d.slice(5)} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Legend fontSize={11} />
                  <Area type="monotone" dataKey="ai_handled" name="AI" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} stackId="1" />
                  <Area type="monotone" dataKey="human_handled" name="Human" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {planData.length ? (
              <>
                <div className="flex rounded-full overflow-hidden h-4 mb-4">
                  {planData.map((p, i) => (
                    <div
                      key={p.name}
                      className="h-full"
                      style={{ width: `${(p.value / totalCompanies) * 100}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      title={`${p.name}: ${p.value}`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {planData.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-1.5 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="font-semibold">{p.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI Usage by Model</CardTitle>
          </CardHeader>
          <CardContent>
            {aiUsage?.by_model?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={aiUsage.by_model} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="model" type="category" fontSize={11} width={100} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Calls']} />
                  <Bar dataKey="calls" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
      </div>

      {/* Customer Health & Support Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Top Companies by Usage</CardTitle>
              <Badge variant="outline">{totalCompanies} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-center">Projects</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.slice(0, 10).map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{c.plan || 'free'}</Badge></TableCell>
                    <TableCell className="text-center text-sm">{c.projects_count}</TableCell>
                    <TableCell className="text-center text-sm">{c.users_count}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'Active' ? 'default' : 'secondary'} className="text-xs">{c.status || 'Active'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Support & Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <MiniKPI label="Avg Response Time" value={stats?.avg_response_time || 'N/A'} icon={Clock} />
              <MiniKPI label="CSAT Score" value={stats?.csat_score || 'N/A'} icon={ThumbsUp} />
              <MiniKPI label="Total Users" value={stats?.total_users || 0} icon={Users} />
              <MiniKPI label="Active Agents" value={stats?.active_agents || 0} icon={Zap} />
            </div>

            {/* AI Cost vs Revenue */}
            {aiUsage?.daily_trend?.length ? (
              <div className="mt-6">
                <p className="text-sm font-medium mb-2">AI Cost vs Revenue (Daily)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={aiUsage.daily_trend.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={10} tickFormatter={d => d.slice(5)} />
                    <YAxis fontSize={10} />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`]} />
                    <Legend fontSize={11} />
                    <Line type="monotone" dataKey="base_cost" stroke="#EF4444" strokeWidth={1.5} name="Cost" dot={false} />
                    <Line type="monotone" dataKey="charged_cost" stroke="#22C55E" strokeWidth={1.5} name="Revenue" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* AI Top Projects */}
      {aiUsage?.by_project?.length ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI Usage by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">API Calls</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiUsage.by_project.slice(0, 10).map(p => (
                  <TableRow key={p.project_id}>
                    <TableCell className="font-medium text-sm">{p.project_name}</TableCell>
                    <TableCell className="text-right text-sm">{p.calls.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">${p.base_cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-sm">${p.charged_cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-green-600">${(p.charged_cost - p.base_cost).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {/* Top Agents & At-Risk Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Agents by Resolved Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.top_agents?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-center">Resolved</TableHead>
                    <TableHead className="text-center">Active Chats</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.top_agents.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-sm">{a.name}</TableCell>
                      <TableCell className="text-center text-sm">{a.resolved}</TableCell>
                      <TableCell className="text-center text-sm">{a.active_chats}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'Online' ? 'default' : 'secondary'} className="text-xs">{a.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No agent data for this period</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">At-Risk Companies</CardTitle>
              {analytics?.at_risk_companies?.length ? (
                <Badge variant="destructive" className="text-xs">{analytics.at_risk_companies.length} at risk</Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {analytics?.at_risk_companies?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Days Inactive</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.at_risk_companies.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm">{c.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{c.plan}</Badge></TableCell>
                      <TableCell className="text-right text-sm text-red-600 font-medium">{c.days_inactive}d</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No at-risk companies detected</p>}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Distribution */}
      {analytics?.ticket_distribution && Object.keys(analytics.ticket_distribution).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ticket Distribution by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 flex-wrap">
              {Object.entries(analytics.ticket_distribution).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || '#6B7280' }} />
                  <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                  <span className="text-sm font-bold">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────
function KPICard({ label, value, icon: Icon, color, bg }: { label: string; value: string | number; icon: any; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 ${bg} rounded-full flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniKPI({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
      No data available
    </div>
  );
}

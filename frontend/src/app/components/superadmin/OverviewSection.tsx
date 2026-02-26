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
}

export function OverviewSection({ revenueData, userGrowthData, setActiveSection, stats, isLoading }: OverviewSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats?.monthly_revenue || '$0'}</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +12.5% from last month
                    </p>
                  </>
                )}
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +8.2% from last month
                    </p>
                  </>
                )}
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Agents</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
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
                <p className="text-sm text-gray-600 mb-1">System Uptime</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats?.system_uptime || '99.9%'}</p>
                    <p className="text-xs text-gray-600 mt-1">
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
        {/* Latest Sign Ups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Sign Ups</CardTitle>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              12 This Week
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate('/superadmin/company/comp-6')}>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-600 text-white">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold truncate">NovaTech Industries</p>
                    <span className="text-xs text-gray-500">2h ago</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">James Carter &middot; james@novatech.io</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-purple-600 text-white text-xs">Enterprise</Badge>
                    <span className="text-xs text-gray-700 font-medium">$299/mo</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate('/superadmin/company/comp-7')}>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-emerald-600 text-white">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold truncate">GreenLeaf Organics</p>
                    <span className="text-xs text-gray-500">5h ago</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Priya Sharma &middot; priya@greenleaf.com</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-blue-600 text-white text-xs">Pro</Badge>
                    <span className="text-xs text-gray-700 font-medium">$79/mo</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate('/superadmin/company/comp-8')}>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-600 text-white">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold truncate">BrightPath Education</p>
                    <span className="text-xs text-gray-500">Yesterday</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Marcus Lee &middot; marcus@brightpath.edu</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-blue-600 text-white text-xs">Pro</Badge>
                    <span className="text-xs text-gray-700 font-medium">$79/mo</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate('/superadmin/company/comp-9')}>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-rose-600 text-white">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold truncate">Apex Fitness Co</p>
                    <span className="text-xs text-gray-500">Yesterday</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Sofia Ramirez &middot; sofia@apexfitness.com</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">Starter</Badge>
                    <span className="text-xs text-gray-700 font-medium">$29/mo</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate('/superadmin/company/comp-10')}>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-cyan-600 text-white">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold truncate">CloudSync Solutions</p>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Daniel Nguyen &middot; daniel@cloudsync.dev</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-purple-600 text-white text-xs">Enterprise</Badge>
                    <span className="text-xs text-gray-700 font-medium">$299/mo</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" size="sm" onClick={() => setActiveSection('companies')}>
                View All Companies
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Visitors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Live Visitors</CardTitle>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse"></div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                234 Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {[
                { initials: 'Globe', gradient: 'from-blue-500 to-purple-500', name: 'Anonymous User', time: 'Just now', company: 'TechCorp - Pricing Page', location: 'New York, US', device: 'Desktop' },
                { initials: 'Globe', gradient: 'from-green-500 to-teal-500', name: 'Sarah K.', time: '1m ago', company: 'RetailCo - Product Catalog', location: 'London, UK', device: 'Mobile' },
                { initials: 'Globe', gradient: 'from-orange-500 to-red-500', name: 'Michael R.', time: '2m ago', company: 'FinanceHub - Documentation', location: 'Toronto, CA', device: 'Desktop' },
                { initials: 'Globe', gradient: 'from-pink-500 to-purple-500', name: 'Anonymous User', time: '3m ago', company: 'HealthPlus - Contact Form', location: 'Sydney, AU', device: 'Tablet' },
                { initials: 'Globe', gradient: 'from-yellow-500 to-orange-500', name: 'Emma L.', time: '4m ago', company: 'EduLearn - Course Details', location: 'Berlin, DE', device: 'Desktop' },
                { initials: 'Globe', gradient: 'from-indigo-500 to-blue-500', name: 'James P.', time: '5m ago', company: 'TechCorp - Features Page', location: 'Tokyo, JP', device: 'Mobile' },
              ].map((visitor, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`bg-gradient-to-br ${visitor.gradient} text-white`}>
                        <Globe className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold">{visitor.name}</p>
                      <span className="text-xs text-gray-500">{visitor.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{visitor.company}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{visitor.location}</Badge>
                      <span className="text-xs text-gray-500">{visitor.device}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Page Views</p>
                  <p className="text-sm font-bold">1,847</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avg. Duration</p>
                  <p className="text-sm font-bold">3m 24s</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Bounce Rate</p>
                  <p className="text-sm font-bold">42%</p>
                </div>
              </div>
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
                <Bar dataKey="revenue" fill="#8b5cf6" />
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
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
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
                <p className="text-xs text-gray-600">Planned downtime on Dec 25, 2024 at 2:00 AM UTC</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Security audit completed</p>
                <p className="text-xs text-gray-600">No vulnerabilities found in latest scan</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

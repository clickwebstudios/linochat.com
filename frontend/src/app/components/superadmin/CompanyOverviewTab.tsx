import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  FolderKanban,
  MessageSquare,
  Activity,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Company {
  id: string;
  name: string;
  plan: string;
  email?: string;
  location?: string;
  joined?: string;
  mrr?: string;
  status?: string;
  usage?: number;
  color?: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  website?: string;
  domain?: string;
  tickets: number;
  totalTickets: number;
  activeTickets: number;
  members: number;
  companyId: string;
  status?: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  status?: string;
  activeTickets?: number;
  resolvedToday?: number;
  companyId: string;
}

interface CompanyOverviewTabProps {
  company: Company;
  companyProjects: Project[];
  companyAgents: Agent[];
  companyChats?: any[];
  activityLogs?: any[];
  totalTickets: number;
  defaultMeta: {
    email: string;
    location: string;
    joined: string;
    mrr: string;
    status: string;
    usage: number;
  };
  isArchived: boolean;
  setCompanyDetailTab: (tab: string) => void;
}

export function CompanyOverviewTab({
  company,
  companyProjects,
  companyAgents,
  companyChats,
  activityLogs,
  totalTickets,
  defaultMeta,
  isArchived,
  setCompanyDetailTab,
}: CompanyOverviewTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projects</p>
                <p className="text-xl font-bold">{companyProjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Chats</p>
                <p className="text-xl font-bold">{companyChats?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-secondary/10 rounded-full flex items-center justify-center">
                <Activity className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tickets</p>
                <p className="text-xl font-bold">{totalTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                <p className="text-xl font-bold">{defaultMeta.mrr}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects & Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Projects</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{companyProjects.length}</Badge>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => setCompanyDetailTab('projects')}>View all</Button>
            </div>
          </CardHeader>
          <CardContent>
            {companyProjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tickets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyProjects.map(project => (
                    <TableRow key={project.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.domain || project.website || '\u2014'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={project.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                          {project.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{project.tickets}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No projects yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Members</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{companyAgents.length}</Badge>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => setCompanyDetailTab('team')}>View all</Button>
            </div>
          </CardHeader>
          <CardContent>
            {companyAgents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Resolved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyAgents.map(agent => (
                    <TableRow key={agent.id} className={`hover:bg-muted/50 ${isArchived ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isArchived && navigate(`/superadmin/agent/${agent.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">{agent.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">{agent.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          agent.status === 'Online' ? 'text-green-600 border-green-600 text-xs'
                          : agent.status === 'Away' ? 'text-yellow-600 border-yellow-600 text-xs'
                          : 'text-muted-foreground border-border text-xs'
                        }>
                          {agent.status || 'Online'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{agent.activeTickets || 0}</TableCell>
                      <TableCell className="font-semibold">{agent.resolvedToday || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No members in this company</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plan Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-muted-foreground">API Requests</span>
                  <span className="text-sm font-semibold">{defaultMeta.usage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${defaultMeta.usage}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <span className="text-sm font-semibold">0%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-muted-foreground">Seats Used</span>
                  <span className="text-sm font-semibold">{companyAgents.length} / {company.plan === 'Enterprise' ? 'Unlimited' : company.plan === 'Pro' ? '25' : '5'}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: `${Math.min((companyAgents.length / (company.plan === 'Enterprise' ? 100 : company.plan === 'Pro' ? 25 : 5)) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLogs && activityLogs.length > 0 ? (
              <div className="space-y-3">
                {activityLogs.slice(0, 5).map((log: any, i: number) => (
                  <div key={log.id || i} className="flex items-start gap-3 p-2.5 bg-muted/50 rounded-lg">
                    <div className="h-7 w-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{log.title}</p>
                      {log.description && <p className="text-xs text-muted-foreground truncate">{log.description}</p>}
                      <p className="text-xs text-muted-foreground">{log.created_at ? new Date(log.created_at).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

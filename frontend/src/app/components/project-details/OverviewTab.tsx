import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Ticket,
  CheckCircle,
  Circle,
  UserPlus,
  Users,
  TrendingUp,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

interface OverviewTabProps {
  project: any;
  isSuperadmin: boolean;
  company: any;
  projectAgents: any[];
  projectChatsList: any[];
  onAddMemberClick: () => void;
}

// Placeholder — will be populated from API when real analytics endpoints exist
const ticketTrendData: { day: string; created: number; resolved: number }[] = [];
const chatVolumeData: { hour: string; chats: number }[] = [];

export function OverviewTab({ project, isSuperadmin, company, projectAgents, projectChatsList: _projectChatsList, onAddMemberClick }: OverviewTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Project Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <p className="text-sm text-muted-foreground mt-1">Project ID: {project.id}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <Badge className="bg-green-600">Active</Badge>
                  <div 
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: project.color }}
                  >
                    <div className="w-2 h-2 rounded-full bg-white/80"></div>
                    {project.members} Members
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-muted-foreground">{project.description}</p>
                {isSuperadmin && (
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <a href={project.website} className="text-primary hover:underline">{project.website}</a>
                    </div>
                    {company && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <button
                          className="text-primary hover:underline"
                          onClick={() => navigate(`/superadmin/company/${company.id}`)}
                        >
                          {company.name}
                        </button>
                        <Badge variant="outline" className="ml-1 text-xs">{company.plan}</Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tickets</p>
                    <p className="text-2xl font-bold">{project?.totalTickets ?? 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Tickets</p>
                    <p className="text-2xl font-bold text-primary">{project?.activeTickets ?? 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold">{(project?.totalTickets ?? 0) - (project?.activeTickets ?? 0)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                    <p className="text-2xl font-bold">{project?.members ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Superadmin Charts */}
      {isSuperadmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Trends (This Week)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ticketTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="created" stroke="var(--primary)" name="Created" strokeWidth={2} />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Resolved" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Chat Volume (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chatVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="chats" fill={project.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Process */}
        {(() => {
          const hasMembers = (projectAgents.length > 0) || ((project?.members ?? 0) > 0);
          const hasWidget = !!project?.widget_id;
          const hasTicket = (project?.totalTickets ?? 0) > 0;
          const hasDescription = !!(project?.description?.trim());
          const steps = [
            { label: 'Create your workspace', done: true },
            { label: 'Add workspace description', done: hasDescription },
            { label: 'Invite a team member', done: hasMembers },
            { label: 'Set up chat widget', done: hasWidget },
            { label: 'Create first ticket', done: hasTicket },
            { label: 'Configure AI settings', done: false },
          ];
          const completed = steps.filter(s => s.done).length;
          const pct = Math.round((completed / steps.length) * 100);
          return (
            <Card>
              <CardHeader>
                <CardTitle>Onboarding</CardTitle>
                <p className="text-xs text-muted-foreground">{completed}/{steps.length} steps completed</p>
              </CardHeader>
              <CardContent>
                <div className="w-full h-1.5 bg-muted rounded-full mb-4">
                  <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-2.5">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      {step.done
                        ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className={`text-sm ${step.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Team Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={onAddMemberClick}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {(isSuperadmin ? projectAgents : [...Array(Math.min(5, project?.members || 0))]).length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No team members yet</p>
                <p className="text-xs text-muted-foreground mt-1">Invite agents to collaborate on this workspace</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {isSuperadmin ? (
                  projectAgents.slice(0, 5).map(agent => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/superadmin/agent/${agent.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {(agent.name ?? `${agent.first_name ?? ''} ${agent.last_name ?? ''}`.trim()).split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{agent.name ?? (`${agent.first_name ?? ''} ${agent.last_name ?? ''}`.trim() || agent.email)}</p>
                          <p className="text-xs text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Agent</Badge>
                    </div>
                  ))
                ) : (
                  [...Array(Math.min(5, project?.members || 0))].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {String.fromCharCode(65 + i)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">Team Member {i + 1}</p>
                          <p className="text-xs text-muted-foreground">member{i + 1}@example.com</p>
                        </div>
                      </div>
                      <Badge variant="outline">Agent</Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">Activity will appear here when tickets are created or resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

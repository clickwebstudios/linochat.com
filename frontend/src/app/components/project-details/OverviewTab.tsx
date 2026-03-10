import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Ticket,
  CheckCircle,
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

const ticketTrendData = [
  { day: 'Mon', created: 12, resolved: 9 },
  { day: 'Tue', created: 15, resolved: 13 },
  { day: 'Wed', created: 8, resolved: 11 },
  { day: 'Thu', created: 18, resolved: 14 },
  { day: 'Fri', created: 11, resolved: 10 },
  { day: 'Sat', created: 5, resolved: 6 },
  { day: 'Sun', created: 3, resolved: 4 },
];

const chatVolumeData = [
  { hour: '8am', chats: 12 },
  { hour: '9am', chats: 28 },
  { hour: '10am', chats: 35 },
  { hour: '11am', chats: 42 },
  { hour: '12pm', chats: 31 },
  { hour: '1pm', chats: 38 },
  { hour: '2pm', chats: 45 },
  { hour: '3pm', chats: 39 },
  { hour: '4pm', chats: 28 },
  { hour: '5pm', chats: 18 },
];

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
                    <p className="text-sm text-gray-500 mt-1">Project ID: {project.id}</p>
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
                <p className="text-gray-600">{project.description}</p>
                {isSuperadmin && (
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MessageSquare className="h-4 w-4" />
                      <a href={project.website} className="text-blue-600 hover:underline">{project.website}</a>
                    </div>
                    {company && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <button
                          className="text-blue-600 hover:underline"
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
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Ticket className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Tickets</p>
                    <p className="text-2xl font-bold">{project?.totalTickets ?? 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Tickets</p>
                    <p className="text-2xl font-bold text-blue-600">{project?.activeTickets ?? 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Resolved</p>
                    <p className="text-2xl font-bold">{(project?.totalTickets ?? 0) - (project?.activeTickets ?? 0)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Team Members</p>
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
                  <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" strokeWidth={2} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={onAddMemberClick}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {isSuperadmin ? (
                projectAgents.slice(0, 5).map(agent => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/superadmin/agent/${agent.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {(agent.name ?? `${agent.first_name ?? ''} ${agent.last_name ?? ''}`.trim()).split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{agent.name ?? (`${agent.first_name ?? ''} ${agent.last_name ?? ''}`.trim() || agent.email)}</p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">Agent</Badge>
                  </div>
                ))
              ) : (
                [...Array(Math.min(5, project?.members || 0))].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {String.fromCharCode(65 + i)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Team Member {i + 1}</p>
                        <p className="text-xs text-gray-500">member{i + 1}@example.com</p>
                      </div>
                    </div>
                    <Badge variant="outline">Agent</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">Activity will appear here when tickets are created or resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

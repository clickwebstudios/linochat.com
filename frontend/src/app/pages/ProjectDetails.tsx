import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Archive,
  ArrowLeft,
  Edit,
  Settings,
  Bell,
  LogOut,
  Search,
  Menu,
  ChevronDown,
  Globe,
  Building2,
  ExternalLink,
  FolderKanban,
} from 'lucide-react';
import { mockCompanies, mockAgents, mockChats } from '../data/mockData';
import { SuperadminTopbar } from '../components/superadmin/SuperadminTopbar';
import { useLayout } from '../components/layouts/LayoutContext';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';

// Extracted tab components
import { OverviewTab } from '../components/project-details/OverviewTab';
import { TicketsTab } from '../components/project-details/TicketsTab';
import { ChatsTab } from '../components/project-details/ChatsTab';
import { TeamTab } from '../components/project-details/TeamTab';
import { ActivityTab } from '../components/project-details/ActivityTab';
import { ChatWidgetTab } from '../components/project-details/ChatWidgetTab';
import { AISettingsTab } from '../components/project-details/AISettingsTab';
import { SettingsTab } from '../components/project-details/SettingsTab';

// Extracted dialog components
import { InviteMemberDialog, CreateTicketDialogPD, EditProjectDialog } from '../components/project-details/ProjectDetailsDialogs';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const pathSegments = location.pathname.split('/');
  const basePath = `/${pathSegments[1]}`; // /agent, /admin, or /superadmin
  const isSuperadmin = basePath === '/superadmin';

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load project from API
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }
      
      try {
        const endpoint = isSuperadmin ? `/superadmin/projects/${projectId}` : `/projects/${projectId}`;
        const response = await api.get(endpoint);
        if (response.success) {
          setProject(response.data);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProject();
  }, [projectId]);

  const company = project ? mockCompanies.find(c => c.id === project.company_id) : null;
  
  // Load project agents from API
  const [projectAgents, setProjectAgents] = useState<any[]>([]);
  const [, setLoadingAgents] = useState(false);

  const loadProjectAgents = useCallback(async () => {
    if (!projectId) return;
    setLoadingAgents(true);
    try {
      // Both regular and superadmin use the same agents endpoint (superadmin role is checked server-side)
      const agentsEndpoint = `/projects/${projectId}/agents`;
      const response = await api.get<any[]>(agentsEndpoint);
      if (response.success) {
        setProjectAgents(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load project agents:', error);
      setProjectAgents(project ? mockAgents.filter(a => a.companyId === project.company_id) : []);
    } finally {
      setLoadingAgents(false);
    }
  }, [projectId, project?.company_id]);

  useEffect(() => {
    loadProjectAgents();
  }, [loadProjectAgents]);
  
  const projectChatsList = project ? mockChats.filter(c => c.projectId === project.id) : [];

  const { toggleMobileSidebar } = useLayout();
  const { user, logout } = useAuthStore();
  const [copiedWidgetId, setCopiedWidgetId] = useState(false);

  const widgetId = project?.widget_id || (project ? `widget_lc_${project.id}` : '');

  const handleCopyWidgetId = () => {
    navigator.clipboard.writeText(widgetId);
    setCopiedWidgetId(true);
    setTimeout(() => setCopiedWidgetId(false), 2000);
  };

  // Dialog open states
  const [createTicketDialogOpen, setCreateTicketDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);

  // Ticket form state for CreateTicketDialogPD
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignTo: '',
    customerId: '',
    aiAutoFill: false,
  });

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 p-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Project card skeleton */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="bg-white rounded-xl border">
          <div className="border-b p-4">
            <div className="flex gap-4">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(`${basePath}/projects`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      {isSuperadmin ? (
        <SuperadminTopbar />
      ) : (
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
              <div className="relative w-96 hidden md:block">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Search tickets, chats, customers..." className="pl-10" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 hidden md:inline-flex">
                + New Ticket
              </Button>
              <div className="hidden md:flex items-center gap-3 pl-4 border-l">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role ?? (basePath === '/admin' ? 'Admin' : 'Agent')}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`${basePath}/profile-settings`} className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => { logout(); navigate('/'); }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost"
                size={isSuperadmin ? 'sm' : 'default'}
                onClick={() => {
                  if (isSuperadmin && company) {
                    navigate('/superadmin/companies', {
                      state: { viewingCompanyId: company.id, companyDetailTab: 'projects' },
                    });
                  } else {
                    navigate(`${basePath}/projects`);
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isSuperadmin ? 'Back to Company Projects' : 'Back to Projects'}
              </Button>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>ID: {project.id}</span>
                    {isSuperadmin && company && (
                      <>
                        <span>·</span>
                        <button
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          onClick={() => navigate(`/superadmin/company/${company.id}`)}
                        >
                          <Building2 className="h-3 w-3" />
                          {company.name}
                        </button>
                      </>
                    )}
                    <span>·</span>
                    <a
                      href={project.website || 'https://example.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <Globe className="h-3 w-3" />
                      {project.website || 'https://example.com'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </div>

            <div className="flex gap-2">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setEditProjectDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
              <Button variant="outline">
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="team">Team Members</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="chat-widget">Chat Widget</TabsTrigger>
              <TabsTrigger value="ai-settings">AI Settings</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <OverviewTab
                project={project}
                isSuperadmin={isSuperadmin}
                company={company}
                projectAgents={projectAgents}
                projectChatsList={projectChatsList}
                onAddMemberClick={() => setAddMemberDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="tickets" className="space-y-4">
              <TicketsTab
                basePath={basePath}
                projectId={project?.id}
                onCreateTicketClick={() => setCreateTicketDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="chats" className="space-y-4">
              <ChatsTab basePath={basePath} projectId={project?.id} />
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <TeamTab
                project={project}
                isSuperadmin={isSuperadmin}
                projectAgents={projectAgents}
                onAddMemberClick={() => setAddMemberDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <ActivityTab projectId={projectId || ''} />
            </TabsContent>

            <TabsContent value="chat-widget" className="space-y-4">
              <ChatWidgetTab
                project={project}
                widgetId={widgetId}
                copiedWidgetId={copiedWidgetId}
                onCopyWidgetId={handleCopyWidgetId}
              />
            </TabsContent>

            <TabsContent value="ai-settings" className="space-y-4">
              <AISettingsTab />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <SettingsTab
                project={project}
                onSaved={(updated) => setProject(updated)}
              />
            </TabsContent>
          </Tabs>
        </main>

      {/* Dialogs */}
      <InviteMemberDialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        projectId={projectId}
        onSuccess={loadProjectAgents}
      />

      <CreateTicketDialogPD
        open={createTicketDialogOpen}
        onOpenChange={setCreateTicketDialogOpen}
        newTicket={newTicket}
        setNewTicket={setNewTicket}
      />

      <EditProjectDialog
        open={editProjectDialogOpen}
        onOpenChange={setEditProjectDialogOpen}
        project={project}
      />
    </>
  );
}

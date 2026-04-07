import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ProfileDropdown } from '../components/ProfileDropdown';
import {
  ArrowLeft,
  Bell,
  Search,
  Menu,
  Globe,
  Building2,
  ExternalLink,
  FolderKanban,
} from 'lucide-react';
// Mock data removed — all data from API
import { SuperadminTopbar } from '../components/superadmin/SuperadminTopbar';
import { useLayout } from '../components/layouts/LayoutContext';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';

// Extracted tab components
import { OverviewTab } from '../components/project-details/OverviewTab';
import { TicketsTab } from '../components/project-details/TicketsTab';
import { TeamTab } from '../components/project-details/TeamTab';
import { ActivityTab } from '../components/project-details/ActivityTab';
import { ChatWidgetTab } from '../components/project-details/ChatWidgetTab';
import { AISettingsTab } from '../components/project-details/AISettingsTab';
import { PopoversTab } from '../components/project-details/PopoversTab';
import { SettingsTab } from '../components/project-details/SettingsTab';
import { IntegrationsTab } from '../components/project-details/IntegrationsTab';

// Extracted dialog components
import { InviteMemberDialog, CreateTicketDialogPD } from '../components/project-details/ProjectDetailsDialogs';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const pathSegments = location.pathname.split('/');
  const basePath = `/${pathSegments[1]}`; // /agent, /admin, or /superadmin
  const isSuperadmin = basePath === '/superadmin';

  const [project, setProject] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

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

  const company = null; // Company data loaded separately if needed
  
  // Load project agents from API
  const [projectAgents, setProjectAgents] = useState<any[]>([]);
  const [, setLoadingAgents] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

  const loadProjectAgents = useCallback(async () => {
    if (!projectId) return;
    setLoadingAgents(true);
    try {
      const agentsEndpoint = `/projects/${projectId}/agents`;
      const response = await api.get<any[]>(agentsEndpoint);
      if (response.success) {
        setProjectAgents(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load project agents:', error);
      setProjectAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }, [projectId, project?.company_id]);

  const loadInvitations = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await api.get<any[]>(`/projects/${projectId}/invitations`);
      setPendingInvitations((response as any)?.data ?? []);
    } catch {
      setPendingInvitations([]);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectAgents();
    loadInvitations();
  }, [loadProjectAgents, loadInvitations]);
  
  const projectChatsList: any[] = []; // Chats loaded via API in chat components

  const { toggleMobileSidebar } = useLayout();
  const { user } = useAuthStore();
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
      <div className="flex-1 bg-muted/50 p-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
          <div className="flex-1">
            <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Project card skeleton */}
        <div className="bg-card rounded-xl border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-muted rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-96 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="bg-card rounded-xl border">
          <div className="border-b p-4">
            <div className="flex gap-4">
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(`${basePath}/projects`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      {isSuperadmin ? (
        <header className="bg-card border-b px-6 sticky top-0 z-50">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/superadmin/companies')} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="h-5 w-px bg-border" />
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Platform Management</span>
              <Badge variant="outline" className="text-xs">Superadmin</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium">{user ? `${user.first_name} ${user.last_name}` : 'Admin'}</div>
              </div>
              <Avatar>
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` : 'AD'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
      ) : (
        <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
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
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tickets, chats, customers..." className="pl-10" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
              </Button>
              <Button className="bg-primary hover:bg-primary/90 hidden md:inline-flex">
                + New Ticket
              </Button>
              <div className="hidden md:flex items-center gap-3 pl-4 border-l">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card"></span>
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                  </div>
                  <div className="text-xs">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {user?.company_plan ?? 'Free'}
                    </span>
                  </div>
                </div>
                <ProfileDropdown basePath={basePath} isSuperadmin={isSuperadmin} />
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-6 ${isSuperadmin ? '' : 'overflow-y-auto'}`}>
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
                {isSuperadmin ? 'Back to Company Workspaces' : 'Back to Workspaces'}
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>ID: {project.id}</span>
                    {isSuperadmin && company && (
                      <>
                        <span>·</span>
                        <button
                          className="flex items-center gap-1 hover:text-primary transition-colors"
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
                      className="flex items-center gap-1 hover:text-primary transition-colors"
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

          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className={`bg-card -mx-6 px-6 pb-0 ${isSuperadmin ? 'sticky top-14 z-40 border-b' : ''}`}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="chat-widget">Chat Widget</TabsTrigger>
                <TabsTrigger value="popovers">Popovers</TabsTrigger>
<TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="ai-settings">AI Settings</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <OverviewTab
                project={project}
                isSuperadmin={isSuperadmin}
                company={company}
                projectAgents={projectAgents}
                projectChatsList={projectChatsList}
                onAddMemberClick={() => setAddMemberDialogOpen(true)}
                onNavigateToTab={setActiveTab}
              />
            </TabsContent>

            <TabsContent value="tickets" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <TicketsTab
                basePath={basePath}
                projectId={project?.id}
                onCreateTicketClick={() => setCreateTicketDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="team" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <TeamTab
                project={project}
                isSuperadmin={isSuperadmin}
                projectAgents={projectAgents}
                pendingInvitations={pendingInvitations}
                onAddMemberClick={() => setAddMemberDialogOpen(true)}
                onInvitationsChange={loadInvitations}
              />
            </TabsContent>

            <TabsContent value="activity" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <ActivityTab projectId={projectId || ''} />
            </TabsContent>

            <TabsContent value="chat-widget" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <ChatWidgetTab
                project={project}
                widgetId={widgetId}
                copiedWidgetId={copiedWidgetId}
                onCopyWidgetId={handleCopyWidgetId}
              />
            </TabsContent>

            <TabsContent value="popovers" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <PopoversTab projectId={projectId} />
            </TabsContent>

            <TabsContent value="ai-settings" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <AISettingsTab projectId={projectId} />
            </TabsContent>

            <TabsContent value="settings" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <SettingsTab
                project={project}
                onSaved={(updated) => setProject(updated)}
              />
            </TabsContent>

            <TabsContent value="integrations" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <IntegrationsTab project={project} />
            </TabsContent>
          </Tabs>
        </main>

      {/* Dialogs */}
      <InviteMemberDialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        projectId={projectId}
        onSuccess={() => { loadProjectAgents(); loadInvitations(); }}
      />

      <CreateTicketDialogPD
        open={createTicketDialogOpen}
        onOpenChange={setCreateTicketDialogOpen}
        newTicket={newTicket}
        setNewTicket={setNewTicket}
      />

    </div>
  );
}

import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import {
  Edit,
  Building2,
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Archive,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';
import { useState, useEffect } from 'react';
import { CompanyOverviewTab } from './CompanyOverviewTab';
import { CompanyProjectsTab } from './CompanyProjectsTab';
import { CompanyPlanTab } from './CompanyPlanTab';
import { CompanyDataTabs } from './CompanyDataTabs';
import { CompanyTeamTab } from './CompanyTeamTab';
import { CompanyDialogs } from './CompanyDialogs';

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

interface Chat {
  id: string;
  customer: string;
  avatar: string;
  preview: string;
  agent: string;
  status: string;
  time: string;
  unread: number;
  isAIBot?: boolean;
  projectId: string;
}

interface Ticket {
  id: string;
  subject: string;
  customer: string;
  priority: string;
  status: string;
  assignedTo: string;
  created: string;
  projectId: string;
}

interface CompanyDetailViewProps {
  viewingCompanyId: string;
  companyDetailTab: string;
  setCompanyDetailTab: (tab: string) => void;
  setViewingCompanyId: (id: string | null) => void;
}

export function CompanyDetailView({
  viewingCompanyId,
  companyDetailTab,
  setCompanyDetailTab,
  setViewingCompanyId,
}: CompanyDetailViewProps) {
  // State for API data
  const [company, setCompany] = useState<Company | null>(null);
  const [companyProjects, setCompanyProjects] = useState<Project[]>([]);
  const [companyAgents, setCompanyAgents] = useState<Agent[]>([]);
  const [companyChats, setCompanyChats] = useState<Chat[]>([]);
  const [companyTickets, setCompanyTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invitedMembers, setInvitedMembers] = useState<
    { id: string; name: string; email: string; role: 'Admin' | 'Agent' }[]
  >([]);

  // Fetch company data when viewingCompanyId changes
  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const companyResponse = await api.get<Company>(`/superadmin/companies/${viewingCompanyId}`);
        setCompany(companyResponse.data);

        try {
          const chatsResponse = await api.get<{ success: boolean; data: Chat[] }>(`/superadmin/companies/${viewingCompanyId}/chats`);
          setCompanyChats(Array.isArray(chatsResponse.data) ? chatsResponse.data : []);
        } catch {
          setCompanyChats([]);
        }

        try {
          const projectsResponse = await api.get<Project[]>(`/superadmin/companies/${viewingCompanyId}/projects`);
          setCompanyProjects(projectsResponse.data || []);
        } catch {
          setCompanyProjects([]);
        }

        try {
          const agentsResponse = await api.get<Agent[]>(`/superadmin/companies/${viewingCompanyId}/agents`);
          setCompanyAgents(agentsResponse.data || []);
        } catch {
          setCompanyAgents([]);
        }

        try {
          const ticketsResponse = await api.get<Ticket[]>(`/superadmin/companies/${viewingCompanyId}/tickets`);
          setCompanyTickets(ticketsResponse.data || []);
        } catch {
          setCompanyTickets([]);
        }

        try {
          const invitationsResponse = await api.get(`/superadmin/companies/${viewingCompanyId}/invitations`);
          const invs = invitationsResponse.data || [];
          setInvitedMembers(
            Array.isArray(invs)
              ? invs.map((i: { id: string; name: string; email: string; role: string }) => ({
                  id: i.id,
                  name: i.name || i.email,
                  email: i.email,
                  role: (i.role === 'Admin' ? 'Admin' : 'Agent') as 'Admin' | 'Agent',
                }))
              : []
          );
        } catch {
          setInvitedMembers([]);
        }
      } catch (err) {
        setError('Failed to load company data. Please try again.');
        console.error('Error fetching company data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (viewingCompanyId) {
      fetchCompanyData();
    }
  }, [viewingCompanyId]);

  // Calculate total tickets from projects
  const totalTickets = companyProjects.reduce((sum, p) => sum + (p.tickets || 0), 0);

  // Company colors mapping
  const companyColors: Record<string, string> = {
    'comp-1': '#3B82F6',
    'comp-2': '#8B5CF6',
    'comp-3': '#10B981',
  };

  // Default meta data
  const defaultMeta = {
    email: company?.email || 'admin@company.com',
    location: company?.location || 'Unknown Location',
    joined: company?.joined || 'N/A',
    mrr: company?.mrr || '$0',
    status: company?.status || 'Active',
    usage: company?.usage || 50,
  };

  // Edit company state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [editedCompanyName, setEditedCompanyName] = useState(company?.name || '');
  const [editedEmail, setEditedEmail] = useState(defaultMeta.email);
  const [editedLocation, setEditedLocation] = useState(defaultMeta.location);
  const [editedStatus, setEditedStatus] = useState(defaultMeta.status);

  // Update edited values when company data changes
  useEffect(() => {
    if (company) {
      setEditedCompanyName(company.name);
      setEditedEmail(company.email || defaultMeta.email);
      setEditedLocation(company.location || defaultMeta.location);
      setEditedStatus(company.status || defaultMeta.status);
    }
  }, [company]);

  // Temp edit state (for dialog form before saving)
  const [tempName, setTempName] = useState(company?.name || '');
  const [tempEmail, setTempEmail] = useState(defaultMeta.email);
  const [tempLocation, setTempLocation] = useState(defaultMeta.location);
  const [tempStatus, setTempStatus] = useState(defaultMeta.status);

  // Update temp values when edit dialog opens
  useEffect(() => {
    setTempName(editedCompanyName);
    setTempEmail(editedEmail);
    setTempLocation(editedLocation);
    setTempStatus(editedStatus);
  }, [editDialogOpen, editedCompanyName, editedEmail, editedLocation, editedStatus]);

  const handleOpenEditDialog = () => {
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/superadmin/companies/${viewingCompanyId}`, {
        name: tempName,
        email: tempEmail,
        location: tempLocation,
        status: tempStatus,
      });
      setEditedCompanyName(tempName);
      setEditedEmail(tempEmail);
      setEditedLocation(tempLocation);
      setEditedStatus(tempStatus);
      setCompany((prev) => prev ? { ...prev, name: tempName, email: tempEmail, location: tempLocation, status: tempStatus } : null);
      setEditDialogOpen(false);
    } catch (err) {
      console.error('Failed to update company:', err);
    }
  };

  const handleDeleteCompany = async () => {
    try {
      await api.delete(`/superadmin/companies/${viewingCompanyId}`);
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');
      setViewingCompanyId(null);
    } catch (err) {
      console.error('Failed to delete company:', err);
    }
  };

  // Archive company state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [isArchived, setIsArchived] = useState(false);

  const handleArchiveCompany = async () => {
    try {
      await api.put(`/superadmin/companies/${viewingCompanyId}`, { status: 'Archived' });
      setIsArchived(true);
      setEditedStatus('Archived');
      setCompany((prev) => prev ? { ...prev, status: 'Archived' } : null);
      setArchiveDialogOpen(false);
      setArchiveReason('');
    } catch (err) {
      console.error('Failed to archive company:', err);
    }
  };

  const handleRestoreCompany = async () => {
    try {
      await api.put(`/superadmin/companies/${viewingCompanyId}`, { status: 'Active' });
      setIsArchived(false);
      setEditedStatus('Active');
      setCompany((prev) => prev ? { ...prev, status: 'Active' } : null);
    } catch (err) {
      console.error('Failed to restore company:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading company data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !company) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-gray-700">{error || 'Company not found'}</p>
          <Button variant="outline" onClick={() => setViewingCompanyId(null)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setViewingCompanyId(null)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Button>
      </div>

      {/* Company Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="h-14 w-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: company.color || companyColors[company.id] || '#3B82F6' }}
              >
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{editedCompanyName}</h2>
                  <Badge
                    variant="outline"
                    className={
                      company.plan === 'Enterprise'
                        ? 'border-purple-600 text-purple-600'
                        : company.plan === 'Pro'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-gray-600 text-gray-600'
                    }
                  >
                    {company.plan}
                  </Badge>
                  <Badge className={editedStatus === 'Active' ? 'bg-green-100 text-green-700' : editedStatus === 'Suspended' ? 'bg-red-100 text-red-700' : editedStatus === 'Archived' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}>{editedStatus}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{editedEmail}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{editedLocation}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {defaultMeta.joined}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenEditDialog} disabled={isArchived}>
                <Edit className="h-4 w-4 mr-1.5" />Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveDialogOpen(true)}
                disabled={isArchived}
                className={isArchived ? 'opacity-50 cursor-not-allowed' : ''}
                title={isArchived ? 'Company is already archived' : 'Archive company'}
              >
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archived Banner */}
      {isArchived && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <Archive className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">This company has been archived</p>
            <p className="text-xs text-amber-700 mt-0.5">
              All projects, chats, tickets, and team operations are frozen. New projects, invitations, and plan changes are disabled. Data is preserved in read-only mode.
            </p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100" onClick={handleRestoreCompany}>
            Restore Company
          </Button>
        </div>
      )}

      {/* Company Detail Tabs */}
      <Tabs value={companyDetailTab} onValueChange={setCompanyDetailTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="kb">KB</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CompanyOverviewTab
            company={company}
            companyProjects={companyProjects}
            companyAgents={companyAgents}
            totalTickets={totalTickets}
            defaultMeta={defaultMeta}
            isArchived={isArchived}
            setCompanyDetailTab={setCompanyDetailTab}
          />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <CompanyProjectsTab
            companyProjects={companyProjects}
            viewingCompanyId={viewingCompanyId}
            isArchived={isArchived}
            onProjectAdded={(newProject) => {
              setCompanyProjects((prev) => [
                ...prev,
                {
                  id: String(newProject.id),
                  name: newProject.name,
                  color: newProject.color ?? '#4F46E5',
                  description: newProject.description ?? '',
                  website: newProject.website ?? '',
                  tickets: 0,
                  totalTickets: 0,
                  activeTickets: 0,
                  members: 0,
                  companyId: viewingCompanyId,
                  status: newProject.status ?? 'active',
                },
              ]);
            }}
          />
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <CompanyDataTabs
            tab="agents"
            companyChats={companyChats}
            companyTickets={companyTickets}
            companyAgents={companyAgents}
            companyProjects={companyProjects}
            company={company}
            viewingCompanyId={viewingCompanyId}
            isArchived={isArchived}
            defaultMeta={defaultMeta}
          />
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <CompanyPlanTab
            company={company}
            editedCompanyName={editedCompanyName}
            companyAgentsCount={companyAgents.length}
            companyProjectsCount={companyProjects.length}
            totalTickets={totalTickets}
            defaultMeta={defaultMeta}
            isArchived={isArchived}
          />
        </TabsContent>

        <TabsContent value="chats" className="mt-6">
          <CompanyDataTabs
            tab="chats"
            companyChats={companyChats}
            companyTickets={companyTickets}
            companyAgents={companyAgents}
            companyProjects={companyProjects}
            company={company}
            viewingCompanyId={viewingCompanyId}
            isArchived={isArchived}
            defaultMeta={defaultMeta}
          />
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <CompanyDataTabs
            tab="tickets"
            companyChats={companyChats}
            companyTickets={companyTickets}
            companyAgents={companyAgents}
            companyProjects={companyProjects}
            company={company}
            viewingCompanyId={viewingCompanyId}
            isArchived={isArchived}
            defaultMeta={defaultMeta}
          />
        </TabsContent>

        <TabsContent value="kb" className="mt-6">
          <CompanyDataTabs
            tab="kb"
            companyChats={companyChats}
            companyTickets={companyTickets}
            companyAgents={companyAgents}
            companyProjects={companyProjects}
            company={company}
            viewingCompanyId={viewingCompanyId}
            isArchived={isArchived}
            defaultMeta={defaultMeta}
          />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <CompanyTeamTab
            companyAgents={companyAgents}
            editedCompanyName={editedCompanyName}
            editedEmail={editedEmail}
            viewingCompanyId={viewingCompanyId}
            isArchived={isArchived}
            invitedMembers={invitedMembers}
            setInvitedMembers={setInvitedMembers}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <CompanyDataTabs
            tab="transactions"
            companyChats={companyChats}
            companyTickets={companyTickets}
            companyAgents={companyAgents}
            companyProjects={companyProjects}
            company={company}
            viewingCompanyId={viewingCompanyId}
            isArchived={isArchived}
            defaultMeta={defaultMeta}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <CompanyDataTabs
            tab="history"
            companyChats={companyChats}
            companyTickets={companyTickets}
            companyAgents={companyAgents}
            companyProjects={companyProjects}
            company={company}
            viewingCompanyId={viewingCompanyId}
            isArchived={isArchived}
            defaultMeta={defaultMeta}
          />
        </TabsContent>
      </Tabs>

      <CompanyDialogs
        editedCompanyName={editedCompanyName}
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        tempName={tempName}
        setTempName={setTempName}
        tempEmail={tempEmail}
        setTempEmail={setTempEmail}
        tempLocation={tempLocation}
        setTempLocation={setTempLocation}
        tempStatus={tempStatus}
        setTempStatus={setTempStatus}
        handleSaveEdit={handleSaveEdit}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        deleteConfirmText={deleteConfirmText}
        setDeleteConfirmText={setDeleteConfirmText}
        handleDeleteCompany={handleDeleteCompany}
        archiveDialogOpen={archiveDialogOpen}
        setArchiveDialogOpen={setArchiveDialogOpen}
        archiveReason={archiveReason}
        setArchiveReason={setArchiveReason}
        handleArchiveCompany={handleArchiveCompany}
      />
    </div>
  );
}

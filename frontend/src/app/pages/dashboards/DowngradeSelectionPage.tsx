import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Users, Folder, ArrowRight, ArrowLeft, Loader2, Info, Lock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { billingService } from '../../services/billing';
import { api } from '../../api/client';
import { toast } from 'sonner';

const FREE_AGENT_LIMIT = 1;
const FREE_PROJECT_LIMIT = 1;

interface Agent {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar_url?: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

const STEPS = ['agents', 'projects', 'confirm'] as const;
type Step = typeof STEPS[number];

export default function DowngradeSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/agent';

  const [step, setStep] = useState<Step>('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [adminUsers, setAdminUsers] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/agent/users').then(r => r.data?.data ?? r.data ?? []).catch(() => []),
      api.get('/projects').then(r => r.data?.data ?? r.data ?? []).catch(() => []),
    ]).then(([agentData, projectData]) => {
      const allUsers = Array.isArray(agentData) ? agentData : [];
      const admins = allUsers.filter(
        (a: Agent) => a.status !== 'Deactivated' && a.status !== 'Invited' && a.role === 'admin'
      );
      const activeAgents = allUsers.filter(
        (a: Agent) => a.status !== 'Deactivated' && a.status !== 'Invited' && a.role !== 'admin'
      );
      setAdminUsers(admins);
      setAgents(activeAgents);
      setSelectedAgentIds(activeAgents.slice(0, FREE_AGENT_LIMIT).map((a: Agent) => a.id));

      const activeProjects = Array.isArray(projectData) ? projectData : [];
      setProjects(activeProjects);
      setSelectedProjectIds(activeProjects.slice(0, FREE_PROJECT_LIMIT).map((p: Project) => p.id));
    }).finally(() => setLoading(false));
  }, []);

  const toggleAgent = (id: number) => {
    setSelectedAgentIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= FREE_AGENT_LIMIT) return [id]; // replace if at limit
      return [...prev, id];
    });
  };

  const toggleProject = (id: number) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= FREE_PROJECT_LIMIT) return [id]; // replace if at limit
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    if (agents.length > 0 && selectedAgentIds.length === 0) {
      toast.error('Please select at least one agent to keep.');
      return;
    }
    if (projects.length > 0 && selectedProjectIds.length === 0) {
      toast.error('Please select at least one workspace to keep.');
      return;
    }
    setSubmitting(true);
    try {
      await billingService.saveDowngradeSelection({
        keep_agent_ids: selectedAgentIds,
        keep_project_ids: selectedProjectIds,
      });
      toast.success('Downgrade selection saved', {
        description: 'Your selections will be applied when your subscription expires.',
      });
      navigate(`${basePath}/billing`);
    } catch {
      toast.error('Failed to save selection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Choose What to Keep</h1>
        <p className="text-muted-foreground mt-1">
          Your subscription is cancelled. Select which items to keep within the Free plan limits before expiry.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['Agents', 'Workspaces', 'Confirm'] as const).map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              i < stepIndex ? 'bg-primary text-primary-foreground' :
              i === stepIndex ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i === stepIndex ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
            {i < 2 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* Step: Agents */}
      {step === 'agents' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Select Agents to Keep
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Free plan allows <strong>{FREE_AGENT_LIMIT} agent</strong>. Select which agent to keep active.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Admin users are always kept */}
            {adminUsers.map(admin => (
              <div key={admin.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{admin.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">Owner · Always kept</Badge>
              </div>
            ))}
            {agents.length === 0 ? (
              adminUsers.length === 0
                ? <p className="text-sm text-muted-foreground py-4 text-center">No agents found.</p>
                : <p className="text-sm text-muted-foreground py-2 text-center text-xs">No additional agents to select.</p>
            ) : (
              agents.map(agent => {
                const isSelected = selectedAgentIds.includes(agent.id);
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => toggleAgent(agent.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{agent.role}</Badge>
                  </button>
                );
              })
            )}
            {agents.length > FREE_AGENT_LIMIT && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-3">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  {agents.length - FREE_AGENT_LIMIT} agent{agents.length - FREE_AGENT_LIMIT > 1 ? 's' : ''} will be deactivated when your subscription expires. They can be reactivated by resubscribing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Projects */}
      {step === 'projects' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Folder className="h-4 w-4" />
              Select Workspace to Keep
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Free plan allows <strong>{FREE_PROJECT_LIMIT} workspace</strong>. Select which workspace to keep active.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No workspaces found.</p>
            ) : (
              projects.map(project => {
                const isSelected = selectedProjectIds.includes(project.id);
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => toggleProject(project.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
            {projects.length > FREE_PROJECT_LIMIT && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-3">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  {projects.length - FREE_PROJECT_LIMIT} workspace{projects.length - FREE_PROJECT_LIMIT > 1 ? 's' : ''} will be deactivated when your subscription expires.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Confirm Your Selection
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Review your choices. These will be applied when your subscription expires.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Keeping {selectedAgentIds.length + adminUsers.length} agent{(selectedAgentIds.length + adminUsers.length) !== 1 ? 's' : ''}:</p>
              {adminUsers.map(a => (
                <div key={a.id} className="flex items-center gap-2 text-sm text-muted-foreground pl-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {a.name} <span className="text-xs">(owner)</span>
                </div>
              ))}
              {agents.filter(a => selectedAgentIds.includes(a.id)).map(a => (
                <div key={a.id} className="flex items-center gap-2 text-sm text-muted-foreground pl-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  {a.name}
                </div>
              ))}
              {agents.filter(a => !selectedAgentIds.includes(a.id)).length > 0 && (
                <p className="text-xs text-muted-foreground pl-2 pt-1">
                  {agents.filter(a => !selectedAgentIds.includes(a.id)).length} agent{agents.filter(a => !selectedAgentIds.includes(a.id)).length !== 1 ? 's' : ''} will be deactivated
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Keeping {selectedProjectIds.length} workspace{selectedProjectIds.length !== 1 ? 's' : ''}:</p>
              {projects.filter(p => selectedProjectIds.includes(p.id)).map(p => (
                <div key={p.id} className="flex items-center gap-2 text-sm text-muted-foreground pl-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  {p.name}
                </div>
              ))}
              {projects.filter(p => !selectedProjectIds.includes(p.id)).length > 0 && (
                <p className="text-xs text-muted-foreground pl-2 pt-1">
                  {projects.filter(p => !selectedProjectIds.includes(p.id)).length} workspace{projects.filter(p => !selectedProjectIds.includes(p.id)).length !== 1 ? 's' : ''} will be deactivated
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => {
            if (stepIndex === 0) navigate(`${basePath}/billing`);
            else setStep(STEPS[stepIndex - 1]);
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {stepIndex === 0 ? 'Back to Billing' : 'Back'}
        </Button>
        {step !== 'confirm' ? (
          <Button onClick={() => setStep(STEPS[stepIndex + 1])}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Selection'}
          </Button>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Plug, ExternalLink, CheckCircle2, Loader2, Unplug, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

function FrubixLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#6366F1" />
      <text x="16" y="22" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="system-ui">F</text>
    </svg>
  );
}

interface FrubixIntegration {
  enabled?: boolean;
  url?: string;
  connected_at?: string;
}

interface Project {
  id: string;
  name: string;
}

const comingSoonIntegrations = [
  { name: 'Slack', icon: '\u{1F4AC}' },
  { name: 'Salesforce', icon: '\u{2601}\u{FE0F}' },
  { name: 'Zapier', icon: '\u{26A1}' },
  { name: 'Jira', icon: '\u{1F4CB}' },
  { name: 'HubSpot', icon: '\u{1F536}' },
  { name: 'GitHub', icon: '\u{1F431}' },
  { name: 'Stripe', icon: '\u{1F4B3}' },
  { name: 'Zendesk', icon: '\u{1F3AB}' },
];

export function IntegrationsView() {
  const storeProject = useAuthStore((s) => s.project);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(storeProject?.id ?? null);
  const [frubix, setFrubix] = useState<FrubixIntegration | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const isConnected = frubix?.enabled === true;

  // Fetch all projects for the selector
  useEffect(() => {
    api.get<any[]>('/projects')
      .then((res) => {
        const list: Project[] = ((res as any)?.data ?? []).map((p: any) => ({ id: String(p.id), name: p.name }));
        setProjects(list);
        if (!projectId && list.length > 0) {
          setProjectId(String(list[0].id));
        }
      })
      .catch(() => {});
  }, []);

  // Load integration settings
  useEffect(() => {
    if (!projectId) return;
    api.get<Record<string, any>>(`/projects/${projectId}/integrations`)
      .then((res) => {
        setFrubix((res.data as any)?.frubix ?? null);
      })
      .catch(() => {});
  }, [projectId]);

  // Listen for OAuth callback message from popup
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'frubix-oauth-callback') {
      if (event.data.success) {
        setFrubix({ enabled: true, connected_at: new Date().toISOString() });
        toast.success('Frubix connected successfully!');
      } else {
        toast.error(event.data.error || 'Failed to connect Frubix');
      }
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const handleConnect = async () => {
    if (!projectId) return;
    setConnecting(true);

    try {
      const res = await api.get<{ url: string }>(`/projects/${projectId}/integrations/frubix/authorize`);
      const authorizeUrl = (res.data as any)?.url;

      if (!authorizeUrl) {
        toast.error('Could not get Frubix authorization URL');
        setConnecting(false);
        return;
      }

      // Open popup for Frubix login + consent
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        authorizeUrl,
        'frubix-oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`,
      );

      // Timeout after 5 minutes
      setTimeout(() => {
        setConnecting(false);
      }, 300000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate Frubix connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!projectId) return;
    setDisconnecting(true);
    try {
      await api.delete(`/projects/${projectId}/integrations/frubix`);
      setFrubix(null);
      toast.success('Frubix disconnected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Connect LinoChat with your favorite tools and services.</p>
        </div>
        {projects.length > 1 && (
          <div className="relative">
            <select
              value={projectId ?? ''}
              onChange={(e) => { setProjectId(e.target.value); setFrubix(null); }}
              className="appearance-none bg-card border border-border rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-foreground cursor-pointer hover:border-border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {/* Frubix Integration */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          {isConnected ? 'Active' : 'Available'}
        </h3>
        <Card className={`border shadow-sm ${isConnected ? 'border-green-200 bg-green-50/30' : 'border-border'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FrubixLogo className="h-12 w-12" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">Frubix</h3>
                    {isConnected ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not connected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Automatically create leads in Frubix when tickets are created in LinoChat.
                  </p>
                  {isConnected && frubix?.connected_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Connected {new Date(frubix.connected_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected && (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://frubix.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Frubix
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                    >
                      {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4 mr-2" />}
                      Disconnect
                    </Button>
                  </>
                )}
                {!isConnected && (
                  <Button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Waiting for authorization...
                      </>
                    ) : (
                      <>
                        <Plug className="h-4 w-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Coming Soon</h3>
        <div className="grid grid-cols-4 gap-4">
          {comingSoonIntegrations.map((integration) => (
            <div
              key={integration.name}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border bg-muted/50 opacity-60"
            >
              <span className="text-2xl">{integration.icon}</span>
              <span className="text-xs text-muted-foreground">{integration.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

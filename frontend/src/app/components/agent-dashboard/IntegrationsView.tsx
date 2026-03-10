import { useState, useEffect } from 'react';
import { Plug, ExternalLink, CheckCircle2, Settings, Loader2, Unplug, Mail, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
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

interface FrubixSettings {
  enabled?: boolean;
  url?: string;
  email?: string;
  password?: string;
  connected_at?: string;
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
  const project = useAuthStore((s) => s.project);
  const [frubix, setFrubix] = useState<FrubixSettings | null>(null);
  const [, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [formUrl, setFormUrl] = useState('https://frubix.com');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const isConnected = frubix?.enabled === true;

  useEffect(() => {
    if (!project?.id) return;
    setLoading(true);
    api.get<Record<string, any>>(`/projects/${project.id}/integrations`)
      .then((res) => {
        setFrubix((res.data as any)?.frubix ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [project?.id]);

  const handleConnect = async () => {
    if (!project?.id || !formEmail || !formPassword) return;
    setSaving(true);
    try {
      const res = await api.put<any>(`/projects/${project.id}/integrations/frubix`, {
        url: formUrl,
        email: formEmail,
        password: formPassword,
      });
      setFrubix({ enabled: true, ...((res as any).data ?? {}) });
      setShowDialog(false);
      toast.success('Frubix connected successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect to Frubix');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!project?.id) return;
    setDisconnecting(true);
    try {
      await api.delete(`/projects/${project.id}/integrations/frubix`);
      setFrubix(null);
      toast.success('Frubix disconnected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const openConnectDialog = () => {
    setFormUrl(frubix?.url || 'https://frubix.com');
    setFormEmail(frubix?.email || '');
    setFormPassword('');
    setShowDialog(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Integrations</h2>
        <p className="text-gray-500 mt-1">Connect LinoChat with your favorite tools and services.</p>
      </div>

      {/* Frubix Integration */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          {isConnected ? 'Active' : 'Available'}
        </h3>
        <Card className={`border shadow-sm ${isConnected ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FrubixLogo className="h-12 w-12" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">Frubix</h3>
                    {isConnected ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not connected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Automatically create leads in Frubix when tickets are created in LinoChat.
                  </p>
                  {isConnected && frubix?.connected_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Connected {new Date(frubix.connected_at).toLocaleDateString()}
                      {frubix.email && ` as ${frubix.email}`}
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
                    <Button variant="outline" size="sm" onClick={openConnectDialog}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
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
                  <Button onClick={openConnectDialog} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plug className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Coming Soon</h3>
        <div className="grid grid-cols-4 gap-4">
          {comingSoonIntegrations.map((integration) => (
            <div
              key={integration.name}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 opacity-60"
            >
              <span className="text-2xl">{integration.icon}</span>
              <span className="text-xs text-gray-500">{integration.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connect Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FrubixLogo className="h-6 w-6" />
              {isConnected ? 'Frubix Settings' : 'Connect Frubix'}
            </DialogTitle>
            <DialogDescription>
              Enter your Frubix account credentials. Leads will be created automatically when new tickets are submitted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Frubix URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://frubix.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleConnect}
              disabled={saving || !formEmail || !formPassword}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? 'Connecting...' : isConnected ? 'Update' : 'Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

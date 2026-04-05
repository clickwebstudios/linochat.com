import { useState, useEffect, useCallback } from 'react';
import { Plug, ExternalLink, CheckCircle2, Loader2, Unplug, ChevronDown, MessageSquare, Copy, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import type { FrubixIntegration } from '../../types/frubix';
import { channelService } from '../../services/channelService';
import type { MessengerStatus, WhatsAppSandboxStatus } from '../../services/channelService';

function FrubixLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#6366F1" />
      <text x="16" y="22" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="system-ui">F</text>
    </svg>
  );
}

interface Project {
  id: string;
  name: string;
}


export function IntegrationsView() {
  const storeProject = useAuthStore((s) => s.project);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(storeProject?.id ?? null);
  const [frubix, setFrubix] = useState<FrubixIntegration | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const isConnected = frubix?.enabled === true;

  // Messenger state
  const [messengerStatus, setMessengerStatus] = useState<MessengerStatus | null>(null);
  const [messengerLoading, setMessengerLoading] = useState(false);
  const [messengerConnecting, setMessengerConnecting] = useState(false);
  const [messengerDisconnecting, setMessengerDisconnecting] = useState(false);
  const [messengerPageId, setMessengerPageId] = useState('');
  const [messengerPageName, setMessengerPageName] = useState('');
  const [messengerToken, setMessengerToken] = useState('');
  const [messengerConfirm, setMessengerConfirm] = useState(false);

  // WhatsApp sandbox state
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppSandboxStatus | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappEnabling, setWhatsappEnabling] = useState(false);

  // Email channel state
  interface EmailChannelStatus {
    connected: boolean;
    support_email: string | null;
    from_name: string | null;
    inbound_address: string | null;
    connected_at: string | null;
  }
  const [emailStatus, setEmailStatus] = useState<EmailChannelStatus | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [emailConnecting, setEmailConnecting] = useState(false);
  const [emailDisconnecting, setEmailDisconnecting] = useState(false);
  const [emailConfirm, setEmailConfirm] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);

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
    loadEmailStatus(projectId);
  }, [projectId, loadEmailStatus]);

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

  // Load Messenger status
  useEffect(() => {
    setMessengerLoading(true);
    channelService.getMessengerStatus()
      .then((res) => { if (res.success) setMessengerStatus(res.data); })
      .catch(() => {})
      .finally(() => setMessengerLoading(false));
  }, []);

  const handleMessengerConnect = async () => {
    if (!messengerPageId.trim() || !messengerPageName.trim() || !messengerToken.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setMessengerConnecting(true);
    try {
      const res = await channelService.connectMessenger({
        page_id: messengerPageId.trim(),
        page_name: messengerPageName.trim(),
        page_access_token: messengerToken.trim(),
      });
      if (res.success) {
        setMessengerStatus({ connected: true, page_id: messengerPageId.trim(), has_twilio: messengerStatus?.has_twilio ?? false });
        setMessengerPageId('');
        setMessengerPageName('');
        setMessengerToken('');
        toast.success('Messenger connected successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect Messenger');
    } finally {
      setMessengerConnecting(false);
    }
  };

  const handleMessengerDisconnect = async () => {
    setMessengerDisconnecting(true);
    try {
      const res = await channelService.disconnectMessenger();
      if (res.success) {
        setMessengerStatus({ connected: false, page_id: null, has_twilio: messengerStatus?.has_twilio ?? false });
        setMessengerConfirm(false);
        toast.success('Messenger disconnected');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect Messenger');
    } finally {
      setMessengerDisconnecting(false);
    }
  };

  // Load WhatsApp sandbox status
  useEffect(() => {
    setWhatsappLoading(true);
    channelService.getWhatsAppSandboxStatus()
      .then((res) => { if (res.success) setWhatsappStatus(res.data); })
      .catch(() => {})
      .finally(() => setWhatsappLoading(false));
  }, []);

  const handleWhatsAppEnable = async () => {
    setWhatsappEnabling(true);
    try {
      const res = await channelService.connectWhatsAppSandbox();
      if (res.success) {
        setWhatsappStatus({
          sandbox_number: res.data.sandbox_number,
          join_keyword: res.data.join_keyword,
          instructions: res.data.instructions,
          has_twilio: whatsappStatus?.has_twilio ?? false,
          waba_connected: whatsappStatus?.waba_connected ?? false,
        });
        toast.success('WhatsApp sandbox enabled');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to enable WhatsApp sandbox');
    } finally {
      setWhatsappEnabling(false);
    }
  };

  const loadEmailStatus = useCallback(async (pid: string) => {
    setEmailLoading(true);
    try {
      const res = await api.get(`/projects/${pid}/integrations/email`);
      const d = (res as any)?.data?.data ?? (res as any)?.data;
      setEmailStatus(d ?? null);
      if (d?.support_email) setEmailAddress(d.support_email);
      if (d?.from_name) setEmailFromName(d.from_name);
    } catch { setEmailStatus(null); }
    finally { setEmailLoading(false); }
  }, []);

  const handleEmailConnect = async () => {
    if (!emailAddress.trim()) { toast.error('Please enter a support email address'); return; }
    if (!projectId) return;
    setEmailConnecting(true);
    try {
      const res = await api.post(`/projects/${projectId}/integrations/email`, {
        support_email: emailAddress.trim(),
        from_name: emailFromName.trim() || undefined,
      });
      const d = (res as any)?.data?.data ?? (res as any)?.data;
      setEmailStatus(d);
      toast.success('Email channel connected');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to connect email channel');
    } finally { setEmailConnecting(false); }
  };

  const handleEmailDisconnect = async () => {
    if (!projectId) return;
    setEmailDisconnecting(true);
    try {
      await api.delete(`/projects/${projectId}/integrations/email`);
      setEmailStatus(null);
      setEmailAddress('');
      setEmailFromName('');
      setEmailConfirm(false);
      toast.success('Email channel disconnected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect email channel');
    } finally { setEmailDisconnecting(false); }
  };

  const handleEmailTest = async () => {
    if (!projectId) return;
    setEmailTesting(true);
    try {
      const res = await api.post(`/projects/${projectId}/integrations/email/test`, {});
      const msg = (res as any)?.data?.message || 'Test email sent';
      toast.success(msg);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send test email');
    } finally { setEmailTesting(false); }
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

      {/* Messenger Integration */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Messaging Channels</h3>
        <div className="space-y-4">
          <Card className={`border shadow-sm ${messengerStatus?.connected ? 'border-green-200 bg-green-50/30' : 'border-border'}`}>
            <CardContent className="p-6">
              {messengerLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">Messenger</h3>
                          {messengerStatus?.connected ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not connected</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Receive and reply to Facebook Messenger messages from your Page.
                        </p>
                        {messengerStatus?.connected && messengerStatus.page_id && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Page ID: <span className="font-medium">{messengerStatus.page_id}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    {messengerStatus?.connected && (
                      <div className="flex items-center gap-2">
                        {messengerConfirm ? (
                          <>
                            <span className="text-sm text-muted-foreground">Are you sure?</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={handleMessengerDisconnect}
                              disabled={messengerDisconnecting}
                            >
                              {messengerDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4 mr-2" />}
                              Confirm
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setMessengerConfirm(false)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setMessengerConfirm(true)}
                          >
                            <Unplug className="h-4 w-4 mr-2" />
                            Disconnect
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {!messengerStatus?.connected && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="messenger-page-id" className="text-xs">Page ID</Label>
                          <Input
                            id="messenger-page-id"
                            placeholder="123456789"
                            value={messengerPageId}
                            onChange={(e) => setMessengerPageId(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="messenger-page-name" className="text-xs">Page Name</Label>
                          <Input
                            id="messenger-page-name"
                            placeholder="My Business Page"
                            value={messengerPageName}
                            onChange={(e) => setMessengerPageName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="messenger-token" className="text-xs">Page Access Token</Label>
                        <Input
                          id="messenger-token"
                          type="password"
                          placeholder="EAAxxxxx..."
                          value={messengerToken}
                          onChange={(e) => setMessengerToken(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleMessengerConnect}
                        disabled={messengerConnecting}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        size="sm"
                      >
                        {messengerConnecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Plug className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">Token cost: 1 token per message sent or received</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Channel Card */}
          <Card className={`border shadow-sm ${emailStatus?.connected ? 'border-green-200 bg-green-50/30' : 'border-border'}`}>
            <CardContent className="p-6">
              {emailLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />Loading...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">Email</h3>
                          {emailStatus?.connected ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />Connected
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not connected</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Receive and reply to customer emails directly from LinoChat via SendGrid.
                        </p>
                        {emailStatus?.connected && emailStatus.support_email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Support address: <span className="font-medium">{emailStatus.support_email}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    {emailStatus?.connected && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEmailTest}
                          disabled={emailTesting}
                        >
                          {emailTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Test Email'}
                        </Button>
                        {emailConfirm ? (
                          <>
                            <span className="text-sm text-muted-foreground">Are you sure?</span>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleEmailDisconnect} disabled={emailDisconnecting}>
                              {emailDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4 mr-2" />}Confirm
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEmailConfirm(false)}>Cancel</Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setEmailConfirm(true)}>
                            <Unplug className="h-4 w-4 mr-2" />Disconnect
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Connect form */}
                  {!emailStatus?.connected && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="email-address" className="text-xs">Support Email Address</Label>
                          <Input id="email-address" type="email" placeholder="support@yourdomain.com" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="email-from-name" className="text-xs">Display Name</Label>
                          <Input id="email-from-name" placeholder="Acme Support" value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} />
                        </div>
                      </div>
                      <Button onClick={handleEmailConnect} disabled={emailConnecting} className="bg-indigo-600 hover:bg-indigo-700" size="sm">
                        {emailConnecting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</> : <><Plug className="h-4 w-4 mr-2" />Connect</>}
                      </Button>
                    </div>
                  )}

                  {/* Inbound address — shown when connected */}
                  {emailStatus?.connected && emailStatus.inbound_address && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                      <p className="text-sm font-medium text-blue-900">Your dedicated inbound email address</p>
                      <p className="text-xs text-blue-700">
                        Forward emails from <span className="font-medium">{emailStatus.support_email}</span> to this address, or give it directly to customers. Inbound emails will automatically create tickets in this project.
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm bg-white border border-blue-200 px-3 py-2 rounded-md font-mono">
                            {emailStatus.inbound_address}
                          </code>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => { navigator.clipboard.writeText(emailStatus.inbound_address!); toast.success('Copied'); }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">Token cost: 1 token per email sent or received</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Sandbox Card */}
          <Card className="border shadow-sm border-amber-200 bg-amber-50/20">
            <CardContent className="p-6">
              {whatsappLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <Phone className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">WhatsApp (Sandbox / Testing)</h3>
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                            Sandbox Mode
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Test WhatsApp messaging using the Twilio sandbox number.
                        </p>
                      </div>
                    </div>
                    {(!whatsappStatus?.sandbox_number) && (
                      <Button
                        onClick={handleWhatsAppEnable}
                        disabled={whatsappEnabling}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        {whatsappEnabling ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enabling...
                          </>
                        ) : (
                          'Enable Sandbox'
                        )}
                      </Button>
                    )}
                  </div>

                  {whatsappStatus?.sandbox_number && (
                    <div className="space-y-3 pt-2 border-t border-amber-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Send a message to</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm bg-muted px-3 py-1.5 rounded-md font-mono">
                              {whatsappStatus.sandbox_number}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(whatsappStatus.sandbox_number!);
                                toast.success('Copied to clipboard');
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {whatsappStatus.join_keyword && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">With keyword</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-sm bg-muted px-3 py-1.5 rounded-md font-mono">
                                join {whatsappStatus.join_keyword}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(`join ${whatsappStatus.join_keyword}`);
                                  toast.success('Copied to clipboard');
                                }}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      {whatsappStatus.instructions && (
                        <p className="text-xs text-muted-foreground">{whatsappStatus.instructions}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Production WhatsApp with your own number requires Business Account verification — contact us to get started.
                    </p>
                    <p className="text-xs text-muted-foreground">Token cost: 1 token per service message</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}

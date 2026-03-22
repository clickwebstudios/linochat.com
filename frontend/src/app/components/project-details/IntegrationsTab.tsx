import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api } from '../../api/client';
import { Loader2, Link2, CheckCircle2, XCircle, Unlink, Plug, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { FrubixConfig } from '../../types/frubix';

interface IntegrationsTabProps {
  project: { id: string };
}

export function IntegrationsTab({ project }: IntegrationsTabProps) {
  const [frubix, setFrubix] = useState<FrubixConfig>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    api.get<any>(`/projects/${project.id}/integrations`).then((res) => {
      if (res.success && res.data?.frubix) {
        setFrubix(res.data.frubix);
        setIsConnected(res.data.frubix.enabled === true || res.data.frubix.connected === true);
      }
    }).catch(() => {});
  }, [project.id]);

  // Listen for OAuth callback from popup
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'frubix-oauth-callback') {
      if (event.data.success) {
        setFrubix({ enabled: true, connected: true, connected_at: new Date().toISOString() });
        setIsConnected(true);
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
    setConnecting(true);
    try {
      const res = await api.get<{ url: string }>(`/projects/${project.id}/integrations/frubix/authorize`);
      const authorizeUrl = (res.data as any)?.url;
      if (!authorizeUrl) {
        toast.error('Could not get Frubix authorization URL');
        setConnecting(false);
        return;
      }
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        authorizeUrl,
        'frubix-oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`,
      );
      setTimeout(() => setConnecting(false), 300000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate Frubix connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Frubix integration?')) return;
    setIsDisconnecting(true);
    try {
      await api.delete(`/projects/${project.id}/integrations/frubix`);
      setIsConnected(false);
      setFrubix({});
      toast.success('Frubix disconnected.');
    } catch {
      toast.error('Failed to disconnect.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">Connect external platforms to sync data with this project.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-base">Frubix</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Field service management — sync leads, jobs, and clients</p>
              </div>
            </div>
            {isConnected ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <XCircle className="h-3 w-3" /> Not connected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isConnected ? (
            <div className="space-y-3">
              {frubix.url && (
                <p className="text-sm text-muted-foreground">
                  Connected to <span className="font-medium">{frubix.url}</span>
                </p>
              )}
              {frubix.connected_at && (
                <p className="text-xs text-muted-foreground">
                  Connected {new Date(frubix.connected_at).toLocaleDateString()}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Agents can create Frubix leads directly from tickets. AI can look up clients and manage appointments.
              </p>
              <div className="flex gap-2">
                {frubix.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={frubix.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Frubix
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Unlink className="h-4 w-4 mr-1" />}
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Connect your Frubix account to automatically sync leads from tickets and enable AI appointment management.
              </p>
              <Button
                onClick={handleConnect}
                disabled={connecting}
                size="sm"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Waiting for authorization...
                  </>
                ) : (
                  <>
                    <Plug className="h-4 w-4 mr-2" />
                    Connect with Frubix
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

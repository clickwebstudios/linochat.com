import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { api } from '../../api/client';
import { Loader2, Link2, CheckCircle2, XCircle, Unlink } from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationsTabProps {
  project: { id: string };
}

interface FrubixConfig {
  url?: string;
  client_id?: string;
  client_secret?: string;
  connected?: boolean;
  connected_at?: string;
}

export function IntegrationsTab({ project }: IntegrationsTabProps) {
  const [frubix, setFrubix] = useState<FrubixConfig>({});
  const [form, setForm] = useState({ url: '', client_id: '', client_secret: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get<any>(`/projects/${project.id}/integrations`).then((res) => {
      if (res.success && res.data?.frubix) {
        setFrubix(res.data.frubix);
        setIsConnected(true);
        setForm((f) => ({ ...f, url: res.data.frubix.url || '' }));
      }
    }).catch(() => {});
  }, [project.id]);

  const handleTest = async () => {
    if (!form.url || !form.client_id || !form.client_secret) {
      toast.error('Fill in all fields before testing.');
      return;
    }
    setIsTesting(true);
    try {
      const res = await api.post<any>(`/projects/${project.id}/integrations/frubix/test`, form);
      if (res.success && res.data?.success) {
        toast.success('Connection successful!');
      } else {
        toast.error('Connection failed. Check your credentials.');
      }
    } catch {
      toast.error('Connection failed.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!form.url || !form.client_id || !form.client_secret) {
      toast.error('Fill in all fields.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.put<any>(`/projects/${project.id}/integrations/frubix`, form);
      if (res.success) {
        setIsConnected(true);
        setFrubix({ url: form.url, connected: true });
        setShowForm(false);
        toast.success('Frubix connected successfully.');
      }
    } catch {
      toast.error('Failed to save integration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Frubix integration?')) return;
    setIsDisconnecting(true);
    try {
      await api.delete(`/projects/${project.id}/integrations/frubix`);
      setIsConnected(false);
      setFrubix({});
      setForm({ url: '', client_id: '', client_secret: '' });
      setShowForm(false);
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

      {/* Frubix Card */}
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
          {isConnected && !showForm ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connected to <span className="font-medium">{frubix.url}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Agents can create Frubix leads directly from tickets.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                  Update Credentials
                </Button>
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
            <div className="space-y-4">
              {!isConnected && !showForm && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  Connect Frubix
                </Button>
              )}

              {showForm && (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="frubix-url">Frubix URL</Label>
                      <Input
                        id="frubix-url"
                        placeholder="https://frubix.com"
                        value={form.url}
                        onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="frubix-client-id">Client ID</Label>
                      <Input
                        id="frubix-client-id"
                        placeholder="Paste client ID from Frubix OAuth Apps"
                        value={form.client_id}
                        onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="frubix-secret">Client Secret</Label>
                      <Input
                        id="frubix-secret"
                        type="password"
                        placeholder="Paste client secret"
                        value={form.client_secret}
                        onChange={(e) => setForm((f) => ({ ...f, client_secret: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleTest} disabled={isTesting}>
                      {isTesting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                      Test Connection
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

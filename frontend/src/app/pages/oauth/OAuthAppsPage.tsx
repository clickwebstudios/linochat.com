import { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Copy, Eye, EyeOff, Loader2, AlertCircle, Code2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import api from '../../lib/api';

interface OAuthApp {
  id: number;
  name: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string[];
  is_active: boolean;
  access_tokens_count: number;
  created_at: string;
}

const ALL_SCOPES: Record<string, string> = {
  'chats:read':     'View chats and messages',
  'tickets:read':   'View support tickets',
  'tickets:write':  'Create and update tickets',
  'projects:read':  'View projects',
  'knowledge:read': 'Access knowledge base',
  'users:read':     'View team members',
};

export default function OAuthAppsPage() {
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<number, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<OAuthApp | null>(null);

  const [form, setForm] = useState({ name: '', redirect_uri: '', scopes: ['chats:read'] });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    try {
      const res: any = await api.get('/oauth/clients');
      setApps(res.data?.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const createApp = async () => {
    if (!form.name.trim() || !form.redirect_uri.trim()) {
      toast.error('Name and redirect URI are required');
      return;
    }
    setCreating(true);
    try {
      const res: any = await api.post('/oauth/clients', form);
      setApps(prev => [res.data.data, ...prev]);
      setShowCreate(false);
      setForm({ name: '', redirect_uri: '', scopes: ['chats:read'] });
      toast.success('OAuth app created');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create app');
    } finally { setCreating(false); }
  };

  const rotateSecret = async (app: OAuthApp) => {
    try {
      const res: any = await api.post(`/oauth/clients/${app.id}/rotate-secret`);
      setApps(prev => prev.map(a => a.id === app.id ? res.data.data : a));
      toast.success('Secret rotated — all existing tokens revoked');
    } catch {
      toast.error('Failed to rotate secret');
    }
  };

  const deleteApp = async (app: OAuthApp) => {
    try {
      await api.delete(`/oauth/clients/${app.id}`);
      setApps(prev => prev.filter(a => a.id !== app.id));
      setDeleteTarget(null);
      toast.success('App deleted');
    } catch {
      toast.error('Failed to delete app');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };

  const toggleScope = (scope: string) => {
    setForm(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OAuth Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Register apps that can access LinoChat on behalf of your users.
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Integration guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <Code2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-semibold">OAuth 2.0 Authorization Code Flow</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
                <li>Redirect users to <code className="bg-blue-100 px-1 rounded">https://linochat.com/oauth/authorize?client_id=…&redirect_uri=…&response_type=code&scope=chats:read&state=…</code></li>
                <li>User approves → LinoChat redirects back with <code className="bg-blue-100 px-1 rounded">?code=…&state=…</code></li>
                <li>Exchange code: <code className="bg-blue-100 px-1 rounded">POST /api/oauth/token</code> with <code className="bg-blue-100 px-1 rounded">grant_type=authorization_code</code>, <code className="bg-blue-100 px-1 rounded">code</code>, <code className="bg-blue-100 px-1 rounded">client_id</code>, <code className="bg-blue-100 px-1 rounded">client_secret</code>, <code className="bg-blue-100 px-1 rounded">redirect_uri</code></li>
                <li>Use returned <code className="bg-blue-100 px-1 rounded">access_token</code> as <code className="bg-blue-100 px-1 rounded">Authorization: Bearer …</code> header</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Code2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No OAuth applications yet.</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
              Register your first app
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apps.map(app => (
            <Card key={app.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{app.name}</CardTitle>
                    <p className="text-xs text-gray-400 mt-0.5">{app.redirect_uri}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={app.is_active ? 'default' : 'secondary'}>
                      {app.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                    <span className="text-xs text-gray-400">{app.access_tokens_count} tokens</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Client ID */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Client ID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-50 border rounded px-3 py-1.5 font-mono truncate">
                      {app.client_id}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(app.client_id, 'Client ID')}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Client Secret */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Client Secret</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-50 border rounded px-3 py-1.5 font-mono truncate">
                      {showSecret[app.id] ? app.client_secret : '••••••••••••••••••••••••'}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSecret(p => ({ ...p, [app.id]: !p[app.id] }))}>
                      {showSecret[app.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(app.client_secret, 'Client Secret')}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Scopes */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Scopes</label>
                  <div className="flex flex-wrap gap-1">
                    {(app.scopes ?? []).map(s => (
                      <Badge key={s} variant="outline" className="text-xs font-mono">{s}</Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => rotateSecret(app)}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Rotate Secret
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(app)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register OAuth Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">App Name</label>
              <Input
                placeholder="My Website"
                className="mt-1"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Redirect URI</label>
              <Input
                placeholder="https://yoursite.com/oauth/callback"
                className="mt-1"
                value={form.redirect_uri}
                onChange={e => setForm(p => ({ ...p, redirect_uri: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Users will be sent here after approving access.</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Permissions (Scopes)</label>
              <div className="space-y-2">
                {Object.entries(ALL_SCOPES).map(([scope, desc]) => (
                  <div key={scope} className="flex items-center gap-2">
                    <Checkbox
                      id={scope}
                      checked={form.scopes.includes(scope)}
                      onCheckedChange={() => toggleScope(scope)}
                    />
                    <label htmlFor={scope} className="text-sm cursor-pointer">
                      <span className="font-mono text-xs text-blue-700 mr-2">{scope}</span>
                      <span className="text-gray-600">{desc}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={createApp} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete OAuth Application</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 py-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              Deleting <strong>{deleteTarget?.name}</strong> will immediately revoke all access tokens.
              Any website using this app will lose access.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteApp(deleteTarget)}>
              Delete App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

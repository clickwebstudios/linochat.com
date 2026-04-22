import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles, CreditCard, Radio, MessageCircle, Mail, Cloud, Inbox,
  Hash, KeyRound, Link2, Plug, Loader2, CheckCircle2, AlertCircle, ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../ui/dialog';
import { api } from '../../api/client';
import { toast } from 'sonner';

const ICON_MAP: Record<string, any> = {
  Sparkles, CreditCard, Radio, MessageCircle, Mail, Cloud, Inbox,
  Hash, KeyRound, Link2, Plug,
};

interface IntegrationField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'number' | 'url' | 'email';
  secret: boolean;
  required: boolean;
  placeholder?: string | null;
}

interface IntegrationValue {
  value?: any;
  preview?: string | null;
  source: 'db' | 'env' | null;
  set: boolean;
}

interface Integration {
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  docs_url: string | null;
  fields: IntegrationField[];
  values: Record<string, IntegrationValue>;
  configured: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
  ai: 'AI',
  payments: 'Payments',
  email: 'Email',
  sms: 'SMS',
  oauth: 'OAuth',
  realtime: 'Realtime',
  crm: 'CRM',
  chat: 'Chat',
  other: 'Other',
};

export default function PlatformIntegrationsTab() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Integration | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<Integration[]>('/superadmin/integrations');
      if (res.success) setItems(res.data || []);
    } catch {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const g: Record<string, Integration[]> = {};
    for (const i of items) {
      const c = i.category || 'other';
      (g[c] ||= []).push(i);
    }
    return g;
  }, [items]);

  const onSaved = (updated: Integration) => {
    setItems(prev => prev.map(p => p.key === updated.key ? updated : p));
    setEditing(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect LinoChat to third-party services. Values saved here override the
          corresponding <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> variables at runtime. Secrets are encrypted at rest.
        </p>
      </div>

      {Object.entries(grouped).map(([category, entries]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {CATEGORY_LABEL[category] || category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map(item => (
              <IntegrationCard
                key={item.key}
                item={item}
                onEdit={() => setEditing(item)}
              />
            ))}
          </div>
        </div>
      ))}

      {editing && (
        <IntegrationEditDialog
          integration={editing}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function IntegrationCard({ item, onEdit }: { item: Integration; onEdit: () => void }) {
  const Icon = ICON_MAP[item.icon] || Plug;
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onEdit}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{item.name}</CardTitle>
            </div>
          </div>
          {item.configured ? (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Configured
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 shrink-0">
              <AlertCircle className="h-3 w-3 mr-1" /> Not set
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
      </CardContent>
    </Card>
  );
}

function IntegrationEditDialog({
  integration,
  onClose,
  onSaved,
}: {
  integration: Integration;
  onClose: () => void;
  onSaved: (i: Integration) => void;
}) {
  const Icon = ICON_MAP[integration.icon] || Plug;
  const [form, setForm] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of integration.fields) {
      const v = integration.values[f.key];
      if (!v) { initial[f.key] = ''; continue; }
      if (f.secret) {
        initial[f.key] = v.preview || '';
      } else {
        initial[f.key] = v.value == null ? '' : String(v.value);
      }
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const setField = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build nested fields object from dot-notation keys
      const fields: any = {};
      for (const f of integration.fields) {
        const val = form[f.key] ?? '';
        const parts = f.key.split('.');
        let cur = fields;
        for (let i = 0; i < parts.length - 1; i++) {
          cur[parts[i]] = cur[parts[i]] || {};
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = val;
      }
      const res = await api.put<Integration>(`/superadmin/integrations/${integration.key}`, { fields });
      if (res.success) {
        toast.success(`${integration.name} saved`);
        onSaved(res.data);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle>{integration.name}</DialogTitle>
              <DialogDescription className="mt-0.5">{integration.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {integration.fields.map(f => {
            const v = integration.values[f.key];
            const source = v?.source;
            return (
              <div key={f.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">
                    {f.label}
                    {f.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {source === 'env' && (
                    <span className="text-xs text-muted-foreground">from .env</span>
                  )}
                  {source === 'db' && (
                    <span className="text-xs text-primary">saved override</span>
                  )}
                </div>
                <Input
                  type={f.type === 'password' ? 'password' : f.type === 'number' ? 'number' : 'text'}
                  placeholder={f.placeholder || (f.secret && v?.set ? v.preview || '' : '')}
                  value={form[f.key] ?? ''}
                  onChange={e => setField(f.key, e.target.value)}
                  autoComplete="off"
                />
                {f.secret && v?.set && (
                  <p className="text-xs text-muted-foreground">
                    Leave unchanged to keep current secret, or enter a new value to replace it.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          {integration.docs_url && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mr-auto"
            >
              <a href={integration.docs_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Docs
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

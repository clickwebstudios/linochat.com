import { useEffect, useState, useCallback } from 'react';
import { Loader2, Save, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { api } from '../../api/client';
import { toast } from 'sonner';

type GroupKey = 'general' | 'signups_access' | 'defaults_limits' | 'notifications' | 'widget_defaults';

interface GroupDef {
  key: GroupKey;
  title: string;
  description: string;
  defaults: Record<string, any>;
  fields: FieldDef[];
}

type FieldDef =
  | { key: string; label: string; kind: 'text'; placeholder?: string; help?: string }
  | { key: string; label: string; kind: 'textarea'; placeholder?: string; help?: string }
  | { key: string; label: string; kind: 'email'; placeholder?: string; help?: string }
  | { key: string; label: string; kind: 'url'; placeholder?: string; help?: string }
  | { key: string; label: string; kind: 'number'; min?: number; max?: number; help?: string }
  | { key: string; label: string; kind: 'switch'; help?: string }
  | { key: string; label: string; kind: 'color'; help?: string }
  | { key: string; label: string; kind: 'select'; options: { value: string; label: string }[]; help?: string };

const GROUPS: GroupDef[] = [
  {
    key: 'general',
    title: 'General',
    description: 'Platform-wide branding and support info.',
    defaults: {
      platform_name: 'LinoChat',
      support_email: 'support@linochat.com',
      support_url: 'https://linochat.com/help',
      maintenance_mode: false,
      maintenance_message: '',
    },
    fields: [
      { key: 'platform_name', label: 'Platform Name', kind: 'text', placeholder: 'LinoChat' },
      { key: 'support_email', label: 'Support Email', kind: 'email', placeholder: 'support@example.com' },
      { key: 'support_url', label: 'Support URL', kind: 'url', placeholder: 'https://example.com/help' },
      { key: 'maintenance_mode', label: 'Maintenance Mode', kind: 'switch', help: 'Display a maintenance banner to all users.' },
      { key: 'maintenance_message', label: 'Maintenance Message', kind: 'textarea', placeholder: 'We are performing scheduled maintenance. Back soon.' },
    ],
  },
  {
    key: 'signups_access',
    title: 'Signups & Access',
    description: 'Who can join and how identity is verified.',
    defaults: {
      allow_signups: true,
      require_email_verification: true,
      require_2fa_agents: false,
      allow_google_signin: true,
      allowed_signup_domains: '',
    },
    fields: [
      { key: 'allow_signups', label: 'Allow new company signups', kind: 'switch' },
      { key: 'require_email_verification', label: 'Require email verification', kind: 'switch' },
      { key: 'require_2fa_agents', label: 'Require 2FA for agents', kind: 'switch', help: 'Enforces two-factor auth on all agent accounts.' },
      { key: 'allow_google_signin', label: 'Allow Google sign-in', kind: 'switch' },
      { key: 'allowed_signup_domains', label: 'Allowed signup domains', kind: 'text', placeholder: 'example.com, other.com', help: 'Comma-separated list. Empty = allow any domain.' },
    ],
  },
  {
    key: 'defaults_limits',
    title: 'Defaults & Limits',
    description: 'Default values and hard caps applied to new accounts.',
    defaults: {
      default_ai_model: 'gpt-4o-mini',
      trial_days: 14,
      free_max_projects: 1,
      free_max_agents: 2,
      free_max_conversations_per_month: 100,
      max_kb_articles_per_project: 500,
      max_upload_mb: 10,
    },
    fields: [
      { key: 'default_ai_model', label: 'Default AI Model', kind: 'select', options: [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4o', label: 'GPT-4o' },
      ] },
      { key: 'trial_days', label: 'Trial Length (days)', kind: 'number', min: 0, max: 365 },
      { key: 'free_max_projects', label: 'Free Plan: Max Projects', kind: 'number', min: 0 },
      { key: 'free_max_agents', label: 'Free Plan: Max Agents', kind: 'number', min: 0 },
      { key: 'free_max_conversations_per_month', label: 'Free Plan: Conversations / month', kind: 'number', min: 0 },
      { key: 'max_kb_articles_per_project', label: 'Max KB Articles / project', kind: 'number', min: 0 },
      { key: 'max_upload_mb', label: 'Max Upload Size (MB)', kind: 'number', min: 1, max: 500 },
    ],
  },
  {
    key: 'notifications',
    title: 'Notifications',
    description: 'Internal alerts for platform events.',
    defaults: {
      admin_email: '',
      alert_on_new_signup: true,
      alert_on_failed_payment: true,
      alert_on_new_ticket: false,
      daily_summary: false,
    },
    fields: [
      { key: 'admin_email', label: 'Admin Notification Email', kind: 'email', placeholder: 'alerts@linochat.com' },
      { key: 'alert_on_new_signup', label: 'Alert on new company signup', kind: 'switch' },
      { key: 'alert_on_failed_payment', label: 'Alert on failed payment', kind: 'switch' },
      { key: 'alert_on_new_ticket', label: 'Alert on new support ticket', kind: 'switch' },
      { key: 'daily_summary', label: 'Email daily platform summary', kind: 'switch' },
    ],
  },
  {
    key: 'widget_defaults',
    title: 'Widget Defaults',
    description: 'Defaults applied to newly created projects.',
    defaults: {
      primary_color: '#2563eb',
      position: 'bottom-right',
      welcome_message: 'Hi! How can we help you today?',
      show_branding: true,
    },
    fields: [
      { key: 'primary_color', label: 'Primary Color', kind: 'color' },
      { key: 'position', label: 'Widget Position', kind: 'select', options: [
        { value: 'bottom-right', label: 'Bottom Right' },
        { value: 'bottom-left', label: 'Bottom Left' },
      ] },
      { key: 'welcome_message', label: 'Welcome Message', kind: 'textarea' },
      { key: 'show_branding', label: 'Show "Powered by" branding', kind: 'switch' },
    ],
  },
];

export default function PlatformSettingsTab() {
  const [values, setValues] = useState<Record<GroupKey, Record<string, any>>>(() => {
    const init: any = {};
    for (const g of GROUPS) init[g.key] = { ...g.defaults };
    return init;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          GROUPS.map(g => api.get<any>(`/superadmin/platform-settings/${g.key}`).catch(() => null))
        );
        if (cancelled) return;
        setValues(prev => {
          const next = { ...prev };
          results.forEach((res, i) => {
            const g = GROUPS[i];
            if (res?.success && res.data && typeof res.data === 'object') {
              next[g.key] = { ...g.defaults, ...res.data };
            }
          });
          return next;
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setField = useCallback((group: GroupKey, key: string, v: any) => {
    setValues(prev => ({ ...prev, [group]: { ...prev[group], [key]: v } }));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Platform Settings</h2>
        <p className="text-sm text-muted-foreground">
          Global configuration. Changes apply to all companies on the platform.
        </p>
      </div>

      {GROUPS.map(group => (
        <SettingsGroup
          key={group.key}
          group={group}
          value={values[group.key]}
          onChange={(k, v) => setField(group.key, k, v)}
        />
      ))}
    </div>
  );
}

function SettingsGroup({
  group,
  value,
  onChange,
}: {
  group: GroupDef;
  value: Record<string, any>;
  onChange: (key: string, v: any) => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/superadmin/platform-settings/${group.key}`, { value });
      toast.success(`${group.title} saved`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{group.title}</CardTitle>
        <CardDescription>{group.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {group.fields.map(f => (
          <FieldRow key={f.key} field={f} value={value[f.key]} onChange={v => onChange(f.key, v)} />
        ))}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save {group.title}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
}) {
  if (field.kind === 'switch') {
    return (
      <div className="flex items-start justify-between gap-4 py-1">
        <div className="flex-1">
          <Label className="text-sm">{field.label}</Label>
          {field.help && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 shrink-0" /> {field.help}
            </p>
          )}
        </div>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{field.label}</Label>
      {field.kind === 'textarea' ? (
        <textarea
          className="w-full min-h-[72px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      ) : field.kind === 'select' ? (
        <Select value={String(value ?? '')} onValueChange={onChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {field.options.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.kind === 'color' ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="h-9 w-12 rounded border border-input cursor-pointer"
            value={value || '#2563eb'}
            onChange={e => onChange(e.target.value)}
          />
          <Input
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="max-w-[140px] font-mono text-sm"
          />
        </div>
      ) : field.kind === 'number' ? (
        <Input
          type="number"
          min={field.min}
          max={field.max}
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      ) : (
        <Input
          type={field.kind === 'email' ? 'email' : field.kind === 'url' ? 'url' : 'text'}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      )}
      {field.help && field.kind !== 'switch' && (
        <p className="text-xs text-muted-foreground">{field.help}</p>
      )}
    </div>
  );
}

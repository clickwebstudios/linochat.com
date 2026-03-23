import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Shield,
  ArrowLeft,
  LogOut,
  User,
  ChevronDown,
  Building2,
  Settings,
  CreditCard,
  Activity,
  Receipt,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import SuperadminDashboard from './SuperadminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { toast } from 'sonner';

type PlatformTab = 'overview' | 'companies' | 'activity' | 'pricing' | 'transactions' | 'analytics' | 'settings';

const PLATFORM_TABS: { id: PlatformTab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'companies', label: 'All Companies', icon: Building2 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'pricing', label: 'Pricing & Plans', icon: CreditCard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'settings', label: 'Platform Settings', icon: Settings },
];

export default function SuperadminPlatform() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<PlatformTab>('overview');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 sticky top-0 z-50">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/superadmin/select-view')} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-5 w-px bg-border" />
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">Platform Management</span>
            <Badge variant="outline" className="text-xs">Superadmin</Badge>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer">
                  <div className="text-right">
                    <div className="text-sm font-medium">{user ? `${user.first_name} ${user.last_name}` : 'Admin'}</div>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/superadmin/select-view')}>
                  <User className="mr-2 h-4 w-4" /> Switch View
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => { logout(); navigate('/'); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 -mb-px">
          {PLATFORM_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'overview' && (
          <SuperadminDashboard hideHeader sectionOverride="overview" onSwitchToCompany={(id) => { setActiveTab('companies'); setTimeout(() => { window.dispatchEvent(new CustomEvent('sa-view-company', { detail: id })); }, 100); }} />
        )}

        {activeTab === 'companies' && (
          <SuperadminDashboard hideHeader sectionOverride="companies" />
        )}

        {activeTab === 'activity' && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Platform Activity</h2>
            <div className="text-center py-20 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Platform-wide activity feed coming soon.</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Platform Analytics</h2>
            <div className="text-center py-20 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Cross-company analytics and reporting coming soon.</p>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="p-6">
            <PricingTab />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Transactions</h2>
            <div className="text-center py-20 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Transaction history and billing overview coming soon.</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Platform Settings</h2>
            <div className="text-center py-20 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Global platform configuration coming soon.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Pricing Tab ---
interface ModelPricing {
  mode: 'markup' | 'fixed';
  markup_percent: number;
  fixed_price: number;
  base_cost_input_per_1m: number;
  base_cost_output_per_1m: number;
}

interface UsageStats {
  totals: { calls: number; input_tokens: number; output_tokens: number; base_cost: number; charged_cost: number; profit: number };
  by_model: { model: string; calls: number; base_cost: number; charged_cost: number }[];
  by_project: { project_name: string; calls: number; base_cost: number; charged_cost: number }[];
}

const MODEL_LABELS: Record<string, string> = { 'gpt-4o': 'GPT-4o', 'gpt-4o-mini': 'GPT-4o Mini' };

function PricingTab() {
  const [pricing, setPricing] = useState<Record<string, ModelPricing>>({});
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<any>('/superadmin/platform-settings/ai_pricing'),
      api.get<any>('/superadmin/ai-usage-stats'),
    ]).then(([pricingRes, usageRes]) => {
      if (pricingRes.success && pricingRes.data) setPricing(pricingRes.data);
      if (usageRes.success && usageRes.data) setUsage(usageRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateModel = (model: string, patch: Partial<ModelPricing>) => {
    setPricing(prev => ({ ...prev, [model]: { ...prev[model], ...patch } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/superadmin/platform-settings/ai_pricing', { value: pricing });
      toast.success('Pricing saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const fmt = (n: number) => n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Model Pricing</h2>
          <p className="text-sm text-muted-foreground">Set margins for each AI model. Customers are charged based on these settings.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Pricing
        </Button>
      </div>

      {/* Model Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(pricing).map(([model, mp]) => {
          const avgCostPer1k = (mp.base_cost_input_per_1m * 2 + mp.base_cost_output_per_1m * 0.3) / 1000;
          const chargedPer1k = mp.mode === 'fixed' ? mp.fixed_price : avgCostPer1k * (1 + mp.markup_percent / 100);
          return (
            <Card key={model}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{MODEL_LABELS[model] || model}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Input cost:</span> ${mp.base_cost_input_per_1m}/1M tokens</div>
                  <div><span className="text-muted-foreground">Output cost:</span> ${mp.base_cost_output_per_1m}/1M tokens</div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Pricing Mode</Label>
                  <Select value={mp.mode} onValueChange={v => updateModel(model, { mode: v as 'markup' | 'fixed' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markup">Markup Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Price per Chat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mp.mode === 'markup' ? (
                  <div className="grid gap-2">
                    <Label className="text-xs">Markup (%)</Label>
                    <Input type="number" value={mp.markup_percent} onChange={e => updateModel(model, { markup_percent: parseInt(e.target.value) || 0 })} />
                    <p className="text-xs text-muted-foreground">Customer pays base cost + {mp.markup_percent}% = ~{fmt(chargedPer1k)}/chat</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label className="text-xs">Fixed Price per Chat ($)</Label>
                    <Input type="number" step="0.001" value={mp.fixed_price} onChange={e => updateModel(model, { fixed_price: parseFloat(e.target.value) || 0 })} />
                    <p className="text-xs text-muted-foreground">Customer pays ${mp.fixed_price} per conversation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage Stats */}
      {usage && (
        <>
          <h2 className="text-lg font-semibold pt-4">Usage Summary (Last 30 Days)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">API Calls</p><p className="text-2xl font-bold">{usage.totals.calls.toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Base Cost</p><p className="text-2xl font-bold">{fmt(usage.totals.base_cost)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold text-green-600">{fmt(usage.totals.charged_cost)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Profit</p><p className="text-2xl font-bold text-primary">{fmt(usage.totals.profit)}</p></CardContent></Card>
          </div>

          {usage.by_model.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">By Model</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {usage.by_model.map(m => (
                    <div key={m.model} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="font-medium">{MODEL_LABELS[m.model] || m.model}</span>
                      <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>{m.calls} calls</span>
                        <span>Cost: {fmt(m.base_cost)}</span>
                        <span className="text-green-600">Revenue: {fmt(m.charged_cost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {usage.by_project.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">By Project (Top 10)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {usage.by_project.map(p => (
                    <div key={p.project_name} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="font-medium">{p.project_name}</span>
                      <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>{p.calls} calls</span>
                        <span>Cost: {fmt(p.base_cost)}</span>
                        <span className="text-green-600">Revenue: {fmt(p.charged_cost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
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
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Pricing & Plans</h2>
            <div className="text-center py-20 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Plan management and pricing configuration coming soon.</p>
            </div>
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

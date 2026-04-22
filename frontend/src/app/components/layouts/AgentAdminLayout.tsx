import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2, PauseCircle, Shield } from 'lucide-react';
import { Sheet, SheetContent } from '../ui/sheet';
import { Button } from '../ui/button';
import { AdminSidebar } from '../AdminSidebar';
import { LayoutProvider, useLayout } from './LayoutContext';
import { HumanRequestedListener } from '../HumanRequestedListener';
import { usePlanGuard } from '../../hooks/usePlanGuard';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';

function ImpersonationBanner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const impersonatedBy = localStorage.getItem('impersonated_by');
  const superadminToken = localStorage.getItem('superadmin_token');

  if (!impersonatedBy || !superadminToken) return null;

  const handleReturn = async () => {
    setLoading(true);
    try {
      localStorage.setItem('access_token', superadminToken);
      localStorage.removeItem('impersonated_by');
      localStorage.removeItem('superadmin_token');
      const res = await api.get<any>('/me');
      if (res.success && res.data) {
        useAuthStore.getState().setUser(res.data);
      }
      navigate('/superadmin/dashboard', { replace: true });
    } catch {
      localStorage.removeItem('impersonated_by');
      localStorage.removeItem('superadmin_token');
      navigate('/superadmin/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 bg-indigo-50 border-b border-indigo-200 px-6 py-2 shrink-0">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-indigo-600 shrink-0" />
        <span className="text-sm text-indigo-800 font-medium">
          You are viewing as an impersonated user
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 border-indigo-300 text-indigo-700 hover:bg-indigo-100 gap-1.5"
        onClick={handleReturn}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowLeft className="h-3.5 w-3.5" />}
        Return to Superadmin
      </Button>
    </div>
  );
}

function PausedAccountBanner({ role }: { role: 'Agent' | 'Admin' | 'Superadmin' }) {
  const user = useAuthStore((s) => s.user);
  const impersonatedBy = localStorage.getItem('impersonated_by');
  const superadminToken = localStorage.getItem('superadmin_token');
  const isImpersonating = !!impersonatedBy && !!superadminToken;

  if (role !== 'Admin' || isImpersonating) return null;
  if (user?.company_status !== 'paused') return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-orange-50 border-b border-orange-200 px-6 py-2.5 shrink-0">
      <div className="flex items-center gap-2">
        <PauseCircle className="h-4 w-4 text-orange-600 shrink-0" />
        <span className="text-sm text-orange-900">
          Your account is on pause. Please contact the administrator to restore access.
        </span>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100"
      >
        <Link to="/contact">Contact administrator</Link>
      </Button>
    </div>
  );
}

function CancellationBanner({ role }: { role: 'Agent' | 'Admin' | 'Superadmin' }) {
  const { subscription, isLoading } = usePlanGuard();
  const navigate = useNavigate();
  const location = useLocation();

  const isBillingPage = location.pathname.includes('/billing');
  if (isLoading || subscription?.status !== 'cancelled' || subscription?.downgrade_selected_at || role === 'Agent' || isBillingPage) return null;

  const basePath = role === 'Admin' ? '/admin' : '/agent';

  return (
    <div className="flex items-center justify-between gap-4 bg-amber-50 border-b border-amber-200 px-6 py-2.5 shrink-0">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-sm text-amber-800">
          Your subscription has been cancelled. Choose which agents and workspaces to keep before expiry.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
        onClick={() => navigate(`${basePath}/billing/downgrade-selection`)}
      >
        Choose what to keep
      </Button>
    </div>
  );
}

function AgentAdminLayoutInner({ role }: { role: 'Agent' | 'Admin' | 'Superadmin' }) {
  const { mobileSidebarOpen, setMobileSidebarOpen, stats } = useLayout();

  // For Superadmin, use Admin sidebar (they have same access as Admin + more)
  const sidebarRole = role === 'Superadmin' ? 'Admin' : role;

  return (
    <div className="flex h-screen overflow-hidden">
      <HumanRequestedListener />
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[104px] border-r bg-sidebar flex-col shrink-0">
        <AdminSidebar role={sidebarRole} chatsCount={stats.chats} ticketsCount={stats.tickets} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[104px] p-0 bg-sidebar">
          <AdminSidebar role={sidebarRole} chatsCount={stats.chats} ticketsCount={stats.tickets} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area - pages render their own header + content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ImpersonationBanner />
        <PausedAccountBanner role={role} />
        <CancellationBanner role={role} />
        <Outlet />
      </div>
    </div>
  );
}

export default function AgentAdminLayout({ role = 'Agent' }: { role?: 'Agent' | 'Admin' | 'Superadmin' }) {
  return (
    <LayoutProvider role={role}>
      <AgentAdminLayoutInner role={role} />
    </LayoutProvider>
  );
}

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent } from '../ui/sheet';
import { Button } from '../ui/button';
import { AdminSidebar } from '../AdminSidebar';
import { LayoutProvider, useLayout } from './LayoutContext';
import { HumanRequestedListener } from '../HumanRequestedListener';
import { usePlanGuard } from '../../hooks/usePlanGuard';

function CancellationBanner({ role }: { role: 'Agent' | 'Admin' | 'Superadmin' }) {
  const { subscription, isLoading } = usePlanGuard();
  const navigate = useNavigate();
  const location = useLocation();

  const isBillingPage = location.pathname.includes('/billing');
  if (isLoading || subscription?.status !== 'cancelled' || role === 'Agent' || isBillingPage) return null;

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
      <aside className="hidden md:flex w-24 border-r bg-sidebar flex-col shrink-0">
        <AdminSidebar role={sidebarRole} chatsCount={stats.chats} ticketsCount={stats.tickets} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-24 p-0 bg-sidebar">
          <AdminSidebar role={sidebarRole} chatsCount={stats.chats} ticketsCount={stats.tickets} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area - pages render their own header + content */}
      <div className="flex flex-1 flex-col overflow-hidden">
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

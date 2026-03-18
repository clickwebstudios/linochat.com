import { Outlet } from 'react-router-dom';
import { Sheet, SheetContent } from '../ui/sheet';
import { AdminSidebar } from '../AdminSidebar';
import { LayoutProvider, useLayout } from './LayoutContext';
import { HumanRequestedListener } from '../HumanRequestedListener';

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

import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  Home,
  Users,
  CreditCard,
  BarChart as BarChartIcon,
  Database,
  Activity,
  Building2,
  KeyRound,
} from 'lucide-react';

interface SuperadminSidebarProps {
  sidebarOpen: boolean;
}

const navItems = [
  { id: 'dashboard', path: '/superadmin/dashboard', label: 'Dashboard', icon: Home },
  { id: 'chats', path: '/superadmin/chats', label: 'Chats', icon: Activity },
  { id: 'companies', path: '/superadmin/companies', label: 'Companies', icon: Building2 },
  { id: 'team', path: '/superadmin/team', label: 'Team', icon: Users },
  { id: 'permissions', path: '/superadmin/permissions', label: 'Permissions', icon: KeyRound },
  { id: 'plans', path: '/superadmin/plans', label: 'Plans', icon: CreditCard },
  { id: 'analytics', path: '/superadmin/analytics', label: 'Analytics', icon: BarChartIcon },
  { id: 'logs', path: '/superadmin/logs', label: 'System Logs', icon: Database },
];

export function SuperadminSidebar({ sidebarOpen }: SuperadminSidebarProps) {
  const location = useLocation();

  // Determine active section from URL path
  const pathSegments = location.pathname.split('/');
  const currentSection = pathSegments[2] || 'dashboard';

  const isActive = (itemId: string) => {
    // Detail page highlighting
    if (currentSection === 'company') return itemId === 'companies';
    if (currentSection === 'agent') return itemId === 'team';
    if (currentSection === 'user') return itemId === 'team';
    if (currentSection === 'tickets') return itemId === 'dashboard';
    if (currentSection === 'chats' && pathSegments.length > 3) return itemId === 'chats';
    return currentSection === itemId;
  };

  return (
    <aside className={`${sidebarOpen ? 'w-56' : 'w-20'} bg-sidebar transition-all duration-300 flex flex-col shrink-0`}>
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link to="/superadmin/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-sm text-white font-bold">CS</span>
          </div>
          {sidebarOpen && <span className="font-bold text-sidebar-foreground">Admin Panel</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent ${
              isActive(item.id) ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary' : ''
            }`}
            asChild
          >
            <Link to={item.path}>
              <item.icon className="mr-3 h-4 w-4" />
              {sidebarOpen && item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
}
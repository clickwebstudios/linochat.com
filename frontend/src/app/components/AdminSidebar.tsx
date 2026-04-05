import { Link, useLocation } from 'react-router-dom';
import { Badge } from './ui/badge';
import {
  Home,
  MessageCircle,
  Ticket,
  FileText,
  Users,
  FolderOpen,
  BarChart,
  Settings,
} from 'lucide-react';

interface AdminSidebarProps {
  role?: 'Agent' | 'Admin';
  chatsCount?: number;
  ticketsCount?: number;
}

export function AdminSidebar({ role = 'Admin', chatsCount = 0, ticketsCount = 0 }: AdminSidebarProps) {
  const location = useLocation();

  // Derive basePath from current URL: /agent/*, /admin/*, or /superadmin/*
  const basePath = location.pathname.startsWith('/superadmin') 
    ? '/superadmin' 
    : location.pathname.startsWith('/admin') 
      ? '/admin' 
      : '/agent';

  // Determine active section from URL path
  const pathSegments = location.pathname.split('/');
  // e.g. /agent/tickets → ['', 'agent', 'tickets']
  const currentSection = pathSegments[2] || 'dashboard';

  const buttonBase = "w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors";
  const activeClass = "bg-sidebar-primary text-sidebar-primary-foreground";
  const inactiveClass = "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent";

  const isActive = (section: string) => {
    // Detail pages: highlight their parent section
    if (currentSection === 'project') return section === 'projects';
    if (currentSection.match(/^tickets$/) && pathSegments.length > 3) return section === 'tickets';
    if (currentSection.match(/^chats$/) && pathSegments.length > 3) return section === 'chats';
    if (currentSection.match(/^users$/) && pathSegments.length > 3) return section === 'users';
    return currentSection === section;
  };

  const navItems = [
    { section: 'dashboard', icon: <Home className="h-6 w-6" />, label: 'Home', badge: undefined, showFor: ['Agent', 'Admin'] },
    { section: 'projects', icon: <FolderOpen className="h-6 w-6" />, label: 'Workspaces', badge: undefined, showFor: ['Admin'] },
    { section: 'chats', icon: <MessageCircle className="h-6 w-6" />, label: 'Chats', badge: chatsCount > 0 ? chatsCount : undefined, showFor: ['Agent', 'Admin'] },
    { section: 'tickets', icon: <Ticket className="h-6 w-6" />, label: 'Tickets', badge: ticketsCount > 0 ? ticketsCount : undefined, showFor: ['Agent', 'Admin'] },
    { section: 'knowledge', icon: <FileText className="h-6 w-6" />, label: 'Knowledge', badge: undefined, showFor: ['Agent', 'Admin'] },
    { section: 'users', icon: <Users className="h-6 w-6" />, label: 'Users', badge: undefined, showFor: ['Admin'] },
    { section: 'reports', icon: <BarChart className="h-6 w-6" />, label: 'Reports', badge: undefined, showFor: ['Admin'] },
    { section: 'settings', icon: <Settings className="h-6 w-6" />, label: 'Settings', badge: undefined, showFor: ['Admin'] },
  ];

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
        <Link to="/">
          <img src="/logo-icon.svg" alt="LinoChat" className="h-10 w-10" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 pt-6 pb-16 space-y-1">
        {navItems
          .filter(item => item.showFor.includes(role))
          .map(item => (
            <Link
              key={item.section}
              to={`${basePath}/${item.section}`}
              className={`${buttonBase} ${item.badge ? 'relative' : ''} ${
                isActive(item.section) ? activeClass : inactiveClass
              }`}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
              {item.badge && (
                <Badge className="absolute top-2 right-2 bg-red-600 text-white h-3.5 px-1 text-[8px] min-w-[18px] flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
      </nav>
    </div>
  );
}

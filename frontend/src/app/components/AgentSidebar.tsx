import { Link } from 'react-router-dom';
import { Badge } from './ui/badge';
import {
  Home,
  MessageCircle,
  Ticket,
  FileText,
  BarChart,
  Settings,
} from 'lucide-react';

type Section = 'dashboard' | 'chats' | 'tickets' | 'knowledge' | 'reports' | 'settings';

interface AgentSidebarProps {
  activeSection?: Section;
  onSectionChange?: (section: Section) => void;
  chatsCount?: number;
  ticketsCount?: number;
}

export function AgentSidebar({ activeSection = 'dashboard', chatsCount = 0, ticketsCount = 0 }: AgentSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
        <Link to="/agent/dashboard">
          <img src="/logo-icon.svg" alt="LinoChat" className="h-10 w-10" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-3 pt-6">
        <Link
          to="/agent/dashboard"
          className={`w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors ${
            activeSection === 'dashboard'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs">Home</span>
        </Link>
        <Link
          to="/agent/chats"
          className={`w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors relative ${
            activeSection === 'chats'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="text-xs">Chats</span>
          <Badge className="absolute top-2 right-2 bg-red-600 text-white h-3.5 px-1 text-[8px] min-w-[18px] flex items-center justify-center">{chatsCount}</Badge>
        </Link>
        <Link
          to="/agent/tickets"
          className={`w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors relative ${
            activeSection === 'tickets'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <Ticket className="h-6 w-6" />
          <span className="text-xs">Tickets</span>
          <Badge className="absolute top-2 right-2 bg-red-600 text-white h-3.5 px-1 text-[8px] min-w-[18px] flex items-center justify-center">{ticketsCount}</Badge>
        </Link>
        <Link
          to="/agent/knowledge"
          className={`w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors ${
            activeSection === 'knowledge'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <FileText className="h-6 w-6" />
          <span className="text-xs">Knowledge</span>
        </Link>
        <Link
          to="/agent/reports"
          className={`w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors ${
            activeSection === 'reports'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <BarChart className="h-6 w-6" />
          <span className="text-xs">Reports</span>
        </Link>
        <Link
          to="/agent/settings"
          className={`w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors ${
            activeSection === 'settings'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs">Settings</span>
        </Link>
      </nav>

      {/* Status */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex flex-col items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          <span className="text-xs text-sidebar-foreground/60">Online</span>
        </div>
      </div>
    </div>
  );
}
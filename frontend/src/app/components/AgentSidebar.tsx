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
    <div className="flex h-full flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <Link to="/agent/dashboard">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm text-white font-bold">CS</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-3 pt-6">
        <Link
          to="/agent/dashboard"
          className={`w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors ${
            activeSection === 'dashboard' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs">Home</span>
        </Link>
        <Link
          to="/agent/chats"
          className={`w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors relative ${
            activeSection === 'chats' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <FileText className="h-6 w-6" />
          <span className="text-xs">Knowledge</span>
        </Link>
        <Link
          to="/agent/reports"
          className={`w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors ${
            activeSection === 'reports' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <BarChart className="h-6 w-6" />
          <span className="text-xs">Reports</span>
        </Link>
        <Link
          to="/agent/settings"
          className={`w-full flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors ${
            activeSection === 'settings' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs">Settings</span>
        </Link>
      </nav>

      {/* Status */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex flex-col items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>
    </div>
  );
}
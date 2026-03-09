import { ReactNode } from 'react';
import { DashboardLayout, DashboardHeader } from '../layouts';
import { AdminSidebar } from '../AdminSidebar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { MessageCircle, Phone, Mail, Clock } from 'lucide-react';

interface ChatDashboardLayoutProps {
  /**
   * Active section for sidebar highlighting
   */
  activeSection?: string;
  
  /**
   * Current user info
   */
  user?: {
    name: string;
    email: string;
    avatar: string;
    role?: string;
    status?: 'online' | 'offline' | 'away';
  };
  
  /**
   * Chat list slot - Left sidebar with conversation list
   */
  chatList?: ReactNode;
  
  /**
   * Main chat window - Center conversation area
   */
  children: ReactNode;
  
  /**
   * Customer details slot - Right sidebar with customer info
   */
  customerDetails?: ReactNode;
  
  /**
   * Optional custom header actions
   */
  headerActions?: ReactNode;
  
  /**
   * Number of active chats
   */
  activeChatCount?: number;
  
  /**
   * Notification count
   */
  notificationCount?: number;
  
  /**
   * On section navigation
   */
  onNavigate?: (section: string) => void;
}

/**
 * Specialized layout for chat/conversation dashboards
 * 
 * This demonstrates creating custom layouts by composing base slot components
 * 
 * @example
 * <ChatDashboardLayout
 *   user={currentUser}
 *   chatList={<ChatListPanel chats={activeChats} />}
 *   customerDetails={<CustomerInfoPanel customer={selectedCustomer} />}
 * >
 *   <ChatWindow messages={messages} />
 * </ChatDashboardLayout>
 */
export function ChatDashboardLayout({
  activeSection: _activeSection = 'chats',
  user = {
    name: 'Agent',
    email: 'agent@linochat.com',
    avatar: 'AG',
    status: 'online',
  },
  chatList,
  children,
  customerDetails,
  headerActions,
  activeChatCount = 0,
  notificationCount = 0,
  onNavigate: _onNavigate,
}: ChatDashboardLayoutProps) {
  // Custom header with chat-specific actions
  const chatHeaderActions = headerActions || (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1.5">
        <div className={`h-2 w-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
        {user.status === 'online' ? 'Available' : 'Offline'}
      </Badge>
      <Button variant="outline" size="sm">
        <Phone className="mr-2 h-4 w-4" />
        Start Call
      </Button>
      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
        <Mail className="mr-2 h-4 w-4" />
        Email Customer
      </Button>
    </div>
  );

  // Default chat list if not provided
  const defaultChatList = chatList || (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Active Chats ({activeChatCount})</h3>
        <p className="text-sm text-gray-500">No active chats</p>
      </div>
    </div>
  );

  // Default customer details if not provided
  const defaultCustomerDetails = customerDetails || (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Customer Details</h3>
      <p className="text-sm text-gray-500">Select a chat to view details</p>
    </div>
  );

  return (
    <DashboardLayout
      sidebar={
        <AdminSidebar
          role="Admin"
        />
      }
      header={
        <DashboardHeader
          user={user}
          unreadCount={notificationCount}
          actions={chatHeaderActions}
          showSearch={false}
        />
      }
    >
      {/* Three-column chat layout */}
      <div className="flex h-full overflow-hidden">
        {/* Left: Chat List (25%) */}
        <aside className="w-80 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          {defaultChatList}
        </aside>

        {/* Center: Chat Window (50%) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {children}
        </main>

        {/* Right: Customer Details (25%) */}
        <aside className="w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          {defaultCustomerDetails}
        </aside>
      </div>
    </DashboardLayout>
  );
}

/**
 * Simple customer info card for the details panel
 */
interface CustomerInfoCardProps {
  customer: {
    name: string;
    email: string;
    avatar: string;
    status: 'online' | 'offline';
    tags?: string[];
    lastSeen?: string;
  };
}

export function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col items-center text-center pb-4 border-b">
        <Avatar className="h-20 w-20 mb-3">
          <AvatarFallback className="bg-blue-600 text-white text-xl">
            {customer.avatar}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-lg">{customer.name}</h3>
        <p className="text-sm text-gray-600">{customer.email}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className={`h-2 w-2 rounded-full ${customer.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-xs text-gray-600">
            {customer.status === 'online' ? 'Online now' : customer.lastSeen}
          </span>
        </div>
      </div>

      {customer.tags && customer.tags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {customer.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-2">Quick Actions</h4>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Phone className="mr-2 h-4 w-4" />
            Start Call
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Clock className="mr-2 h-4 w-4" />
            View History
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Example usage component
 */
export function ExampleChatDashboard() {
  const mockCustomer = {
    name: 'Emma Thompson',
    email: 'emma@example.com',
    avatar: 'ET',
    status: 'online' as const,
    tags: ['VIP', 'Enterprise', 'Technical'],
    lastSeen: '2 minutes ago',
  };

  return (
    <ChatDashboardLayout
      user={{
        name: 'Sarah Johnson',
        email: 'sarah@linochat.com',
        avatar: 'SJ',
        status: 'online',
      }}
      activeChatCount={3}
      notificationCount={2}
      chatList={
        <div className="p-4">
          <h3 className="font-semibold mb-4">Active Chats (3)</h3>
          {/* Your chat list items */}
        </div>
      }
      customerDetails={<CustomerInfoCard customer={mockCustomer} />}
    >
      {/* Chat window content */}
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Select a chat to start messaging</p>
        </div>
      </div>
    </ChatDashboardLayout>
  );
}

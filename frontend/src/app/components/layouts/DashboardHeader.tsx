import { ReactNode } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { Search, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { HeaderUserBadge } from '../HeaderUserBadge';

interface NotificationItem {
  id: string;
  message: string;
  time: string;
  unread: boolean;
}

interface DashboardHeaderProps {
  /**
   * Search slot - Custom search component or use default
   */
  search?: ReactNode;
  
  /**
   * Actions slot - Custom actions (buttons, etc.)
   */
  actions?: ReactNode;
  
  /**
   * Notifications - Custom notification dropdown or use default
   */
  notifications?: ReactNode;
  
  /**
   * User menu - Custom user dropdown or use default
   */
  userMenu?: ReactNode;
  
  /**
   * User info for default menu
   */
  user?: {
    name: string;
    email: string;
    avatar: string;
    role?: string;
  };
  
  /**
   * Notifications data for default dropdown
   */
  notificationsList?: NotificationItem[];
  
  /**
   * Custom search handler
   */
  onSearch?: (query: string) => void;
  
  /**
   * Whether to show default search
   */
  showSearch?: boolean;
  
  /**
   * Notification count for badge
   */
  unreadCount?: number;
}

/**
 * Dashboard header component with flexible slot composition
 * 
 * @example
 * // Using default components
 * <DashboardHeader 
 *   user={{ name: 'John Doe', email: 'john@example.com', avatar: 'JD' }}
 *   unreadCount={5}
 * />
 * 
 * @example
 * // Using custom slots
 * <DashboardHeader
 *   search={<CustomSearchBar />}
 *   actions={<Button>Create Ticket</Button>}
 *   userMenu={<CustomUserDropdown />}
 * />
 */
export function DashboardHeader({
  search,
  actions,
  notifications,
  userMenu,
  user = { name: 'Admin User', email: 'admin@linochat.com', avatar: 'AU' },
  notificationsList = [],
  onSearch,
  showSearch = true,
  unreadCount = 0,
}: DashboardHeaderProps) {
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin')
    ? '/admin'
    : location.pathname.startsWith('/superadmin')
      ? '/superadmin'
      : '/agent';
  const isSuperadmin = basePath === '/superadmin';

  // Default search component
  const DefaultSearch = showSearch && (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search chats, tickets, customers..."
        className="pl-10 bg-muted/50 border-border"
        onChange={(e) => onSearch?.(e.target.value)}
      />
    </div>
  );

  // Default notifications dropdown
  const DefaultNotifications = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notificationsList.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notificationsList.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer ${
                  notification.unread ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {notification.unread && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-2 border-t">
          <Button variant="ghost" className="w-full text-sm" size="sm">
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Default user menu — uses the shared HeaderUserBadge so this layout's
  // header looks and behaves identically to every other dashboard page.
  // The legacy `user` prop is ignored; HeaderUserBadge reads from useAuthStore.
  const DefaultUserMenu = (
    <HeaderUserBadge basePath={basePath} isSuperadmin={isSuperadmin} />
  );

  return (
    <div className="flex items-center gap-4 px-6 py-4">
      {/* Search Slot */}
      {search || DefaultSearch}

      {/* Spacer */}
      <div className="flex-shrink-0" />

      {/* Actions Slot */}
      {actions}

      {/* Notifications Slot */}
      <div className="flex items-center gap-2">
        {notifications || DefaultNotifications}
        
        {/* User Menu Slot */}
        {userMenu || DefaultUserMenu}
      </div>
    </div>
  );
}

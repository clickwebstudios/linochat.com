import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Bell,
  AlertTriangle,
  Shield,
  Users,
  CreditCard,
  Server,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { notificationsData, type Notification, type NotificationType } from '../../data/notificationsData';

type NotificationFilter = 'all' | 'unread';

export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'alert':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'security':
      return <Shield className="h-4 w-4 text-red-600" />;
    case 'user':
      return <Users className="h-4 w-4 text-blue-600" />;
    case 'billing':
      return <CreditCard className="h-4 w-4 text-purple-600" />;
    case 'system':
      return <Server className="h-4 w-4 text-gray-600" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
}

export function getNotificationBg(type: NotificationType) {
  switch (type) {
    case 'alert':
      return 'bg-orange-100';
    case 'security':
      return 'bg-red-100';
    case 'user':
      return 'bg-blue-100';
    case 'billing':
      return 'bg-purple-100';
    case 'system':
      return 'bg-gray-100';
    case 'success':
      return 'bg-green-100';
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  // Only show first 7 in the dropdown preview
  const [items, setItems] = useState(notificationsData.slice(0, 7));

  const unreadCount = items.filter(n => !n.read).length;

  const filtered = filter === 'all' ? items : items.filter(n => !n.read);

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <Badge className="bg-red-600 text-white text-xs h-5 px-1.5">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                markAllRead();
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            className={`flex-1 py-2 text-xs text-center cursor-pointer transition-colors ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setFilter('all');
            }}
          >
            All
          </button>
          <button
            className={`flex-1 py-2 text-xs text-center cursor-pointer transition-colors ${
              filter === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setFilter('unread');
            }}
          >
            Unread{unreadCount > 0 && ` (${unreadCount})`}
          </button>
        </div>

        {/* Notification List */}
        <div className="max-h-[380px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <Bell className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
            </div>
          ) : (
            filtered.map((notification) => (
              <button
                key={notification.id}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  markAsRead(notification.id);
                }}
              >
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-0.5 ${getNotificationBg(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm truncate ${!notification.read ? 'font-semibold' : 'font-medium text-gray-700'}`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.description}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{notification.time}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2.5 bg-gray-50">
          <button
            className="w-full text-xs text-center text-blue-600 hover:text-blue-800 cursor-pointer"
            onClick={() => navigate('/superadmin/notifications')}
          >
            View all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

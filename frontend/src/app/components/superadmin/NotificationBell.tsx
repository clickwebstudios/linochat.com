import { useState, useEffect, useCallback, useRef } from 'react';
import { initEcho } from '../../lib/echo';
import { useAuthStore } from '../../stores/authStore';
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
import { notificationService } from '../../services/notifications';
import type { Notification } from '../../types';

type NotificationFilter = 'all' | 'unread';
export type NotificationType = 'alert' | 'security' | 'user' | 'billing' | 'system' | 'success';

export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'alert':    return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'security': return <Shield className="h-4 w-4 text-red-600" />;
    case 'user':     return <Users className="h-4 w-4 text-primary" />;
    case 'billing':  return <CreditCard className="h-4 w-4 text-secondary" />;
    case 'system':   return <Server className="h-4 w-4 text-muted-foreground" />;
    case 'success':  return <CheckCircle className="h-4 w-4 text-green-600" />;
    default:         return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

export function getNotificationBg(type: NotificationType) {
  switch (type) {
    case 'alert':    return 'bg-orange-100';
    case 'security': return 'bg-red-100';
    case 'user':     return 'bg-primary/10';
    case 'billing':  return 'bg-secondary/10';
    case 'system':   return 'bg-muted';
    case 'success':  return 'bg-green-100';
    default:         return 'bg-muted';
  }
}

// Fallback poll interval (5 min) — used when WebSocket is unavailable
const FALLBACK_POLL_INTERVAL = 5 * 60_000;

export function NotificationBell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [items, setItems] = useState<Notification[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const echoChannelRef = useRef<ReturnType<typeof initEcho> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll();
      if (res?.data) {
        setItems((res.data as Notification[]).slice(0, 50));
      }
    } catch {
      // Non-critical — silently fail
    }
  }, []);

  // Prepend a new notification received via WebSocket
  const prependNotification = useCallback((payload: Record<string, unknown>) => {
    const n: Notification = {
      id: payload.id as number,
      user_id: user?.id ? Number(user.id) : 0,
      type: payload.type as string,
      title: payload.title as string,
      message: payload.message as string,
      is_read: false,
      created_at: payload.created_at as string,
    };
    setItems((prev) => [n, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Try to connect via WebSocket
    const echo = initEcho();
    if (echo && user?.id) {
      const channel = echo.private(`agent.${user.id}`);
      channel.listen('.notification.created', (payload: Record<string, unknown>) => {
        prependNotification(payload);
      });
      echoChannelRef.current = echo;

      // Fallback poll at reduced frequency in case some events are missed
      pollRef.current = setInterval(fetchNotifications, FALLBACK_POLL_INTERVAL);
    } else {
      // No WebSocket — use original 30s polling
      pollRef.current = setInterval(fetchNotifications, 30_000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (echoChannelRef.current && user?.id) {
        try { echoChannelRef.current.leave(`agent.${user.id}`); } catch { /* ignore */ }
      }
    };
  }, [fetchNotifications, prependNotification, user?.id]);

  const unreadCount = items.filter(n => !n.is_read).length;
  const filtered = filter === 'all' ? items : items.filter(n => !n.is_read);

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const markAsRead = async (id: number | string) => {
    try {
      await notificationService.markRead(id);
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  // Infer a display type from the notification type string
  const inferType = (n: Notification): NotificationType => {
    const t = n.type?.toLowerCase() ?? '';
    if (t.includes('billing') || t.includes('payment')) return 'billing';
    if (t.includes('security') || t.includes('password')) return 'security';
    if (t.includes('user') || t.includes('member') || t.includes('invite')) return 'user';
    if (t.includes('alert') || t.includes('warning')) return 'alert';
    if (t.includes('success') || t.includes('completed')) return 'success';
    return 'system';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600" />
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
              className="text-xs text-primary hover:text-primary cursor-pointer"
              onClick={(e) => { e.preventDefault(); markAllRead(); }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b bg-muted/50">
          {(['all', 'unread'] as NotificationFilter[]).map(f => (
            <button
              key={f}
              className={`flex-1 py-2 text-xs text-center cursor-pointer transition-colors ${
                filter === f
                  ? 'text-primary border-b-2 border-primary bg-card'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={(e) => { e.preventDefault(); setFilter(f); }}
            >
              {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No {filter === 'unread' ? 'unread ' : ''}notifications
              </p>
            </div>
          ) : (
            filtered.map((notification) => {
              const type = inferType(notification);
              return (
                <button
                  key={notification.id}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-muted/50 border-b border-border last:border-b-0 ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={(e) => { e.preventDefault(); markAsRead(notification.id); }}
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-0.5 ${getNotificationBg(type)}`}>
                    {getNotificationIcon(type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm truncate ${!notification.is_read ? 'font-semibold' : 'font-medium text-foreground'}`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {notification.created_at
                          ? new Date(notification.created_at).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2.5 bg-muted/50">
          <button
            className="w-full text-xs text-center text-primary hover:text-primary cursor-pointer"
            onClick={() => navigate('/superadmin/notifications')}
          >
            View all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

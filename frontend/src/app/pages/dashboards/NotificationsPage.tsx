import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Loader2 } from 'lucide-react';
import {
  Bell,
  ArrowLeft,
  Search,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Clock,
  AlertTriangle,
  Shield,
  Users,
  CreditCard,
  Server,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../../components/ui/dropdown-menu';

type NotificationType = 'alert' | 'security' | 'user' | 'billing' | 'system' | 'success';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: NotificationType;
}

type NotificationFilter = 'all' | 'unread' | 'read';
type TypeFilter = 'all' | NotificationType;

function getNotificationIcon(type: NotificationType, size: 'sm' | 'md' = 'sm') {
  const cls = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  switch (type) {
    case 'alert':
      return <AlertTriangle className={`${cls} text-orange-600`} />;
    case 'security':
      return <Shield className={`${cls} text-red-600`} />;
    case 'user':
      return <Users className={`${cls} text-blue-600`} />;
    case 'billing':
      return <CreditCard className={`${cls} text-purple-600`} />;
    case 'system':
      return <Server className={`${cls} text-gray-600`} />;
    case 'success':
      return <CheckCircle className={`${cls} text-green-600`} />;
  }
}

function getNotificationBg(type: NotificationType) {
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

function getTypeBadgeColor(type: NotificationType) {
  switch (type) {
    case 'alert':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'security':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'user':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'billing':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'system':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'success':
      return 'bg-green-100 text-green-700 border-green-200';
  }
}

function getTypeLabel(type: NotificationType) {
  switch (type) {
    case 'alert': return 'Alert';
    case 'security': return 'Security';
    case 'user': return 'User';
    case 'billing': return 'Billing';
    case 'system': return 'System';
    case 'success': return 'Success';
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<NotificationFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Try to fetch notifications from API
        const response = await fetch('/api/notifications', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setItems(data.data || []);
          }
        }
        // If API doesn't exist or fails, just show empty state
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNotifications();
  }, []);

  const unreadCount = items.filter(n => !n.read).length;
  const readCount = items.filter(n => n.read).length;

  // Filter logic
  const filtered = items.filter(n => {
    if (statusFilter === 'unread' && n.read) return false;
    if (statusFilter === 'read' && !n.read) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q);
    }
    return true;
  });

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAsUnread = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
  };

  const deleteNotification = (id: string) => {
    setItems(prev => prev.filter(n => n.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(n => n.id)));
    }
  };

  const markSelectedRead = () => {
    setItems(prev => prev.map(n => selectedIds.has(n.id) ? { ...n, read: true } : n));
    setSelectedIds(new Set());
  };

  const markSelectedUnread = () => {
    setItems(prev => prev.map(n => selectedIds.has(n.id) ? { ...n, read: false } : n));
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    setItems(prev => prev.filter(n => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
  };

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'alert', label: 'Alerts' },
    { value: 'security', label: 'Security' },
    { value: 'user', label: 'Users' },
    { value: 'billing', label: 'Billing' },
    { value: 'system', label: 'System' },
    { value: 'success', label: 'Success' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-700" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="bg-red-600 text-white text-xs ml-1">{unreadCount} unread</Badge>
                )}
              </h1>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} className="shrink-0">
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Status Tabs */}
          <div className="flex bg-white border rounded-lg p-1 shrink-0">
            <button
              className={`px-4 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setStatusFilter('all')}
            >
              All ({items.length})
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                statusFilter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setStatusFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                statusFilter === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setStatusFilter('read')}
            >
              Read ({readCount})
            </button>
          </div>

          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-2">
                <Filter className="h-4 w-4" />
                {typeFilter === 'all' ? 'All Types' : getTypeLabel(typeFilter)}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {typeOptions.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={typeFilter === opt.value ? 'bg-blue-50 text-blue-600' : ''}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-blue-700">{selectedIds.size} selected</span>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={markSelectedRead}>
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
              <Button variant="outline" size="sm" onClick={markSelectedUnread}>
                Mark unread
              </Button>
              <Button variant="outline" size="sm" onClick={deleteSelected} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Select All */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 mb-2 px-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={selectAll}
              />
              Select all
            </label>
            <span className="text-xs text-gray-400">{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Notification List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading notifications...</span>
            </div>
          </div>
        ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-500 mb-1">No notifications found</p>
                <p className="text-sm text-gray-400">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : statusFilter === 'unread'
                      ? "You're all caught up!"
                      : 'No notifications match your filters.'}
                </p>
                {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setTypeFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              filtered.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 cursor-pointer"
                      checked={selectedIds.has(notification.id)}
                      onChange={() => toggleSelect(notification.id)}
                    />
                  </div>

                  {/* Icon */}
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getNotificationBg(notification.type)}`}>
                    {getNotificationIcon(notification.type, 'md')}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{notification.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{notification.time}</span>
                          </div>
                          <Badge variant="outline" className={`text-xs ${getTypeBadgeColor(notification.type)}`}>
                            {getTypeLabel(notification.type)}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.read ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-blue-600"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-blue-600"
                            onClick={() => markAsUnread(notification.id)}
                            title="Mark as unread"
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        )}

        {/* Summary Footer */}
        {items.length > 0 && (
          <div className="flex items-center justify-between mt-4 px-1 text-xs text-gray-400">
            <span>{items.length} total notifications &middot; {unreadCount} unread</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 hover:text-red-600"
              onClick={() => {
                setItems(prev => prev.filter(n => !n.read));
                setSelectedIds(new Set());
              }}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear all read
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

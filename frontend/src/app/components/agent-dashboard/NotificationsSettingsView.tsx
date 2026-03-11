import { useState, useEffect } from 'react';
import { Mail, Smartphone, Loader2, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { api } from '../../api/client';

interface NotificationLog {
  id: number;
  type: 'email' | 'sms';
  title: string;
  body: string;
  recipient: string;
  company_name: string;
  company_id: number;
  status: 'sent' | 'failed' | 'pending';
  created_at: string;
}

type FilterType = 'all' | 'email' | 'sms';

export function NotificationsSettingsView() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedCompanies, setExpandedCompanies] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.get<{ data: NotificationLog[] }>('/notifications/log')
      .then((res) => {
        const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
        setNotifications(Array.isArray(data) ? data : []);
        // Auto-expand all companies
        const companyIds = new Set((Array.isArray(data) ? data : []).map((n: NotificationLog) => n.company_id));
        setExpandedCompanies(companyIds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleCompany = (companyId: number) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  // Group by company
  const grouped = filtered.reduce<Record<number, { name: string; items: NotificationLog[] }>>((acc, n) => {
    if (!acc[n.company_id]) acc[n.company_id] = { name: n.company_name, items: [] };
    acc[n.company_id].items.push(n);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notification Log</h2>
          <p className="text-sm text-gray-500 mt-1">All sent notifications across companies.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'email', 'sms'] as FilterType[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'email' && <Mail className="h-3.5 w-3.5" />}
              {f === 'sms' && <Smartphone className="h-3.5 w-3.5" />}
              {f === 'all' ? 'All' : f === 'email' ? 'Email' : 'SMS'}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([companyId, group]) => (
            <div key={companyId} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCompany(Number(companyId))}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                {expandedCompanies.has(Number(companyId)) ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">{group.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{group.items.length}</Badge>
              </button>
              {expandedCompanies.has(Number(companyId)) && (
                <div className="divide-y divide-gray-100">
                  {group.items.map((n) => (
                    <div key={n.id} className="px-4 py-3 flex gap-3">
                      <div className="pt-0.5">
                        {n.type === 'email' ? (
                          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                            <Smartphone className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900 truncate">{n.title}</span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${
                              n.status === 'sent'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : n.status === 'failed'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}
                            variant="outline"
                          >
                            {n.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1 line-clamp-2">{n.body}</p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                          <span>To: {n.recipient}</span>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

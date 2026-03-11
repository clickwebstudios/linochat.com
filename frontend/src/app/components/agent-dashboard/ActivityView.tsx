import { useState, useEffect } from 'react';
import {
  Loader2,
  MessageCircle,
  Ticket,
  UserPlus,
  Bot,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  FolderOpen,
  Mail,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { api } from '../../api/client';

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  description: string;
  user_name: string | null;
  project_name: string | null;
  created_at: string;
}

const iconMap: Record<string, React.ReactNode> = {
  chat_created: <MessageCircle className="h-4 w-4 text-blue-600" />,
  chat_closed: <XCircle className="h-4 w-4 text-gray-500" />,
  chat_handover: <ArrowRightLeft className="h-4 w-4 text-orange-600" />,
  ticket_created: <Ticket className="h-4 w-4 text-purple-600" />,
  ticket_resolved: <CheckCircle className="h-4 w-4 text-green-600" />,
  agent_joined: <UserPlus className="h-4 w-4 text-indigo-600" />,
  ai_response: <Bot className="h-4 w-4 text-cyan-600" />,
  project_created: <FolderOpen className="h-4 w-4 text-amber-600" />,
  email_sent: <Mail className="h-4 w-4 text-blue-500" />,
};

const colorMap: Record<string, string> = {
  chat_created: 'bg-blue-50 border-blue-200',
  chat_closed: 'bg-gray-50 border-gray-200',
  chat_handover: 'bg-orange-50 border-orange-200',
  ticket_created: 'bg-purple-50 border-purple-200',
  ticket_resolved: 'bg-green-50 border-green-200',
  agent_joined: 'bg-indigo-50 border-indigo-200',
  ai_response: 'bg-cyan-50 border-cyan-200',
  project_created: 'bg-amber-50 border-amber-200',
  email_sent: 'bg-blue-50 border-blue-200',
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ActivityView() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: ActivityItem[] }>('/activity-log')
      .then((res) => {
        const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
        setActivities(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <MessageCircle className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No activity recorded yet.</p>
      </div>
    );
  }

  // Group by date
  const grouped = activities.reduce<Record<string, ActivityItem[]>>((acc, item) => {
    const date = new Date(item.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
        <p className="text-sm text-gray-500 mt-1">All activity across the platform.</p>
      </div>

      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{date}</h3>
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="relative flex gap-3">
                  {/* Timeline dot */}
                  <div className={`absolute -left-6 mt-1 h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center bg-white ${colorMap[item.type] || 'bg-gray-50 border-gray-200'}`}>
                    {iconMap[item.type] || <MessageCircle className="h-3.5 w-3.5 text-gray-400" />}
                  </div>

                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900">{item.title}</span>
                      {item.project_name && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-500">
                          {item.project_name}
                        </Badge>
                      )}
                      <span className="text-[11px] text-gray-400 ml-auto flex-shrink-0">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{item.description}</p>
                    {item.user_name && (
                      <span className="text-[11px] text-gray-400">by {item.user_name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

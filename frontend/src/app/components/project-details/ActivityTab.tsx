import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Ticket,
  CheckCircle,
  UserPlus,
  TrendingUp,
  AlertCircle,
  Clock,
  MessageSquare,
  User,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';

interface Activity {
  id: string;
  type: string;
  title?: string;
  description: string;
  created_at: string;
  createdAt?: string;
  user?: {
    id: string;
    name: string;
  };
}

interface ActivityTabProps {
  projectId: string;
}

const activityIcons: Record<string, { icon: any; color: string; bg: string }> = {
  ticket: { icon: Ticket, color: 'text-primary', bg: 'bg-primary/10' },
  ticket_created: { icon: Ticket, color: 'text-primary', bg: 'bg-primary/10' },
  ticket_resolved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ticket_assigned: { icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  chat: { icon: MessageSquare, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  chat_started: { icon: MessageSquare, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  member_added: { icon: UserPlus, color: 'text-secondary', bg: 'bg-secondary/10' },
  note_added: { icon: TrendingUp, color: 'text-muted-foreground', bg: 'bg-muted/50' },
  default: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export function ActivityTab({ projectId }: ActivityTabProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Try to fetch real activities from API
        const response = await api.get<Activity[]>(`/projects/${projectId}/activities`);
        if (response.success && response.data) {
          setActivities(response.data);
        } else {
          // If no data, set empty array (will show empty state)
          setActivities([]);
        }
      } catch (error) {
        // API might not exist yet, show empty state
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state - no activities yet
  if (activities.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No activity yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Activity will appear here when tickets are created, resolved, or team members join the project.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.map((activity) => {
              const config = activityIcons[activity.type] || activityIcons.default;
              const Icon = config.icon;
              const dateStr = activity.created_at || activity.createdAt || '';
              return (
                <div key={activity.id} className={`flex items-start gap-3 p-3 ${config.bg} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${config.color} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      {activity.title && <p className="text-xs text-muted-foreground mt-1">{activity.title}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">{dateStr ? formatTimeAgo(dateStr) : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

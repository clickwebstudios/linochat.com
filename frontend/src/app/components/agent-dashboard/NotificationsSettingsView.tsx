import { useState, useEffect } from 'react';
import { Mail, Smartphone, Loader2, Ticket, MessageCircle, UserPlus, ArrowRightLeft, Bell, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { api } from '../../api/client';

interface NotificationEvent {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  email: boolean;
  sms: boolean;
}

const defaultEvents: NotificationEvent[] = [
  {
    key: 'ticket_created_admin',
    title: 'Ticket Created — Admin',
    description: 'Send notification to company admin when a new ticket is created (manual or via AI booking)',
    icon: <Ticket className="h-5 w-5 text-purple-600" />,
    email: true,
    sms: false,
  },
  {
    key: 'ticket_created_customer',
    title: 'Ticket Created — Customer',
    description: 'Send confirmation to the customer when their ticket is created with a link to view it',
    icon: <Ticket className="h-5 w-5 text-blue-600" />,
    email: true,
    sms: false,
  },
  {
    key: 'ticket_reply',
    title: 'Ticket Reply',
    description: 'Notify the customer when an agent replies to their ticket',
    icon: <MessageCircle className="h-5 w-5 text-green-600" />,
    email: true,
    sms: false,
  },
  {
    key: 'ticket_closed',
    title: 'Ticket Resolved',
    description: 'Notify the customer when their ticket is marked as resolved',
    icon: <Ticket className="h-5 w-5 text-gray-500" />,
    email: true,
    sms: false,
  },
  {
    key: 'chat_handover',
    title: 'Chat Handover to Agent',
    description: 'Notify admin/agents when AI transfers a conversation to a human agent',
    icon: <ArrowRightLeft className="h-5 w-5 text-orange-600" />,
    email: true,
    sms: false,
  },
  {
    key: 'new_chat',
    title: 'New Chat Started',
    description: 'Notify agents when a new customer chat is initiated',
    icon: <MessageCircle className="h-5 w-5 text-cyan-600" />,
    email: false,
    sms: false,
  },
  {
    key: 'booking_created',
    title: 'Booking Request Created',
    description: 'Notify admin when AI creates a booking ticket from customer conversation',
    icon: <Bot className="h-5 w-5 text-indigo-600" />,
    email: true,
    sms: false,
  },
  {
    key: 'agent_assigned',
    title: 'Agent Assigned to Ticket',
    description: 'Notify the agent when they are assigned to a ticket',
    icon: <UserPlus className="h-5 w-5 text-amber-600" />,
    email: true,
    sms: false,
  },
];

export function NotificationsSettingsView() {
  const [events, setEvents] = useState<NotificationEvent[]>(defaultEvents);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ data: Record<string, { email?: boolean; sms?: boolean }> }>('/settings/notifications')
      .then((res) => {
        const data = (res as any)?.data?.data ?? (res as any)?.data;
        if (data && typeof data === 'object') {
          setEvents((prev) =>
            prev.map((ev) => ({
              ...ev,
              email: data[ev.key]?.email ?? ev.email,
              sms: data[ev.key]?.sms ?? ev.sms,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: string, channel: 'email' | 'sms') => {
    setEvents((prev) =>
      prev.map((ev) => (ev.key === key ? { ...ev, [channel]: !ev[channel] } : ev))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, { email: boolean; sms: boolean }> = {};
    events.forEach((ev) => {
      payload[ev.key] = { email: ev.email, sms: ev.sms };
    });
    try {
      await api.put('/settings/notifications', payload);
      toast.success('Notification settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Outgoing Notifications</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure which events trigger Email and SMS notifications.
        </p>
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-end gap-6 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="flex items-center gap-1.5 w-16 justify-center">
          <Mail className="h-3.5 w-3.5" />
          Email
        </div>
        <div className="flex items-center gap-1.5 w-16 justify-center">
          <Smartphone className="h-3.5 w-3.5" />
          SMS
        </div>
      </div>

      <div className="space-y-2">
        {events.map((ev) => (
          <Card key={ev.key} className="border border-gray-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="shrink-0">{ev.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900">{ev.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{ev.description}</p>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                {/* Email toggle */}
                <button
                  type="button"
                  onClick={() => toggle(ev.key, 'email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    ev.email ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  title="Email"
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      ev.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                {/* SMS toggle */}
                <button
                  type="button"
                  onClick={() => toggle(ev.key, 'sms')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    ev.sms ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                  title="SMS"
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      ev.sms ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save Settings
        </Button>
      </div>
    </div>
  );
}

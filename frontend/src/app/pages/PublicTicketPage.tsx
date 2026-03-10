import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Ticket, CheckCircle, Clock, AlertCircle, MessageCircle, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

interface TicketMessage {
  id: number;
  content: string;
  sender_type: 'agent' | 'customer' | 'system';
  created_at: string;
}

interface TicketData {
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  customer_name: string | null;
  project_name: string;
  created_at: string;
  messages: TicketMessage[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: 'Open',        color: 'bg-blue-100 text-blue-700',   icon: <Clock className="h-4 w-4" /> },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="h-4 w-4" /> },
  pending:     { label: 'Pending',     color: 'bg-orange-100 text-orange-700', icon: <Clock className="h-4 w-4" /> },
  closed:      { label: 'Closed',      color: 'bg-green-100 text-green-700',  icon: <CheckCircle className="h-4 w-4" /> },
};

const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export function PublicTicketPage() {
  const { token } = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get(`/public/tickets/${token}`)
      .then(r => setTicket(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const sendReply = async () => {
    if (!reply.trim() || !token) return;
    setSending(true);
    try {
      await api.post(`/public/tickets/${token}/reply`, { message: reply });
      toast.success('Reply sent');
      setReply('');
      // Refresh messages
      const r = await api.get(`/public/tickets/${token}`);
      setTicket(r.data.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ticket Not Found</h1>
          <p className="text-gray-500">This ticket link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
  const isClosed = ticket.status === 'closed';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">{ticket.ticket_number}</p>
              <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
              <p className="text-sm text-gray-500 mt-1">{ticket.project_name}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
                {status.icon}{status.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_COLOR[ticket.priority] ?? PRIORITY_COLOR.medium}`}>
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              </span>
              {ticket.category && (
                <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
              )}
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Opened {new Date(ticket.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Conversation */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Conversation</h2>
          </div>
          <div className="p-6 space-y-4">
            {ticket.messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No messages yet.</p>
            ) : (
              ticket.messages.map((msg) => {
                if (msg.sender_type === 'system') {
                  return (
                    <div key={msg.id} className="text-center">
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.content}</span>
                    </div>
                  );
                }
                const isAgent = msg.sender_type === 'agent';
                return (
                  <div key={msg.id} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${isAgent ? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white'}`}>
                      <p className={`text-xs mb-1 font-medium ${isAgent ? 'text-gray-500' : 'text-blue-200'}`}>
                        {isAgent ? 'Support Team' : (ticket.customer_name || 'You')}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isAgent ? 'text-gray-400' : 'text-blue-300'}`}>
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply box */}
          {!isClosed && (
            <div className="px-6 pb-6 pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Add a reply</p>
              <Textarea
                placeholder="Type your message..."
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button onClick={sendReply} disabled={!reply.trim() || sending} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          )}
          {isClosed && (
            <div className="px-6 pb-6 pt-2 border-t">
              <p className="text-sm text-center text-gray-400 py-2">This ticket is closed. Contact us to open a new request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

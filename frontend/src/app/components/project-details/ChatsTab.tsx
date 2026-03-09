import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Edit,
  Trash2,
  CheckCircle,
  MoreVertical,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';

interface ChatsTabProps {
  basePath: string;
  projectId: string;
}

interface ChatItem {
  id: string;
  subject?: string;
  customer_name?: string;
  status: 'active' | 'closed' | 'pending';
  priority?: 'low' | 'medium' | 'high';
  assigned_to?: string;
  created_at: string;
  last_message?: string;
}

export function ChatsTab({ basePath, projectId }: ChatsTabProps) {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadChats = async () => {
      try {
        const response = await api.get<ChatItem[] | { data: ChatItem[] }>(`/projects/${projectId}/chats`);
        if (response.success) {
          const d = response.data as any;
          const chatsData: ChatItem[] = d?.data || d || [];
          setChats(chatsData);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      loadChats();
    }
  }, [projectId]);

  const filteredChats = chats.filter((chat) =>
    (chat.subject || chat.last_message || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'open':
        return <Badge variant="default">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'closed':
      case 'resolved':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return <Badge variant="secondary">Normal</Badge>;
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Chats</CardTitle>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Search chats..." 
              className="w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="bg-blue-600 hover:bg-blue-700">
              <MessageSquare className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No chats yet</h3>
              <p className="text-gray-500">Chats will appear here when customers start conversations</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chat ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChats.map((chat) => (
                  <TableRow 
                    key={chat.id} 
                    className="cursor-pointer hover:bg-gray-50" 
                    onClick={() => navigate(`${basePath}/chats/${chat.id}`)}
                  >
                    <TableCell className="font-medium">CHAT-{chat.id}</TableCell>
                    <TableCell>{chat.subject || chat.last_message || 'No subject'}</TableCell>
                    <TableCell>{chat.customer_name || 'Unknown'}</TableCell>
                    <TableCell>{getStatusBadge(chat.status)}</TableCell>
                    <TableCell>{getPriorityBadge(chat.priority)}</TableCell>
                    <TableCell>{chat.assigned_to || 'Unassigned'}</TableCell>
                    <TableCell>{formatDate(chat.created_at)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
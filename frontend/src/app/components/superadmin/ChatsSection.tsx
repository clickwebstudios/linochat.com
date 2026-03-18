import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Search,
  User,
  MoreVertical,
  Headphones,
  Send,
  Star,
  Paperclip,
  SmilePlus,
  Trash2,
  Loader2,
} from 'lucide-react';

interface ChatMessage {
  from: string;
  text: string;
  time: string;
}

interface SuperadminChat {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  status: 'active' | 'waiting' | 'resolved';
  company: string;
  chatId: string;
  time: string;
  preview: string;
  agent: string | null;
  msgs: number;
  duration: string;
  respTime: string | null;
  borderColor: string;
  priority?: string;
  rating?: number;
  messages: ChatMessage[];
}

interface ChatsSectionProps {
  superadminChats: SuperadminChat[];
  selectedChatId: string;
  setSelectedChatId: (id: string) => void;
  selectedChat: SuperadminChat | undefined;
  selectedCompanyId?: string | null;
  isLoading?: boolean;
  onChatsRefresh?: () => void;
  statusFilter?: string | null;
  onStatusFilterChange?: (value: string | null) => void;
}

export function ChatsSection({ superadminChats, selectedChatId, setSelectedChatId, selectedChat, isLoading, onChatsRefresh, statusFilter, onStatusFilterChange }: ChatsSectionProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!selectedChat?.id || !messageInput.trim() || isSending) return;
    const chatId = selectedChat.id;
    setIsSending(true);
    try {
      const response = await api.post<{ success: boolean }>(`/agent/chats/${chatId}/message`, {
        message: messageInput.trim(),
      });
      if (response.success) {
        setMessageInput('');
        onChatsRefresh?.();
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      {/* Split Layout: Chat List + Chat Window */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-130px)] min-h-[500px]">
        {/* Left Panel - Chat List */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 border-b shrink-0">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-base">All Chats</CardTitle>
              <Badge variant="outline" className="text-xs">156</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search chats..." className="pl-10 h-9 text-sm" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <select
                className="px-2 py-1 border rounded text-xs flex-1"
                value={statusFilter ?? ''}
                onChange={(e) => onStatusFilterChange?.(e.target.value || null)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="waiting">Waiting</option>
                <option value="ai_handling">AI Handling</option>
                <option value="closed">Closed</option>
              </select>
              <select className="px-2 py-1 border rounded text-xs flex-1">
                <option>All Companies</option>
                <option>TechCorp</option>
                <option>RetailCo</option>
                <option>FinanceHub</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : superadminChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Headphones className="h-12 w-12 mb-2 text-muted" />
                <p>No chats found</p>
              </div>
            ) : (
            <div className="divide-y">
              {superadminChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`px-4 py-3 cursor-pointer transition-colors border-l-3 ${chat.borderColor} ${
                    selectedChatId === chat.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                      <AvatarFallback className={`${chat.avatarColor} text-white text-xs`}>{chat.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="font-semibold text-sm truncate">{chat.name}</p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${
                            chat.status === 'active' ? 'text-green-600 border-green-600' :
                            chat.status === 'waiting' ? 'text-orange-600 border-orange-600' :
                            'text-primary border-primary'
                          }`}>
                            {chat.status === 'active' ? 'Active' : chat.status === 'waiting' ? 'Waiting' : 'Resolved'}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-2 shrink-0">{chat.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{chat.company} • {chat.chatId}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{chat.preview}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {chat.agent ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-primary border-primary">
                            <Headphones className="h-2.5 w-2.5 mr-0.5" />{chat.agent}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-orange-600 border-orange-600">Unassigned</Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground">{chat.msgs} msgs</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Chat Window */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {!selectedChat ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Headphones className="h-16 w-16 mb-4 text-muted" />
              <p className="text-lg font-medium">Select a chat to view</p>
              <p className="text-sm text-muted-foreground">Choose a conversation from the list</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <CardHeader className="py-3 px-4 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`${selectedChat.avatarColor} text-white`}>{selectedChat.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{selectedChat.name}</h4>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${
                          selectedChat.status === 'active' ? 'text-green-600 border-green-600' :
                          selectedChat.status === 'waiting' ? 'text-orange-600 border-orange-600' :
                          'text-primary border-primary'
                        }`}>
                          {selectedChat.status === 'active' ? 'Active' : selectedChat.status === 'waiting' ? 'Waiting' : 'Resolved'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{selectedChat.company} • {selectedChat.chatId} • {selectedChat.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedChat.agent && (
                      <Badge variant="outline" className="text-xs text-primary border-primary">
                        <Headphones className="h-3 w-3 mr-1" />{selectedChat.agent}
                      </Badge>
                    )}
                    {!selectedChat.agent && (
                      <Button size="sm" className="bg-primary text-xs h-7">
                        <Headphones className="h-3 w-3 mr-1" />Assign Agent
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />View Customer Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Headphones className="mr-2 h-4 w-4" />Reassign Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="mr-2 h-4 w-4" />Mark as Priority
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />Close Chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages */}
              <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {selectedChat.messages?.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.from === 'agent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 ${
                        msg.from === 'agent'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.from === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedChat.messages || selectedChat.messages.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <p>No messages yet</p>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Chat Input */}
              <div className="border-t p-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    className="flex-1 h-9"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending || selectedChat.status === 'resolved'}
                  />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                    <SmilePlus className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary h-8 w-8 p-0 shrink-0"
                    onClick={handleSendMessage}
                    disabled={isSending || !messageInput.trim() || selectedChat.status === 'resolved'}
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {selectedChat.status === 'resolved' && (
                  <p className="text-xs text-muted-foreground text-center mt-2">This chat has been resolved{selectedChat.rating ? ` • Customer rating: ${selectedChat.rating}/5` : ''}</p>
                )}
                {selectedChat.status === 'waiting' && !selectedChat.agent && (
                  <p className="text-xs text-orange-500 text-center mt-2">This chat is waiting for an agent to be assigned</p>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

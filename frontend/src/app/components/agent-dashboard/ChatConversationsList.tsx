import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import {
  MessageCircle,
  Search,
  User,
  Bot,
} from 'lucide-react';

export interface ChatConversationsListProps {
  filteredChats: any[];
  activeChat: any;
  setActiveChat: (chat: any) => void;
  chatFilter: 'all' | 'active' | 'closed' | 'archived';
  setChatFilter: (filter: 'all' | 'active' | 'closed' | 'archived') => void;
  getProjectById: (id: string) => any;
  formatRelativeTime: (dateString: string) => string;
}

export function ChatConversationsList({
  filteredChats,
  activeChat,
  setActiveChat,
  chatFilter,
  setChatFilter,
  getProjectById,
  formatRelativeTime,
}: ChatConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  // Re-render every 15s so online/offline status updates based on customer_last_seen_at
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  const displayedChats = searchQuery.trim()
    ? filteredChats.filter((chat) => {
        const q = searchQuery.toLowerCase();
        const name = (chat.customer_name || chat.customer || '').toLowerCase();
        const preview = (chat.preview || chat.last_message || '').toLowerCase();
        return name.includes(q) || preview.includes(q);
      })
    : filteredChats;

  return (
    <div className="w-80 border-r border-[rgba(0,0,0,0.1)] bg-white flex flex-col">
      <div className="h-[113px] border-b border-[rgba(0,0,0,0.1)] p-4 flex flex-col gap-3 shrink-0">
        <div className="relative h-9">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717182]" />
          <Input
            placeholder="Search conversations..."
            className="pl-10 h-9 rounded-lg bg-[#f3f3f5] border-0 text-[14px] text-[#0a0a0a] placeholder:text-[#717182]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 h-8">
          <button
            type="button"
            onClick={() => setChatFilter('all')}
            className={`flex-1 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
              chatFilter === 'all' ? 'bg-[#030213] text-white' : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#0a0a0a] hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setChatFilter('active')}
            className={`flex-1 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
              chatFilter === 'active' ? 'bg-[#030213] text-white' : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#0a0a0a] hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setChatFilter('archived')}
            className={`flex-1 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
              chatFilter === 'archived' ? 'bg-[#030213] text-white' : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#0a0a0a] hover:bg-gray-50'
            }`}
          >
            Archived
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {displayedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-[#eff6ff] rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-[#155dfc]" />
            </div>
            <h3 className="text-sm font-medium text-[#0a0a0a] mb-1">
              {searchQuery.trim()
                ? 'No matching conversations'
                : chatFilter === 'all' ? 'No conversations yet'
                : chatFilter === 'active' ? 'No active conversations'
                : chatFilter === 'archived' ? 'No archived conversations'
                : 'No closed conversations'}
            </h3>
            <p className="text-xs text-[#6a7282] max-w-[200px]">
              {searchQuery.trim()
                ? 'Try a different search term.'
                : chatFilter === 'all'
                ? "Customer chats will appear here when they start a conversation."
                : chatFilter === 'active'
                ? "No active chats at the moment. Check back soon!"
                : chatFilter === 'archived'
                ? "No archived chats yet. Ended chats will appear here."
                : "No closed chats yet. They'll appear here once resolved."}
            </p>
          </div>
        ) : (
          displayedChats.map((chat) => {
            const project = getProjectById(chat.project_id || chat.projectId);
            const isSelected = activeChat?.id === chat.id;
            const lastSeen = chat.customer_last_seen_at ? new Date(chat.customer_last_seen_at).getTime() : 0;
            const isOnline = lastSeen > 0 && (Date.now() - lastSeen) < 30000;
            const agentName = chat.agent || (chat.ai_enabled || chat.isAIBot ? 'AI Bot' : null);
            return (
              <div
                key={chat.id}
                className={`py-3 px-3 cursor-pointer border-b border-[rgba(0,0,0,0.1)] hover:bg-gray-50/50 transition-colors ${
                  isSelected ? 'bg-[#eff6ff] border-l-[3px] border-l-[#155dfc] pl-[15px]' : ''
                }`}
                onClick={() => setActiveChat(chat)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0 rounded-full">
                    <AvatarFallback className={`rounded-full text-base font-normal flex items-center justify-center ${
                      isSelected ? 'bg-[#155dfc] text-white' : 'bg-[#e5e7eb] text-[#0a0a0a]'
                    }`}>
                      {chat.customer_name ? chat.customer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : chat.avatar ? chat.avatar : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-[#0a0a0a] truncate leading-5">
                        {chat.customer_name || chat.customer || 'Guest'}
                      </h4>
                      <span className="text-xs text-[#6a7282] flex-shrink-0">
                        {chat.last_message_at ? formatRelativeTime(chat.last_message_at) : chat.time || '\u2014'}
                      </span>
                    </div>
                    {agentName && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[10px] text-[#6a7282] leading-[15px]">
                          Handled by: <span className="font-medium text-[#364153]">{agentName}</span>
                        </span>
                        {(chat.ai_enabled || chat.isAIBot) && (
                          <Bot className="h-3 w-3 text-[#6a7282]" />
                        )}
                      </div>
                    )}
                    <p className="text-xs text-[#4a5565] truncate mb-1.5 leading-4">
                      {chat.preview || chat.last_message || 'No messages yet'}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg text-xs font-medium ${
                          isOnline
                            ? 'bg-[#f0fdf4] border border-[#b9f8cf] text-[#008236]'
                            : 'bg-gray-100 border border-gray-200 text-[#6a7282]'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-[#00a63e]' : 'bg-gray-400'}`} />
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                        {project && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] text-white"
                            style={{ backgroundColor: project.color || '#3b82f6' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                            {project.name}
                          </span>
                        )}
                      </div>
                      {(chat.unread > 0 || chat.unread_count > 0) && (
                        <span className="bg-[#155dfc] text-white text-xs font-medium h-5 min-w-[25px] px-2 rounded-lg flex items-center justify-center flex-shrink-0">
                          {chat.unread || chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

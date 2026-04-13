import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  MessageCircle,
  Search,
  User,
  Bot,
  Code2,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export interface ChatConversationsListProps {
  filteredChats: any[];
  activeChat: any;
  setActiveChat: (chat: any) => void;
  chatFilter: 'all' | 'active' | 'closed' | 'archived';
  setChatFilter: (filter: 'all' | 'active' | 'closed' | 'archived') => void;
  getProjectById: (id: string) => any;
  formatRelativeTime: (dateString: string) => string;
  totalProjects?: number;
  firstProjectId?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export function ChatConversationsList({
  filteredChats,
  activeChat,
  setActiveChat,
  chatFilter,
  setChatFilter,
  getProjectById,
  formatRelativeTime,
  totalProjects = 1,
  firstProjectId,
  onLoadMore,
  hasMore,
  loadingMore,
}: ChatConversationsListProps) {
  const location = useLocation();
  const basePath = `/${location.pathname.split('/')[1]}`;
  const [searchQuery, setSearchQuery] = useState('');
  // Re-render every 15s so online/offline status updates based on customer_last_seen_at
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  // Infinite scroll: observe sentinel at end of list
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore && onLoadMore) onLoadMore();
  }, [hasMore, loadingMore, onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) handleLoadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, onLoadMore]);

  const displayedChats = searchQuery.trim()
    ? filteredChats.filter((chat) => {
        const q = searchQuery.toLowerCase();
        const name = (chat.customer_name || chat.customer || '').toLowerCase();
        const preview = (chat.preview || chat.last_message || '').toLowerCase();
        return name.includes(q) || preview.includes(q);
      })
    : filteredChats;

  return (
    <div className="w-80 border-r border-[rgba(0,0,0,0.1)] bg-card flex flex-col">
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
              chatFilter === 'all' ? 'bg-[#030213] text-white' : 'bg-card border border-[rgba(0,0,0,0.1)] text-[#0a0a0a] hover:bg-muted/50'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setChatFilter('active')}
            className={`flex-1 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
              chatFilter === 'active' ? 'bg-[#030213] text-white' : 'bg-card border border-[rgba(0,0,0,0.1)] text-[#0a0a0a] hover:bg-muted/50'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setChatFilter('archived')}
            className={`flex-1 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
              chatFilter === 'archived' ? 'bg-[#030213] text-white' : 'bg-card border border-[rgba(0,0,0,0.1)] text-[#0a0a0a] hover:bg-muted/50'
            }`}
          >
            Archived
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {displayedChats.length === 0 ? (
          <div className="flex flex-col h-full p-4 overflow-y-auto">
            {searchQuery.trim() || chatFilter !== 'all' ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-medium text-[#0a0a0a] mb-1">
                  {searchQuery.trim() ? 'No matching conversations'
                    : chatFilter === 'active' ? 'No active conversations'
                    : chatFilter === 'archived' ? 'No archived conversations'
                    : 'No closed conversations'}
                </h3>
                <p className="text-xs text-[#6a7282] max-w-[180px]">
                  {searchQuery.trim() ? 'Try a different search term.'
                    : chatFilter === 'active' ? 'No active chats at the moment.'
                    : chatFilter === 'archived' ? 'Ended chats will appear here.'
                    : "They'll appear here once resolved."}
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0a0a0a]">No conversations yet</h3>
                  <p className="text-xs text-[#6a7282] mt-1">Get started by installing the widget on your site.</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-white">1</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#0a0a0a]">Install the chat widget</p>
                      <p className="text-[11px] text-[#6a7282] mt-0.5">Add a one-line script to your website. Go to Workspaces → Chat Widget → Embed Code.</p>
                      <Link to={firstProjectId ? `${basePath}/project/${firstProjectId}?tab=chat-widget` : `${basePath}/projects`}>
                        <Button variant="outline" size="sm" className="mt-1.5 h-6 text-[11px] px-2 gap-1">
                          <Code2 className="h-3 w-3" />Get embed code
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground">2</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#0a0a0a]">Verify it's working</p>
                      <p className="text-[11px] text-[#6a7282] mt-0.5">Open your site and start a test chat — it'll appear here instantly.</p>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-[11px] text-muted-foreground">Waiting for first conversation...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                className={`py-3 px-3 cursor-pointer border-b border-[rgba(0,0,0,0.1)] hover:bg-muted/50/50 transition-colors ${
                  isSelected ? 'bg-primary/10 border-l-[3px] border-l-primary pl-[15px]' : ''
                }`}
                onClick={() => setActiveChat(chat)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0 rounded-full">
                    <AvatarFallback className={`rounded-full text-base font-normal flex items-center justify-center ${
                      isSelected ? 'bg-primary text-white' : 'bg-muted text-[#0a0a0a]'
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
                            : 'bg-muted border border-border text-[#6a7282]'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-[#00a63e]' : 'bg-muted-foreground'}`} />
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                        {project && totalProjects > 1 && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] text-white"
                            style={{ backgroundColor: project.color || '#3b82f6' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                            {project.name}
                          </span>
                        )}
                        {chat.has_frubix && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#6366F1"/><text x="16" y="22" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="system-ui">F</text></svg>
                            Frubix
                          </span>
                        )}
                      </div>
                      {(chat.unread > 0 || chat.unread_count > 0) && (
                        <span className="bg-primary text-white text-xs font-medium h-5 min-w-[25px] px-2 rounded-lg flex items-center justify-center flex-shrink-0">
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
        {/* Infinite scroll sentinel */}
        {displayedChats.length > 0 && !searchQuery.trim() && (
          <div ref={sentinelRef} className="py-2">
            {loadingMore && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#6a7282]" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

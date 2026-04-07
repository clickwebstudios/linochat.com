import { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { articleService } from '../../services/articles';
import type { Article } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  MessageCircle,
  Ticket,
  FileText,
  User,
  Send,
  MoreVertical,
  X,
  Bookmark,
  Plus,
  ChevronDown,
  UserPlus,
  ArrowRightLeft,
  Sparkles,
  Bot,
  Loader2,
  Search,
  Mail,
  Phone,
  Settings,
} from 'lucide-react';
// Mock data removed

interface Message {
  id: string;
  chat_id: string;
  sender_type: 'customer' | 'agent' | 'ai' | 'system';
  sender_id?: string;
  content: string;
  is_ai?: boolean;
  created_at: string;
  isRead?: boolean;
  metadata?: { attachments?: Array<{ url: string; name: string }> };
}

export interface ChatMessageAreaProps {
  activeChat: any;
  activeChatProject: any;
  filteredChats: any[];
  messages: Message[];
  messagesLoading: boolean;
  chatMessage: string;
  setChatMessage: (value: string) => void;
  isSending: boolean;
  hasTakenOver: boolean;
  agentTyping: { agentName: string } | null;
  customerTyping: boolean;
  attachmentFiles: File[];
  setAttachmentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isTakingOverFromAgent: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage: () => void;
  onTakeOver: () => void;
  onShowTransferDialog: () => void;
  onShowCreateTicketDialog: () => void;
  onShowTakeoverDialog: () => void;
  onEndChat: () => void;
  sendAgentTyping: (isTyping: boolean) => void;
  formatRelativeTime: (dateString: string) => string;
  firstProjectId?: string;
}

export function ChatMessageArea({
  activeChat,
  activeChatProject,
  filteredChats,
  messages,
  messagesLoading,
  chatMessage,
  setChatMessage,
  isSending,
  hasTakenOver,
  agentTyping,
  customerTyping,
  attachmentFiles,
  setAttachmentFiles,
  isTakingOverFromAgent,
  messagesEndRef,
  onSendMessage,
  onTakeOver,
  onShowTransferDialog,
  onShowCreateTicketDialog,
  onShowTakeoverDialog,
  onEndChat,
  sendAgentTyping,
  formatRelativeTime,
  firstProjectId,
}: ChatMessageAreaProps) {
  const location = useLocation();
  const basePath = `/${location.pathname.split('/')[1]}`;
  const agentTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [kbOpen, setKbOpen] = useState(false);
  const [kbArticles, setKbArticles] = useState<Article[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSearch, setKbSearch] = useState('');

  useEffect(() => {
    if (!kbOpen || kbArticles.length > 0) return;
    setKbLoading(true);
    articleService.getAll({ project_id: activeChat?.project_id })
      .then((r) => setKbArticles(r.data ?? []))
      .catch(() => setKbArticles([]))
      .finally(() => setKbLoading(false));
  }, [kbOpen]);

  const filteredKbArticles = kbArticles.filter((a) =>
    !kbSearch || a.title.toLowerCase().includes(kbSearch.toLowerCase())
  );

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col bg-card">
        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-muted/30">
          {filteredChats.length > 0 ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">
                {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''} waiting on the left.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-lg space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">All channels in one place</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Connect your communication channels and manage every customer conversation from a single inbox.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Chat Widget</p>
                    <p className="text-xs text-muted-foreground">Embed a widget on your website — customers chat directly in your inbox.</p>
                  </div>
                  <Link to={firstProjectId ? `${basePath}/project/${firstProjectId}?tab=chat-widget` : `${basePath}/projects`} className="text-xs font-medium text-primary hover:underline whitespace-nowrap">Set up →</Link>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Facebook Messenger</p>
                    <p className="text-xs text-muted-foreground">Receive and reply to Messenger messages from your Facebook Page.</p>
                  </div>
                  <Link to={`${basePath}/settings`} className="text-xs font-medium text-primary hover:underline whitespace-nowrap">Connect →</Link>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Connect WhatsApp Business to handle customer messages at scale.</p>
                  </div>
                  <Link to={`${basePath}/settings`} className="text-xs font-medium text-primary hover:underline whitespace-nowrap">Connect →</Link>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground">Route inbound emails to your inbox and reply from your support address.</p>
                  </div>
                  <Link to={`${basePath}/settings`} className="text-xs font-medium text-primary hover:underline whitespace-nowrap">Connect →</Link>
                </div>
              </div>

              <div className="text-center">
                <Link to={`${basePath}/settings`}>
                  <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Settings className="h-4 w-4" />
                    Manage all integrations
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleTakeOverClick = () => {
    if (isTakingOverFromAgent) {
      onShowTakeoverDialog();
    } else {
      onTakeOver();
    }
  };

  // Deduplicate messages by id only — never filter system messages by chat status
  const processedMessages = (() => {
    const seen = new Set<string>();
    return messages.filter((m) => {
      const key = String(m.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  return (
    <div className="flex-1 flex flex-col bg-card">
      {/* Chat Header */}
      <div className="h-[74px] border-b border-[rgba(0,0,0,0.1)] px-4 flex items-center justify-between shrink-0">
        {/* Customer info (left) */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0 rounded-full bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground text-base font-normal flex items-center justify-center">
              {activeChat?.customer_name ? activeChat.customer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : activeChat?.avatar ? activeChat.avatar : <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-[#0a0a0a] leading-6 tracking-[-0.31px] truncate">
              {activeChat.customer_name || activeChat.customer || 'Guest'}
            </h4>
            <div className="flex items-center gap-2 text-xs text-[#6a7282] leading-4">
              <span className="flex items-center gap-1.5">
                {(() => {
                  const lastSeen = activeChat?.customer_last_seen_at ? new Date(activeChat.customer_last_seen_at).getTime() : 0;
                  const online = lastSeen > 0 && (Date.now() - lastSeen) < 30000;
                  return (
                    <>
                      <span className={`h-2 w-2 rounded-full ${online ? 'bg-[#00c950]' : 'bg-gray-400'}`} />
                      {online ? 'Online' : 'Offline'}
                    </>
                  );
                })()}
              </span>
              <span>&bull;</span>
              <span>ID: C-{activeChat?.id || '-'}</span>
              {activeChatProject && (
                <>
                  <span>&bull;</span>
                  <span
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary text-[10px] text-primary-foreground"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    {activeChatProject.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Actions (right) */}
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 px-3 h-8 rounded-lg border-[rgba(0,0,0,0.1)] bg-card hover:bg-muted/50">
                {(activeChat?.status === 'ai_handling' || (activeChat?.status === 'waiting' && !activeChat?.agent_id)) ? (
                  <>
                    <Avatar className="h-7 w-7 rounded-full">
                      <AvatarFallback className="bg-[#6b7280] text-white text-xs font-medium">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-[#0a0a0a]">AI Agent</span>
                  </>
                ) : (
                  <>
                    <Avatar className="h-7 w-7 rounded-full">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                        {activeChat?.agent_name ? activeChat.agent_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '\u2014'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-[#0a0a0a]">
                      {activeChat?.agent_name || 'Unassigned'}
                    </span>
                  </>
                )}
                <ChevronDown className="h-4 w-4 text-[#6a7282]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShowTransferDialog}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer to Another Operator
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-[rgba(0,0,0,0.1)] bg-card hover:bg-muted/50"
            onClick={handleTakeOverClick}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Take Over
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-[rgba(0,0,0,0.1)] bg-card hover:bg-muted/50">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShowCreateTicketDialog}>
                <Ticket className="mr-2 h-4 w-4" />
                Create Ticket
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={onEndChat}>
                <X className="mr-2 h-4 w-4" />
                End Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f9fafb]">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-[#6a7282]">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start the conversation by sending a message</p>
          </div>
        ) : (
          processedMessages.map((message, index, array) => {
            const isFirstUnread = !message.isRead && (index === 0 || array[index - 1].isRead);
            return (
              <div key={message.id}>
                {isFirstUnread && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-[#bedbff]" />
                    <div className="px-2.5 py-1 rounded-lg border border-transparent bg-[#dbeafe]">
                      <span className="text-xs font-medium text-primary">Unread Messages</span>
                    </div>
                    <div className="flex-1 h-px bg-[#bedbff]" />
                  </div>
                )}
                <div className={`flex ${message.sender_type === 'agent' || message.sender_type === 'ai' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${message.sender_type === 'agent' || message.sender_type === 'ai' ? 'max-w-[70%]' : 'max-w-[65%]'}`}>
                    {/* AI Label */}
                    {message.sender_type === 'ai' && (
                      <div className="flex items-center gap-1.5 mb-1 px-1 justify-end">
                        <span className="text-[10px] font-medium text-secondary">AI Assistant</span>
                        <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center">
                          <Bot className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                    )}
                    {/* System Message */}
                    {message.sender_type === 'system' && (
                      <div className="flex items-center justify-center my-2">
                        <span className="text-xs text-[#6a7282] bg-muted px-3 py-1 rounded-full">
                          {message.content}
                        </span>
                      </div>
                    )}
                    {message.sender_type !== 'system' && (
                      <div className={`px-3.5 py-2.5 shadow-sm border ${
                        message.sender_type === 'agent' || message.sender_type === 'ai'
                          ? 'bg-primary text-primary-foreground border-transparent rounded-2xl rounded-br-md'
                          : 'bg-white border-[#e5e7eb] text-[#0a0a0a] rounded-2xl rounded-bl-md'
                      }`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm leading-5">{message.content}</p>
                            {(message.metadata?.attachments?.length ?? 0) > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {message.metadata!.attachments!.map((a: { url: string; name: string }, i: number) => (
                                  <a
                                    key={i}
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    View: {a.name}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                          {!message.isRead && message.sender_type !== 'agent' && message.sender_type !== 'ai' && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    )}
                    {message.sender_type !== 'system' && (
                      <p className={`text-xs text-[#6a7282] mt-1 px-1 ${
                        message.sender_type === 'agent' || message.sender_type === 'ai' ? 'text-right' : ''
                      }`}>
                        {formatRelativeTime(message.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {(agentTyping || customerTyping) && (
          <div className="flex flex-col gap-1 py-2">
            {agentTyping && (
              <div className="flex justify-end">
                <span className="text-xs text-[#6a7282] bg-muted px-3 py-1.5 rounded-lg italic">
                  {agentTyping.agentName} is typing...
                </span>
              </div>
            )}
            {customerTyping && (
              <div className="flex justify-start">
                <span className="text-xs text-[#6a7282] bg-muted px-3 py-1.5 rounded-lg italic">
                  Customer is typing...
                </span>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[rgba(0,0,0,0.1)] p-4 bg-card shrink-0">
        {activeChat?.has_frubix ? (
          <a
            href="https://frubix.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-12 rounded-[10px] bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#6366F1"/><text x="16" y="22" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="system-ui">F</text></svg>
            <span className="text-sm text-indigo-600 font-medium">Managed by Frubix — agent replies are handled in the Frubix dashboard</span>
            <svg className="h-3.5 w-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
          </a>
        ) : !hasTakenOver ? (
          <div
            className="flex items-center justify-center gap-2 h-12 rounded-[10px] bg-[#f9fafb] border border-[#d1d5dc] cursor-pointer hover:bg-muted transition-colors"
            onClick={handleTakeOverClick}
          >
            <UserPlus className="h-4 w-4 text-[#6a7282]" />
            <span className="text-sm text-[#6a7282]">Take over this chat to reply</span>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Canned Responses
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 border-b">
                    <p className="text-sm text-muted-foreground">Click to insert into message</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {[
                      { title: 'Greeting', text: 'Hi there! Thank you for reaching out. How can I help you today?' },
                      { title: 'Troubleshooting', text: 'I understand the issue. Could you please try clearing your browser cache and cookies, then restart your browser?' },
                      { title: 'Escalation', text: "I appreciate your patience. I'm going to escalate this to our specialist team for a faster resolution." },
                      { title: 'Follow-up', text: 'Just checking in \u2014 were you able to resolve the issue with the steps provided? Let me know if you need further assistance.' },
                      { title: 'Closing', text: "Glad I could help! If you have any other questions, don't hesitate to reach out. Have a great day!" },
                    ].map((response) => (
                      <button
                        key={response.title}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                        onClick={() => setChatMessage(chatMessage ? `${chatMessage} ${response.text}` : response.text)}
                      >
                        <p className="text-sm">{response.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{response.text}</p>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Popover open={kbOpen} onOpenChange={setKbOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4 mr-2" />
                    KB Articles
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search articles…"
                        className="pl-8 h-8 text-sm"
                        value={kbSearch}
                        onChange={(e) => setKbSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {kbLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredKbArticles.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {kbSearch ? 'No articles match' : 'No articles found'}
                      </p>
                    ) : filteredKbArticles.map((article) => (
                      <button
                        key={article.id}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                        onClick={() => {
                          const url = article.slug ? `${window.location.origin}/help/${article.slug}` : null;
                          const insert = url ? `${article.title}: ${url}` : article.title;
                          setChatMessage(chatMessage ? `${chatMessage}\n${insert}` : insert);
                          setKbOpen(false);
                        }}
                      >
                        <p className="text-sm font-medium">{article.title}</p>
                        {article.category && <p className="text-xs text-muted-foreground mt-0.5">{article.category}</p>}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*,.pdf,.doc,.docx,.txt,.csv';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files.length > 0) {
                      setAttachmentFiles((prev) => [...prev, ...Array.from(files)]);
                    }
                  };
                  input.click();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Attachment
                {attachmentFiles.length > 0 && (
                  <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 rounded">
                    {attachmentFiles.length}
                  </span>
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Type your message..."
                  className="flex-1 pr-10 rounded-[10px] border-[#d1d5dc] bg-[#f9fafb]"
                  value={chatMessage}
                  onChange={(e) => {
                    setChatMessage(e.target.value);
                    if (!hasTakenOver) return;
                    if (agentTypingTimeoutRef.current) clearTimeout(agentTypingTimeoutRef.current);
                    sendAgentTyping(true);
                    agentTypingTimeoutRef.current = setTimeout(() => {
                      sendAgentTyping(false);
                      agentTypingTimeoutRef.current = null;
                    }, 2000);
                  }}
                  onBlur={() => {
                    if (agentTypingTimeoutRef.current) {
                      clearTimeout(agentTypingTimeoutRef.current);
                      agentTypingTimeoutRef.current = null;
                    }
                    sendAgentTyping(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSendMessage();
                    }
                  }}
                  disabled={isSending}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-secondary hover:text-secondary hover:bg-secondary/10 transition-colors"
                      title="AI Suggested Responses"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="end" side="top">
                    <div className="p-3 border-b bg-gradient-to-r from-secondary/10 to-primary/10 rounded-t-md">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-secondary" />
                        <p className="text-sm text-secondary">AI Suggested Responses</p>
                      </div>
                      <p className="text-xs text-secondary mt-1">Based on the conversation context</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {[
                        { tone: 'Professional', text: `Thank you for bringing this to our attention, ${activeChat?.customer_name || activeChat?.customer || 'Guest'}. I've reviewed the details and I'd like to help resolve this for you right away. Let me look into the specifics.` },
                        { tone: 'Empathetic', text: `I completely understand your frustration, ${activeChat?.customer_name || activeChat?.customer || 'Guest'}. This is definitely not the experience we want you to have. Let me personally ensure we get this sorted out for you.` },
                        { tone: 'Solution-focused', text: `Great news \u2014 I've identified a solution for your issue. Here's what I recommend: First, let's verify your current settings, then I'll walk you through the fix step by step.` },
                        { tone: 'Follow-up', text: `I wanted to follow up on your earlier concern. I've checked with our team and we have an update for you. Would you like me to walk you through the next steps?` },
                      ].map((suggestion) => (
                        <button
                          key={suggestion.tone}
                          className="w-full text-left px-3 py-3 hover:bg-secondary/10 border-b last:border-b-0 transition-colors group"
                          onClick={() => setChatMessage(suggestion.text)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{suggestion.tone}</span>
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Click to use</span>
                          </div>
                          <p className="text-sm text-foreground line-clamp-2 mt-1">{suggestion.text}</p>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                size="icon"
                className="bg-primary hover:bg-primary/90 h-10 w-10 rounded-[10px]"
                onClick={onSendMessage}
                disabled={!chatMessage.trim() || isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useRef } from 'react';
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
  Info,
  UserPlus,
  ArrowRightLeft,
  Sparkles,
  Bot,
  Loader2,
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
  showActivityHistory: boolean;
  setShowActivityHistory: (value: boolean) => void;
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
  showActivityHistory,
  setShowActivityHistory,
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
}: ChatMessageAreaProps) {
  const agentTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col bg-card">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/50">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <MessageCircle className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Select a conversation
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Choose a chat from the list on the left to view messages and respond to customers.
          </p>
          {filteredChats.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''} available
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
          <Button
            variant="outline"
            size="sm"
            className={`h-8 rounded-lg border-[rgba(0,0,0,0.1)] bg-card hover:bg-muted/50 ${showActivityHistory ? 'bg-primary/10 border-primary' : ''}`}
            onClick={() => setShowActivityHistory(!showActivityHistory)}
          >
            <Info className="h-4 w-4 mr-2" />
            Info
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
                  <div className="max-w-[70%]">
                    {/* AI Label */}
                    {message.sender_type === 'ai' && (
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center">
                          <Bot className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-secondary">AI Assistant</span>
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
                      <div className={`rounded-[10px] px-3.5 py-3 shadow-sm border ${
                        message.sender_type === 'agent' || message.sender_type === 'ai'
                          ? 'bg-primary text-primary-foreground border-transparent'
                          : 'bg-card border-[rgba(0,0,0,0.1)] text-[#0a0a0a]'
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
        {!hasTakenOver ? (
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4 mr-2" />
                    KB Articles
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 border-b">
                    <p className="text-sm text-muted-foreground">Insert article link into message</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {([] as { id: number; title: string; category: string }[]).map((article) => (
                      <button
                        key={article.id}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                        onClick={() => setChatMessage(chatMessage ? `${chatMessage} [KB: ${article.title}]` : `[KB: ${article.title}]`)}
                      >
                        <p className="text-sm">{article.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{article.category}</p>
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

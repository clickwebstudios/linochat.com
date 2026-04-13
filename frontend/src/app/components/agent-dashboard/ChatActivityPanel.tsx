import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  MessageCircle,
  User,
  Clock,
  Eye,
  MapPin,
  Calendar,
  Tag,
  History,
  Info,
  Ticket,
  Mail,
  ChevronDown,
  ChevronUp,
  Loader2,
  Phone,
  BookOpen,
  Search,
  ExternalLink,
} from 'lucide-react';
import { articleService } from '../../services/articles';
import type { Article } from '../../types';

interface ActivityData {
  customer: string;
  customer_email: string;
  sessionStart: string;
  sessionDuration?: string;
  chatInitiatedFrom: string;
  location: string;
  device: string;
  browser: string;
  referralSource: string;
  pagesVisited: Array<{ page: string; url: string; timestamp: string; duration: string }>;
  previousChats: Array<{ id: string; date: string; topic: string; duration: string; agent: string }>;
  totalTickets: number;
  customerTier: string | null;
}

export interface ChatActivityPanelProps {
  activeChat: any;
  activity: ActivityData | null;
  activityLoading: boolean;
  onClose: () => void;
  onOpenPreviousChat: (chat: any) => void;
  onInjectLink?: (text: string) => void;
}

type Tab = 'info' | 'kb' | 'history';

export function ChatActivityPanel({
  activeChat,
  activity,
  activityLoading,
  onOpenPreviousChat,
  onInjectLink,
}: ChatActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);
  const [showSessionInfo, setShowSessionInfo] = useState(true);

  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articleSearch, setArticleSearch] = useState('');

  useEffect(() => {
    if (activeTab === 'kb' && articles.length === 0) {
      setArticlesLoading(true);
      articleService.getAll({ project_id: activeChat?.project_id })
        .then((r) => setArticles(r.data ?? []))
        .catch(() => setArticles([]))
        .finally(() => setArticlesLoading(false));
    }
  }, [activeTab]);

  const filteredArticles = articles.filter((a) =>
    !articleSearch || a.title.toLowerCase().includes(articleSearch.toLowerCase())
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Info', icon: <Info className="h-3.5 w-3.5" /> },
    { key: 'kb', label: 'KB', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { key: 'history', label: 'History', icon: <History className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="w-96 border-l border-[rgba(0,0,0,0.1)] bg-card flex flex-col animate-in slide-in-from-right duration-200">
      {/* Tab bar */}
      <div className="border-b border-[rgba(0,0,0,0.1)] shrink-0">
        <div className="px-2 pt-2">
          <p className="text-xs text-[#6a7282] px-2 pb-1 truncate">
            {activity?.customer || activeChat?.customer_name || activeChat?.customer || 'Guest'}
          </p>
        </div>
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#6a7282] hover:text-[#101828]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <>
            {activityLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !activity ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No activity data available</p>
                <p className="text-xs text-muted-foreground mt-1">Activity history will appear here</p>
              </div>
            ) : (
              <>
                {/* Customer Details */}
                <div className="border border-[rgba(0,0,0,0.1)] rounded-[10px] bg-card overflow-hidden">
                  <button
                    onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <h4 className="text-sm font-semibold text-[#101828] flex items-center gap-2">
                      <User className="h-4 w-4 text-[#6a7282]" />
                      Customer Details
                    </h4>
                    {showCustomerDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {showCustomerDetails && (
                    <div className="p-3 pt-0 border-t border-[rgba(0,0,0,0.1)] space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#6a7282]"><User className="h-3 w-3" /><span>Name</span></div>
                        <p className="text-sm font-medium text-[#0a0a0a]">{activeChat?.customer_name && !['Guest', 'Visitor', 'Hello', 'Hi', 'Hey'].includes(activeChat.customer_name) ? activeChat.customer_name : '\u2014'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#6a7282]"><Phone className="h-3 w-3" /><span>Phone</span></div>
                        <p className="text-sm font-medium text-[#0a0a0a]">{(activeChat?.metadata as any)?.customer_phone || '\u2014'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#6a7282]"><Mail className="h-3 w-3" /><span>Email</span></div>
                        <p className="text-sm font-medium text-[#0a0a0a]">{activity.customer_email || activeChat?.customer_email || '\u2014'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#6a7282]"><MapPin className="h-3 w-3" /><span>Location</span></div>
                        <p className="text-sm font-medium text-[#0a0a0a]">{activity.location}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#6a7282]"><Ticket className="h-3 w-3" /><span>Total Tickets</span></div>
                        <p className="text-sm font-medium text-[#0a0a0a]">{activity.totalTickets ? `${activity.totalTickets} tickets` : '\u2014'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#6a7282]"><Tag className="h-3 w-3" /><span>Customer Tier</span></div>
                        <Badge className={activity.customerTier ? 'bg-secondary text-secondary-foreground text-xs rounded-lg' : 'bg-muted text-muted-foreground'}>{activity.customerTier ?? 'Standard'}</Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Session Information */}
                <div className="border border-[rgba(0,0,0,0.1)] rounded-[10px] bg-card overflow-hidden">
                  <button
                    onClick={() => setShowSessionInfo(!showSessionInfo)}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <h4 className="text-sm font-semibold text-[#101828] flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#6a7282]" />
                      Session Information
                    </h4>
                    {showSessionInfo ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {showSessionInfo && (
                    <div className="p-3 pt-0 border-t border-[rgba(0,0,0,0.1)] space-y-3">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                        <div><p className="text-xs text-[#4a5565]">Session Started</p><p className="text-sm text-[#0a0a0a]">{activity.sessionStart}</p></div>
                      </div>
                      {activity.sessionDuration && (
                        <div className="flex items-start gap-2">
                          <History className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                          <div><p className="text-xs text-[#4a5565]">Session Duration</p><p className="text-sm text-[#0a0a0a]">{activity.sessionDuration}</p></div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                        <div><p className="text-xs text-[#4a5565]">Location</p><p className="text-sm text-[#0a0a0a]">{activity.location || '—'}</p></div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                        <div><p className="text-xs text-[#4a5565]">Device</p><p className="text-sm text-[#0a0a0a]">{activity.device}</p></div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Eye className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                        <div><p className="text-xs text-[#4a5565]">Browser</p><p className="text-sm text-[#0a0a0a]">{activity.browser}</p></div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Tag className="h-4 w-4 text-[#4a5565] mt-0.5 shrink-0" />
                        <div><p className="text-xs text-[#4a5565]">Referral Source</p><p className="text-sm text-[#0a0a0a]">{activity.referralSource}</p></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Initiated From */}
                <div>
                  <h4 className="text-xs font-semibold text-[#6a7282] uppercase tracking-wide mb-3">Chat Initiated From</h4>
                  <div className="bg-primary/10 border border-primary/20 rounded-[10px] p-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-primary">{activity.chatInitiatedFrom}</p>
                        <p className="text-xs text-primary">Current page when chat started</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pages Visited */}
                <div>
                  <h4 className="text-xs font-semibold text-[#6a7282] uppercase tracking-wide mb-3">Pages Visited</h4>
                  <div className="space-y-2">
                    {activity.pagesVisited.map((page, index) => (
                      <div key={index} className="border border-[rgba(0,0,0,0.1)] rounded-[10px] p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-[#0a0a0a]">{page.page}</p>
                          <span className="text-xs text-[#6a7282]">{page.duration}</span>
                        </div>
                        <p className="text-xs text-[#6a7282] font-mono">{page.url}</p>
                        <p className="text-xs text-[#99a1af] mt-1">{page.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* KB TAB */}
        {activeTab === 'kb' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles…"
                className="pl-9 h-9 text-sm"
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
              />
            </div>
            {articlesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {articleSearch ? 'No articles match your search' : 'No knowledge base articles yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="border border-[rgba(0,0,0,0.1)] rounded-[10px] p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#0a0a0a] mb-1 flex-1">{article.title}</p>
                      {onInjectLink && (
                        <button
                          onClick={() => {
                            const url = article.slug ? `${window.location.origin}/help/${article.slug}` : null;
                            onInjectLink(url ? `${article.title}: ${url}` : article.title);
                          }}
                          className="shrink-0 flex items-center gap-1 text-xs text-primary font-medium hover:underline mt-0.5"
                          title="Insert link into chat"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Insert
                        </button>
                      )}
                    </div>
                    {article.excerpt && (
                      <p className="text-xs text-[#6a7282] line-clamp-2">{article.excerpt}</p>
                    )}
                    {article.category && (
                      <Badge variant="outline" className="mt-2 text-xs border-[rgba(0,0,0,0.1)]">{article.category}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <>
            {activityLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !activity ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No activity data available</p>
              </div>
            ) : activity.previousChats.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#6a7282] uppercase tracking-wide">
                  Previous Conversations
                  <Badge className="ml-2 bg-primary text-primary-foreground text-xs rounded-lg px-2">{activity.previousChats.length}</Badge>
                </p>
                {activity.previousChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="border border-[rgba(0,0,0,0.1)] rounded-[10px] p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onOpenPreviousChat(chat)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-primary hover:underline">{chat.topic}</p>
                      <Badge variant="outline" className="text-xs border-[rgba(0,0,0,0.1)] text-[#0a0a0a]">{chat.duration}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#6a7282]">
                      <Calendar className="h-3 w-3" />
                      <span>{chat.date}</span>
                      <span>&bull;</span>
                      <User className="h-3 w-3" />
                      <span>{chat.agent}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No previous conversations</p>
                <p className="text-xs text-muted-foreground mt-1">This is their first time chatting</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

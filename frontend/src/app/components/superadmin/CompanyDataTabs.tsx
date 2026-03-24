import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  FileText,
  BookOpen,
  Eye,
  CircleDot,
  Download,
  UserPlus,
  Headphones,
  Settings,
  Shield,
  CreditCard,
  Globe,
  Building2,
  FolderKanban,
  ArrowUpRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  website?: string;
  domain?: string;
  tickets: number;
  totalTickets: number;
  activeTickets: number;
  members: number;
  companyId: string;
  status?: string;
}

interface Chat {
  id: string;
  customer: string;
  avatar: string;
  preview: string;
  agent: string;
  status: string;
  time: string;
  unread: number;
  isAIBot?: boolean;
  projectId: string;
}

interface Ticket {
  id: string;
  subject: string;
  customer: string;
  priority: string;
  status: string;
  assignedTo: string;
  created: string;
  projectId: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  status?: string;
  activeTickets?: number;
  resolvedToday?: number;
  companyId: string;
}

interface Company {
  id: string;
  name: string;
  plan: string;
  email?: string;
  location?: string;
  joined?: string;
  mrr?: string;
  status?: string;
  usage?: number;
  color?: string;
}

interface CompanyDataTabsProps {
  tab: 'chats' | 'tickets' | 'kb' | 'agents' | 'transactions' | 'history';
  companyChats: Chat[];
  companyTickets: Ticket[];
  companyAgents: Agent[];
  companyProjects: Project[];
  company: Company;
  viewingCompanyId: string;
  isArchived: boolean;
  onDeleteChat?: (chatId: string) => void;
  defaultMeta: {
    mrr: string;
    joined: string;
    usage: number;
  };
}

export function CompanyDataTabs({
  tab,
  companyChats,
  companyTickets,
  companyAgents,
  companyProjects,
  company,
  viewingCompanyId,
  isArchived,
  onDeleteChat,
  defaultMeta,
}: CompanyDataTabsProps) {
  const navigate = useNavigate();

  const getProjectById = (projectId: string) => {
    return companyProjects.find(p => p.id === projectId);
  };

  if (tab === 'chats') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Chats</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search chats..." className="pl-8 h-9 w-[200px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {companyChats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyChats.map(chat => {
                    const project = getProjectById(chat.projectId);
                    return (
                      <TableRow key={chat.id} className={`hover:bg-muted/50 ${isArchived ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isArchived && navigate(`/superadmin/chats/${chat.id}`)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">{chat.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{chat.customer}</p>
                              {chat.unread > 0 && <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">{chat.unread}</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{chat.preview}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            {chat.isAIBot && <CircleDot className="h-3.5 w-3.5 text-secondary" />}
                            <span>{chat.agent}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{project?.name || '\u2014'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={chat.status === 'active' ? 'text-green-600 border-green-600 text-xs' : 'text-muted-foreground border-border text-xs'}>
                            {chat.status === 'active' ? 'Active' : 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{chat.time}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/superadmin/chats/${chat.id}`); }}>
                                <Eye className="h-4 w-4 mr-2" />View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={e => { e.stopPropagation(); onDeleteChat?.(chat.id); }}>
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No chats found for this company</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tab === 'tickets') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Support Tickets</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tickets..." className="pl-8 h-9 w-[200px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {companyTickets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyTickets.map(ticket => (
                    <TableRow key={ticket.id} className={`hover:bg-muted/50 ${isArchived ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isArchived && navigate(`/superadmin/tickets/${ticket.id}`)}>
                      <TableCell className="font-mono text-sm text-primary">{ticket.id}</TableCell>
                      <TableCell className="font-semibold text-sm">{ticket.subject}</TableCell>
                      <TableCell className="text-sm">{ticket.customer}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${ticket.priority === 'high' ? 'text-red-600 border-red-600' : ticket.priority === 'medium' ? 'text-yellow-600 border-yellow-600' : 'text-muted-foreground border-border'}`}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'}`}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{ticket.assignedTo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ticket.created}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No tickets found for this company</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tab === 'kb') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Knowledge Base Articles</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search articles..." className="pl-8 h-9 w-[200px]" />
              </div>
              <Button size="sm" className="bg-primary" disabled={isArchived} onClick={() => navigate('/superadmin/create-article', { state: { companyId: viewingCompanyId, companyName: company.name } })}><Plus className="h-4 w-4 mr-1" />New Article</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: 1, title: 'Getting Started Guide', category: 'Onboarding', status: 'Published', views: 1250, helpful: 89, updated: 'Feb 5, 2026' },
                  { id: 2, title: 'How to Reset Your Password', category: 'Account', status: 'Published', views: 890, helpful: 95, updated: 'Jan 28, 2026' },
                  { id: 3, title: 'Billing & Invoices FAQ', category: 'Billing', status: 'Published', views: 560, helpful: 72, updated: 'Jan 15, 2026' },
                  { id: 4, title: 'API Integration Guide', category: 'Developer', status: 'Draft', views: 120, helpful: 60, updated: 'Feb 8, 2026' },
                  { id: 5, title: 'Troubleshooting Common Issues', category: 'Support', status: 'Published', views: 734, helpful: 81, updated: 'Feb 1, 2026' },
                ].map(article => (
                  <TableRow key={article.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">{article.title}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{article.category}</Badge></TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${article.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{article.updated}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tab === 'agents') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">All Agents</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search agents..." className="pl-8 h-9 w-[200px]" />
              </div>
              <Button size="sm" className="bg-primary"><UserPlus className="h-4 w-4 mr-1" />Invite Agent</Button>
            </div>
          </CardHeader>
          <CardContent>
            {companyAgents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active Tickets</TableHead>
                    <TableHead>Resolved Today</TableHead>
                    <TableHead>Avg Response</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyAgents.map((agent, idx) => {
                    const statuses = ['Online', 'Away', 'Offline'] as const;
                    const agentStatus = agent.status || statuses[idx % 3];
                    const activeCount = agent.activeTickets || [3, 5, 2, 4, 1][idx % 5];
                    const resolvedCount = agent.resolvedToday || [12, 8, 15, 6, 10][idx % 5];
                    const avgResp = ['1.8 min', '2.3 min', '1.5 min', '3.1 min', '2.0 min'][idx % 5];
                    return (
                      <TableRow key={agent.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${agentStatus === 'Online' ? 'bg-green-500' : agentStatus === 'Away' ? 'bg-yellow-500' : 'bg-muted-foreground'}`} />
                            </div>
                            <span className="font-semibold text-sm">{agent.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{agent.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${agentStatus === 'Online' ? 'text-green-600 border-green-600' : agentStatus === 'Away' ? 'text-yellow-600 border-yellow-600' : 'text-muted-foreground border-border'}`}>
                            {agentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{activeCount}</TableCell>
                        <TableCell className="font-semibold text-green-600">{resolvedCount}</TableCell>
                        <TableCell className="text-sm">{avgResp}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem><MessageSquare className="mr-2 h-4 w-4" />View Chats</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <Headphones className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No agents assigned</p>
                <Button size="sm" className="mt-3 bg-primary"><UserPlus className="h-4 w-4 mr-1" />Invite First Agent</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tab === 'transactions') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Transaction History</CardTitle>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: 'INV-2026-012', date: 'Feb 1, 2026', desc: `${company.plan} Plan - Monthly`, amount: defaultMeta.mrr, status: 'Paid' },
                  { id: 'INV-2026-008', date: 'Jan 1, 2026', desc: `${company.plan} Plan - Monthly`, amount: defaultMeta.mrr, status: 'Paid' },
                  { id: 'INV-2025-052', date: 'Dec 1, 2025', desc: `${company.plan} Plan - Monthly`, amount: defaultMeta.mrr, status: 'Paid' },
                  { id: 'INV-2025-047', date: 'Nov 1, 2025', desc: `${company.plan} Plan - Monthly`, amount: defaultMeta.mrr, status: 'Paid' },
                  { id: 'INV-2025-039', date: 'Oct 1, 2025', desc: `${company.plan} Plan - Monthly`, amount: defaultMeta.mrr, status: 'Paid' },
                  { id: 'INV-2025-031', date: 'Sep 1, 2025', desc: 'Plan Upgrade Fee', amount: '$49.00', status: 'Paid' },
                ].map(tx => (
                  <TableRow key={tx.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-primary">{tx.id}</TableCell>
                    <TableCell className="text-sm">{tx.date}</TableCell>
                    <TableCell className="text-sm">{tx.desc}</TableCell>
                    <TableCell className="font-semibold">{tx.amount}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 text-xs">{tx.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs"><Download className="h-3.5 w-3.5 mr-1" />PDF</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tab === 'history') {
    const events: { icon: LucideIcon; color: string; action: string; detail: string; time: string; date: string }[] = [
      { icon: Headphones, color: 'bg-green-100 text-green-600', action: 'New agent added', detail: 'James Wilson joined the team', time: '2 hours ago', date: 'Feb 11, 2026' },
      { icon: FolderKanban, color: 'bg-primary/10 text-primary', action: 'Project created', detail: 'Mobile App project was created', time: '1 day ago', date: 'Feb 10, 2026' },
      { icon: CreditCard, color: 'bg-secondary/10 text-secondary', action: 'Payment received', detail: `Invoice INV-2026-012 paid \u2014 ${defaultMeta.mrr}`, time: '3 days ago', date: 'Feb 8, 2026' },
      { icon: ArrowUpRight, color: 'bg-orange-100 text-orange-600', action: 'Plan upgraded', detail: `Upgraded from Starter to ${company.plan}`, time: '1 week ago', date: 'Feb 4, 2026' },
      { icon: Settings, color: 'bg-muted text-muted-foreground', action: 'Settings updated', detail: 'Chat widget appearance was customized', time: '1 week ago', date: 'Feb 3, 2026' },
      { icon: UserPlus, color: 'bg-teal-100 text-teal-600', action: 'Agent invited', detail: 'Invitation sent to emily@company.com', time: '2 weeks ago', date: 'Jan 28, 2026' },
      { icon: BookOpen, color: 'bg-indigo-100 text-indigo-600', action: 'KB article published', detail: 'Published "Getting Started Guide"', time: '2 weeks ago', date: 'Jan 27, 2026' },
      { icon: Shield, color: 'bg-red-100 text-red-600', action: 'Security alert', detail: 'Admin password was changed', time: '3 weeks ago', date: 'Jan 21, 2026' },
      { icon: Globe, color: 'bg-cyan-100 text-cyan-600', action: 'Domain verified', detail: `${companyProjects[0]?.website?.replace('https://', '') || 'company.com'} was verified`, time: '1 month ago', date: 'Jan 11, 2026' },
      { icon: Building2, color: 'bg-amber-100 text-amber-600', action: 'Company registered', detail: `${company.name} account was created`, time: defaultMeta.joined, date: defaultMeta.joined },
    ];

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Activity History</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search activity..." className="pl-8 h-9 w-[200px]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {events.map((event, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${event.color.split(' ')[0]}`}>
                    <event.icon className={`h-4 w-4 ${event.color.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{event.action}</p>
                    <p className="text-xs text-muted-foreground">{event.detail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                    <p className="text-[10px] text-muted-foreground/60">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

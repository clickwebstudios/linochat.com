import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  MessageCircle,
  Ticket,
  User,
  AlertCircle,
  Calendar,
  UserPlus,
  ArrowRightLeft,
  Sparkles,
  Bot,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { TICKET_CATEGORIES } from '../../lib/constants';

interface AvailableOperator {
  id: string;
  name: string;
  avatar: string;
  status: string;
  activeChats: number;
}

export interface ChatDialogsProps {
  activeChat: any;
  projects: any[];

  // Previous chat popup
  showChatPopup: boolean;
  setShowChatPopup: (value: boolean) => void;
  selectedPreviousChat: any;

  // Create ticket dialog
  showCreateTicketDialog: boolean;
  setShowCreateTicketDialog: (value: boolean) => void;
  newTicket: {
    subject: string;
    priority: string;
    category: string;
    description: string;
    customerName: string;
    customerEmail: string;
    projectId: string;
  };
  setNewTicket: (ticket: ChatDialogsProps['newTicket']) => void;
  isGeneratingSubject: boolean;
  isCreatingTicket: boolean;
  setIsCreatingTicket: (value: boolean) => void;
  onGenerateSubject: () => void;

  // Takeover dialog
  showTakeoverDialog: boolean;
  setShowTakeoverDialog: (value: boolean) => void;
  isTakingOver: boolean;
  takeoverError: string | null;
  setTakeoverError: (value: string | null) => void;
  onExecuteTakeOver: () => void;

  // Transfer dialog
  showTransferDialog: boolean;
  setShowTransferDialog: (value: boolean) => void;
  availableOperators: AvailableOperator[];
  transferStep: 'select' | 'reason';
  setTransferStep: (step: 'select' | 'reason') => void;
  selectedOperatorForTransfer: any;
  setSelectedOperatorForTransfer: (operator: any) => void;
  transferReason: string;
  setTransferReason: (reason: string) => void;
  onSubmitTransfer: () => void;
  onRefreshTeamMembers?: () => void;
}

// ── Standalone Create Ticket dialog with validation ──────────────────────────
function CreateTicketFromChatDialog({
  activeChat, projects, open, onOpenChange, newTicket, setNewTicket,
  isGeneratingSubject, isCreatingTicket, setIsCreatingTicket, onGenerateSubject, onClose,
}: {
  activeChat: any; projects: any[]; open: boolean; onOpenChange: (v: boolean) => void;
  newTicket: ChatDialogsProps['newTicket']; setNewTicket: ChatDialogsProps['setNewTicket'];
  isGeneratingSubject: boolean; isCreatingTicket: boolean; setIsCreatingTicket: (v: boolean) => void;
  onGenerateSubject: () => void; onClose: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!newTicket.subject.trim()) e.subject = 'Subject is required';
    if (!newTicket.customerEmail.trim()) e.customerEmail = 'Customer email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTicket.customerEmail)) e.customerEmail = 'Enter a valid email';
    if (!newTicket.projectId) e.projectId = 'Project is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsCreatingTicket(true);
    try {
      const res = await api.post<{ ticket_number?: string }>('/agent/tickets', {
        project_id: newTicket.projectId,
        subject: newTicket.subject,
        description: newTicket.description || newTicket.subject,
        priority: newTicket.priority,
        category: newTicket.category || undefined,
        customer_name: newTicket.customerName || undefined,
        customer_email: newTicket.customerEmail,
        chat_id: activeChat?.id,
      });
      const ticketNum = (res as any)?.ticket_number || (res as any)?.data?.ticket_number || '';
      toast.success(ticketNum ? `Ticket ${ticketNum} created successfully` : 'Ticket created successfully');
      setErrors({});
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.errors) {
        // Show first validation error from API and highlight fields
        const apiErrors: Record<string, string> = {};
        Object.entries(data.errors).forEach(([field, msgs]: [string, any]) => {
          apiErrors[field] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(apiErrors);
        const firstMsg = Object.values(apiErrors)[0];
        toast.error(firstMsg);
      } else {
        toast.error(data?.message || 'Failed to create ticket');
      }
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const field = (key: string) => errors[key]
    ? 'border-red-500 focus:ring-red-500'
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create Ticket from Chat</DialogTitle>
          <DialogDescription>Convert this chat conversation into a support ticket for tracking and follow-up.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input id="ticket-subject" placeholder="Enter ticket subject" value={newTicket.subject}
                onChange={(e) => { setNewTicket({ ...newTicket, subject: e.target.value }); setErrors(p => ({ ...p, subject: '' })); }}
                className={`pr-12 ${field('subject')}`} />
              <Button type="button" size="sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/10" onClick={onGenerateSubject} disabled={isGeneratingSubject} title="Generate subject with AI">
                <Sparkles className={`h-4 w-4 text-primary ${isGeneratingSubject ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
            {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
          </div>
          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-4 gap-2">
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <button key={priority} type="button"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    newTicket.priority === priority
                      ? priority === 'urgent' ? 'bg-red-600 text-white' : priority === 'high' ? 'bg-orange-600 text-white' : priority === 'medium' ? 'bg-yellow-600 text-white' : 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setNewTicket({ ...newTicket, priority })}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="ticket-category">Category</Label>
            <select id="ticket-category" className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}>
              <option value="">Select a category</option>
              {TICKET_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          {/* Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input id="customer-name" value={newTicket.customerName} onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Customer Email <span className="text-red-500">*</span></Label>
              <Input id="customer-email" type="email" placeholder="customer@example.com" value={newTicket.customerEmail}
                onChange={(e) => { setNewTicket({ ...newTicket, customerEmail: e.target.value }); setErrors(p => ({ ...p, customerEmail: '', customer_email: '' })); }}
                className={field('customerEmail') || field('customer_email')} />
              {(errors.customerEmail || errors.customer_email) && <p className="text-xs text-red-500">{errors.customerEmail || errors.customer_email}</p>}
            </div>
          </div>
          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="ticket-project">Workspace <span className="text-red-500">*</span></Label>
            <select id="ticket-project" className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.projectId ? 'border-red-500' : 'border-border'}`} value={newTicket.projectId} onChange={(e) => { setNewTicket({ ...newTicket, projectId: e.target.value }); setErrors(p => ({ ...p, projectId: '' })); }}>
              <option value="">Select a workspace</option>
              {projects.map((project) => (<option key={project.id} value={project.id}>{project.name}</option>))}
            </select>
            {errors.projectId && <p className="text-xs text-red-500">{errors.projectId}</p>}
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea id="ticket-description" placeholder="Provide a detailed description of the issue or request..." rows={6} value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} />
            <p className="text-xs text-muted-foreground">Include relevant details from the chat conversation to help resolve the ticket.</p>
          </div>
          {/* Chat Context */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary"><MessageCircle className="h-4 w-4" />Chat Context</div>
            <div className="text-sm text-primary">
              <p><strong>Customer:</strong> {activeChat?.customer_name || activeChat?.customer || 'Guest'}</p>
              <p><strong>Last Message:</strong> {activeChat?.preview || activeChat?.last_message || 'N/A'}</p>
              <p><strong>Chat Time:</strong> {activeChat?.created_at ? new Date(activeChat.created_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isCreatingTicket} className="bg-primary hover:bg-primary/90">
            <Ticket className="mr-2 h-4 w-4" />{isCreatingTicket ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ChatDialogs({
  activeChat,
  projects,
  showChatPopup,
  setShowChatPopup,
  selectedPreviousChat,
  showCreateTicketDialog,
  setShowCreateTicketDialog,
  newTicket,
  setNewTicket,
  isGeneratingSubject,
  isCreatingTicket,
  setIsCreatingTicket,
  onGenerateSubject,
  showTakeoverDialog,
  setShowTakeoverDialog,
  isTakingOver,
  takeoverError,
  setTakeoverError,
  onExecuteTakeOver,
  showTransferDialog,
  setShowTransferDialog,
  availableOperators,
  transferStep,
  setTransferStep,
  selectedOperatorForTransfer,
  setSelectedOperatorForTransfer,
  transferReason,
  setTransferReason,
  onSubmitTransfer,
  onRefreshTeamMembers,
}: ChatDialogsProps) {
  const resetTicketForm = () => {
    setNewTicket({
      subject: '',
      priority: 'medium',
      category: '',
      description: '',
      customerName: activeChat?.customer_name || activeChat?.customer || '',
      customerEmail: '',
      projectId: activeChat?.project_id || activeChat?.projectId || '',
    });
  };

  return (
    <>
      {/* Previous Chat Popup */}
      <Dialog open={showChatPopup} onOpenChange={setShowChatPopup}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                {selectedPreviousChat?.topic}
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={() => { window.open(`/chat-history/${activeChat?.id}/${selectedPreviousChat?.date}`, '_blank'); }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Window
              </Button>
            </div>
            <DialogDescription>View the complete conversation history for this previous chat session.</DialogDescription>
            {selectedPreviousChat && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{selectedPreviousChat.date}</div>
                <span>&bull;</span>
                <div className="flex items-center gap-1"><User className="h-4 w-4" />Agent: {selectedPreviousChat.agent}</div>
                <span>&bull;</span>
                <Badge variant="outline">{selectedPreviousChat.duration}</Badge>
              </div>
            )}
          </DialogHeader>
          {selectedPreviousChat && (
            <div className="space-y-4 mt-4">
              {selectedPreviousChat.messages?.map((message: any, index: number) => (
                <div key={index} className={`flex ${message.sender === 'customer' ? 'justify-start' : message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-[70%]">
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center">
                          <Bot className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-secondary">AI Assistant</span>
                      </div>
                    )}
                    <div className={`rounded-lg p-3 ${
                      message.sender === 'customer'
                        ? 'bg-muted text-foreground'
                        : message.sender === 'ai'
                        ? 'bg-secondary/10 border border-secondary/20 text-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs opacity-75">{
                          message.sender === 'customer'
                            ? activeChat?.customer_name || activeChat?.customer || 'Guest'
                            : message.sender === 'ai'
                            ? 'AI Assistant'
                            : selectedPreviousChat.agent
                        }</span>
                        <span className="text-xs opacity-60">{message.time}</span>
                      </div>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              {!selectedPreviousChat.messages && (
                <div className="text-center py-8 border rounded-lg bg-muted/50">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Chat transcript not available</p>
                  <p className="text-xs text-muted-foreground mt-1">Full conversation details are archived</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreateTicketFromChatDialog
        activeChat={activeChat}
        projects={projects}
        open={showCreateTicketDialog}
        onOpenChange={setShowCreateTicketDialog}
        newTicket={newTicket}
        setNewTicket={setNewTicket}
        isGeneratingSubject={isGeneratingSubject}
        isCreatingTicket={isCreatingTicket}
        setIsCreatingTicket={setIsCreatingTicket}
        onGenerateSubject={onGenerateSubject}
        onClose={() => { setShowCreateTicketDialog(false); }}
      />

      {/* Take Over Chat Dialog */}
      <Dialog open={showTakeoverDialog} onOpenChange={(open) => { setShowTakeoverDialog(open); if (!open) setTakeoverError(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" />Take Over Chat</DialogTitle>
            <DialogDescription>Are you sure you want to take over this chat from <span className="font-semibold text-foreground">{activeChat?.agent_name || 'the current agent'}</span>? The current agent will be notified and removed from the conversation.</DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <div className="flex items-start gap-2 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-medium">This action will:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>Reassign the chat with <span className="font-medium">{activeChat?.customer_name || activeChat?.customer || 'Guest'}</span> to you</li>
                  <li>Notify {activeChat?.agent_name || 'the current agent'} that the chat has been taken over</li>
                  <li>Transfer the full conversation history</li>
                </ul>
              </div>
            </div>
          </div>
          {takeoverError && (
            <p className="text-sm text-red-600 mt-2">{takeoverError}</p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowTakeoverDialog(false)} disabled={isTakingOver}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90"
              disabled={isTakingOver}
              onClick={() => onExecuteTakeOver()}
            >
              {isTakingOver ? (
                <>Loading...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" />Confirm Take Over</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer to Operator Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={(open) => {
        setShowTransferDialog(open);
        if (open) onRefreshTeamMembers?.();
        if (!open) { setTransferStep('select'); setSelectedOperatorForTransfer(null); setTransferReason(''); }
      }}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => { e.preventDefault(); }} onInteractOutside={(e) => { e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>{transferStep === 'select' ? 'Transfer Chat to Another Operator' : 'Confirm Transfer'}</DialogTitle>
            <DialogDescription>{transferStep === 'select' ? 'Select an operator to transfer this conversation to. The customer will be notified of the transfer.' : 'Provide a reason for this transfer to help the receiving agent.'}</DialogDescription>
          </DialogHeader>
          {transferStep === 'select' ? (
            <div className="space-y-2 mt-4">
              {availableOperators.map((operator) => (
                <button key={operator.id} type="button" className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedOperatorForTransfer(operator); setTransferStep('reason'); }}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary text-primary-foreground">{operator.avatar}</AvatarFallback></Avatar>
                    <div className="text-left">
                      <div className="font-medium text-sm">{operator.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className={`h-2 w-2 rounded-full ${operator.status === 'online' ? 'bg-green-500' : operator.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                          {operator.status.charAt(0).toUpperCase() + operator.status.slice(1)}
                        </span>
                        <span>&bull;</span>
                        <span>{operator.activeChats} active chats</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-2">Transferring to:</div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary text-primary-foreground">{selectedOperatorForTransfer?.avatar}</AvatarFallback></Avatar>
                  <div>
                    <div className="font-medium text-sm">{selectedOperatorForTransfer?.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${selectedOperatorForTransfer?.status === 'online' ? 'bg-green-500' : selectedOperatorForTransfer?.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                        {selectedOperatorForTransfer?.status.charAt(0).toUpperCase() + selectedOperatorForTransfer?.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-reason">Reason for Transfer *</Label>
                <Textarea id="transfer-reason" placeholder="E.g., Customer needs technical expertise, requires billing assistance, specialized support needed..." rows={4} value={transferReason} onChange={(e) => setTransferReason(e.target.value)} className="resize-none" />
                <p className="text-xs text-muted-foreground">This will help the receiving agent understand the context.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setTransferStep('select'); setSelectedOperatorForTransfer(null); setTransferReason(''); }}>Back</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={onSubmitTransfer} disabled={!transferReason.trim()}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />Transfer Chat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

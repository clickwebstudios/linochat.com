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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
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
                <MessageCircle className="h-5 w-5 text-blue-600" />
                {selectedPreviousChat?.topic}
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={() => { window.open(`/chat-history/${activeChat?.id}/${selectedPreviousChat?.date}`, '_blank'); }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Window
              </Button>
            </div>
            <DialogDescription>View the complete conversation history for this previous chat session.</DialogDescription>
            {selectedPreviousChat && (
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
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
                        <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                          <Bot className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-purple-600">AI Assistant</span>
                      </div>
                    )}
                    <div className={`rounded-lg p-3 ${
                      message.sender === 'customer'
                        ? 'bg-gray-100 text-gray-900'
                        : message.sender === 'ai'
                        ? 'bg-purple-50 border border-purple-200 text-gray-900'
                        : 'bg-blue-600 text-white'
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
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Chat transcript not available</p>
                  <p className="text-xs text-gray-400 mt-1">Full conversation details are archived</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateTicketDialog} onOpenChange={setShowCreateTicketDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Ticket from Chat</DialogTitle>
            <DialogDescription>Convert this chat conversation into a support ticket for tracking and follow-up.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-subject">Subject *</Label>
              <div className="relative">
                <Input id="ticket-subject" placeholder="Enter ticket subject" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} className="pr-12" />
                <Button type="button" size="sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-blue-50" onClick={onGenerateSubject} disabled={isGeneratingSubject} title="Generate subject with AI">
                  <Sparkles className={`h-4 w-4 text-blue-600 ${isGeneratingSubject ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Priority *</Label>
              <div className="grid grid-cols-4 gap-2">
                {['low', 'medium', 'high', 'urgent'].map((priority) => (
                  <button key={priority} type="button"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      newTicket.priority === priority
                        ? priority === 'urgent' ? 'bg-red-600 text-white' : priority === 'high' ? 'bg-orange-600 text-white' : priority === 'medium' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setNewTicket({ ...newTicket, priority })}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-category">Category</Label>
              <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                <SelectTrigger id="ticket-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input id="customer-name" value={newTicket.customerName} onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Customer Email</Label>
                <Input id="customer-email" type="email" placeholder="customer@example.com" value={newTicket.customerEmail} onChange={(e) => setNewTicket({ ...newTicket, customerEmail: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-project">Project</Label>
              <select id="ticket-project" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" value={newTicket.projectId} onChange={(e) => setNewTicket({ ...newTicket, projectId: e.target.value })}>
                {projects.map((project) => (<option key={project.id} value={project.id}>{project.name}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-description">Description</Label>
              <Textarea id="ticket-description" placeholder="Provide a detailed description of the issue or request..." rows={6} value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} />
              <p className="text-xs text-gray-500">Include relevant details from the chat conversation to help resolve the ticket.</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-900"><MessageCircle className="h-4 w-4" />Chat Context</div>
              <div className="text-sm text-blue-700">
                <p><strong>Customer:</strong> {activeChat?.customer_name || activeChat?.customer || 'Guest'}</p>
                <p><strong>Last Message:</strong> {activeChat?.preview || activeChat?.last_message || 'N/A'}</p>
                <p><strong>Chat Time:</strong> {activeChat?.time || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => { setShowCreateTicketDialog(false); resetTicketForm(); }}>Cancel</Button>
            <Button onClick={async () => {
              if (!newTicket.subject.trim()) return;
              setIsCreatingTicket(true);
              try {
                await api.post('/api/agent/tickets', {
                  project_id: newTicket.projectId,
                  subject: newTicket.subject,
                  description: newTicket.description || newTicket.subject,
                  priority: newTicket.priority,
                  category: newTicket.category || undefined,
                  customer_name: newTicket.customerName || undefined,
                  customer_email: newTicket.customerEmail,
                  chat_id: activeChat?.id,
                });
                toast.success('Ticket created successfully');
                setShowCreateTicketDialog(false);
                resetTicketForm();
              } catch (err: any) {
                const msg = err?.response?.data?.message || err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : 'Failed to create ticket';
                toast.error(typeof msg === 'string' ? msg : 'Failed to create ticket');
              } finally {
                setIsCreatingTicket(false);
              }
            }} disabled={!newTicket.subject.trim() || isCreatingTicket} className="bg-blue-600 hover:bg-blue-700">
              <Ticket className="mr-2 h-4 w-4" />Create Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Take Over Chat Dialog */}
      <Dialog open={showTakeoverDialog} onOpenChange={(open) => { setShowTakeoverDialog(open); if (!open) setTakeoverError(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-blue-600" />Take Over Chat</DialogTitle>
            <DialogDescription>Are you sure you want to take over this chat from <span className="font-semibold text-gray-900">{activeChat?.agent_name || 'the current agent'}</span>? The current agent will be notified and removed from the conversation.</DialogDescription>
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
              className="bg-blue-600 hover:bg-blue-700"
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
                <button key={operator.id} type="button" className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedOperatorForTransfer(operator); setTransferStep('reason'); }}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-600 text-white">{operator.avatar}</AvatarFallback></Avatar>
                    <div className="text-left">
                      <div className="font-medium text-sm">{operator.name}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className={`h-2 w-2 rounded-full ${operator.status === 'online' ? 'bg-green-500' : operator.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                          {operator.status.charAt(0).toUpperCase() + operator.status.slice(1)}
                        </span>
                        <span>&bull;</span>
                        <span>{operator.activeChats} active chats</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg]" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-2">Transferring to:</div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-600 text-white">{selectedOperatorForTransfer?.avatar}</AvatarFallback></Avatar>
                  <div>
                    <div className="font-medium text-sm">{selectedOperatorForTransfer?.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
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
                <p className="text-xs text-gray-500">This will help the receiving agent understand the context.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setTransferStep('select'); setSelectedOperatorForTransfer(null); setTransferReason(''); }}>Back</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={onSubmitTransfer} disabled={!transferReason.trim()}>
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

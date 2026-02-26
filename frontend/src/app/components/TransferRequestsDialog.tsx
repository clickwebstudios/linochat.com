import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ArrowRightLeft, Check, X } from 'lucide-react';

export interface TransferRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  chatId: string;
  fromAgentId: string;
  fromAgentName: string;
  fromAgentAvatar: string;
  reason: string;
  timestamp: string;
  projectId: string;
  projectName: string;
}

interface TransferRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: TransferRequest[];
  onAccept: (requestId: string, notes: string) => void;
  onReject: (requestId: string, notes: string) => void;
}

export function TransferRequestsDialog({
  open,
  onOpenChange,
  requests,
  onAccept,
  onReject,
}: TransferRequestsDialogProps) {
  const [transferNotes, setTransferNotes] = useState<Record<string, string>>(
    {}
  );

  const handleAccept = (requestId: string) => {
    onAccept(requestId, transferNotes[requestId] || '');
    setTransferNotes((prev) => {
      const updated = { ...prev };
      delete updated[requestId];
      return updated;
    });
  };

  const handleReject = (requestId: string) => {
    onReject(requestId, transferNotes[requestId] || '');
    setTransferNotes((prev) => {
      const updated = { ...prev };
      delete updated[requestId];
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6 gap-4 border-[1.111px] border-[rgba(0,0,0,0.1)] border-solid rounded-[10px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] bg-white">
        <DialogHeader className="gap-2 text-left shrink-0">
          <DialogTitle className="text-[18px] font-semibold text-[#0a0a0a] leading-[18px] tracking-[-0.44px]">
            Chat Transfer Requests
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#717182] leading-[20px] tracking-[-0.15px]">
            Review and manage incoming chat transfer requests from other agents.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 min-h-0">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowRightLeft className="h-12 w-12 text-[#d1d5db] mb-3" />
              <p className="text-[14px] text-[#6b7280]">No pending transfer requests</p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="border-[1.111px] border-[rgba(0,0,0,0.1)] border-solid rounded-[10px] pt-[17px] px-[17px] pb-[17px] flex flex-col gap-4 shrink-0"
              >
                {/* Request Header: Customer + Project */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0 rounded-full">
                      <AvatarFallback className="bg-[#155dfc] text-white text-[16px] font-normal leading-[24px]">
                        {request.customerAvatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold text-[16px] text-[#0a0a0a] leading-[24px] tracking-[-0.31px]">
                        {request.customerName}
                      </div>
                      <div className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.15px]">
                        {request.timestamp}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 border-[1.111px] border-[rgba(0,0,0,0.1)] border-solid rounded-[8px] px-[9px] py-[3px] text-[12px] font-medium text-[#0a0a0a] leading-[16px]">
                    {request.projectName}
                  </span>
                </div>

                {/* Transfer Info */}
                <div className="bg-[#f9fafb] rounded-[10px] pt-3 px-3 pb-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-[#4a5565] leading-[20px] tracking-[-0.15px]">From:</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 shrink-0 rounded-full">
                        <AvatarFallback className="bg-[#4a5565] text-white text-[12px]">
                          {request.fromAgentAvatar}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-[14px] text-[#0a0a0a] leading-[20px] tracking-[-0.15px]">
                        {request.fromAgentName}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[14px] text-[#4a5565] leading-[20px] tracking-[-0.15px]">Reason:</span>
                    <p className="mt-1 text-[14px] text-[#101828] leading-[20px] tracking-[-0.15px]">{request.reason}</p>
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor={`notes-${request.id}`}
                    className="text-[12px] font-medium text-[#0a0a0a] leading-[16px]"
                  >
                    Response Notes (Optional)
                  </Label>
                  <Textarea
                    id={`notes-${request.id}`}
                    placeholder="Add notes about accepting or rejecting this transfer..."
                    rows={3}
                    value={transferNotes[request.id] || ''}
                    onChange={(e) =>
                      setTransferNotes({
                        ...transferNotes,
                        [request.id]: e.target.value,
                      })
                    }
                    className="text-[14px] bg-[#f3f3f5] border-transparent placeholder:text-[#717182] rounded-[8px] px-3 py-2 min-h-[64px] leading-[20px] tracking-[-0.15px] resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-8 rounded-[8px] border-[1.111px] border-[#ffc9c9] border-solid bg-white text-[#e7000b] text-[14px] font-medium hover:bg-red-50 hover:text-[#e7000b] hover:border-[#ffc9c9]"
                    onClick={() => handleReject(request.id)}
                  >
                    <X className="h-4 w-4 mr-1 shrink-0" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 h-8 rounded-[8px] bg-[#155dfc] hover:bg-[#1247c4] text-white text-[14px] font-medium"
                    onClick={() => handleAccept(request.id)}
                  >
                    <Check className="h-4 w-4 mr-1 shrink-0" />
                    Accept Transfer
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

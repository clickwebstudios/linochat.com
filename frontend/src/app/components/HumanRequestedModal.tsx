import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { UserPlus, X } from 'lucide-react';

function getInitials(name: string): string {
  if (!name || name === 'Guest') return 'G';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export interface HumanRequestedPayload {
  chat_id: string;
  customer_name: string;
  project_id: string;
  project_name: string;
}

interface HumanRequestedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: HumanRequestedPayload | null;
  onTakeOver: (chatId: string) => void;
}

export function HumanRequestedModal({
  open,
  onOpenChange,
  payload,
  onTakeOver,
}: HumanRequestedModalProps) {
  if (!payload) return null;

  const handleTakeOver = () => {
    onTakeOver(payload.chat_id);
    onOpenChange(false);
  };

  const customerName = payload.customer_name || 'Guest';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 gap-4 border-[1.111px] border-[rgba(0,0,0,0.1)] border-solid rounded-[10px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] bg-card">
        <DialogHeader className="gap-2 text-left shrink-0">
          <DialogTitle className="text-[18px] font-semibold text-[#0a0a0a] leading-[18px] tracking-[-0.44px]">
            Human Agent Requested
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#717182] leading-[20px] tracking-[-0.15px]">
            A customer wants to speak with a human agent.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Customer + Project card */}
          <div className="border-[1.111px] border-[rgba(0,0,0,0.1)] border-solid rounded-[10px] pt-[17px] px-[17px] pb-[17px] flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0 rounded-full">
                  <AvatarFallback className="bg-[#155dfc] text-white text-[16px] font-normal leading-[24px]">
                    {getInitials(customerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-semibold text-[16px] text-[#0a0a0a] leading-[24px] tracking-[-0.31px]">
                    {customerName}
                  </div>
                  <div className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.15px]">
                    Customer
                  </div>
                </div>
              </div>
              <span className="shrink-0 border-[1.111px] border-[rgba(0,0,0,0.1)] border-solid rounded-[8px] px-[9px] py-[3px] text-[12px] font-medium text-[#0a0a0a] leading-[16px]">
                {payload.project_name}
              </span>
            </div>

            <div className="bg-[#f9fafb] rounded-[10px] pt-3 px-3 pb-3">
              <div>
                <span className="text-[14px] text-[#4a5565] leading-[20px] tracking-[-0.15px]">
                  Reason:
                </span>
                <p className="mt-1 text-[14px] text-[#101828] leading-[20px] tracking-[-0.15px]">
                  Customer requested human assistance
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-8 rounded-[8px] border-[1.111px] border-[#ffc9c9] border-solid bg-white text-[#e7000b] text-[14px] font-medium hover:bg-red-50 hover:text-[#e7000b] hover:border-[#ffc9c9]"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4 mr-1 shrink-0" />
                Dismiss
              </Button>
              <Button
                type="button"
                className="flex-1 h-8 rounded-[8px] bg-primary hover:bg-primary/90 text-white text-[14px] font-medium"
                onClick={handleTakeOver}
              >
                <UserPlus className="h-4 w-4 mr-1 shrink-0" />
                Take Over
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

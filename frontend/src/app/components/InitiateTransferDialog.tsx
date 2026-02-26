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
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ArrowRightLeft, Info } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface ActiveChat {
  id: string;
  customer: string;
  avatar: string;
  status: string;
  preview: string;
}

interface TransferData {
  targetAgentId: string;
  reason: string;
  notes: string;
}

const INITIAL_TRANSFER: TransferData = {
  targetAgentId: '',
  reason: '',
  notes: '',
};

interface InitiateTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeChat: ActiveChat;
  teamMembers: TeamMember[];
  currentAgentId?: string;
  onTransferSubmitted?: (data: TransferData) => void;
}

export function InitiateTransferDialog({
  open,
  onOpenChange,
  activeChat,
  teamMembers,
  currentAgentId = '1',
  onTransferSubmitted,
}: InitiateTransferDialogProps) {
  const [transferData, setTransferData] = useState<TransferData>(INITIAL_TRANSFER);

  const resetAndClose = () => {
    setTransferData(INITIAL_TRANSFER);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            Transfer Chat to Another Agent
          </DialogTitle>
          <DialogDescription>
            Transfer the current chat conversation to another available agent.
            Provide context to help them assist the customer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Chat Info */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {activeChat?.avatar || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">{activeChat?.customer || 'Unknown'}</h4>
                <p className="text-sm text-gray-600">Current active chat</p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {activeChat?.status === 'active' ? 'Active' : 'Offline'}
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{activeChat?.preview || ''}</p>
          </div>

          {/* Select Agent */}
          <div className="space-y-2">
            <Label htmlFor="transfer-agent">Transfer To *</Label>
            <Select
              value={transferData.targetAgentId}
              onValueChange={(value) =>
                setTransferData({ ...transferData, targetAgentId: value })
              }
            >
              <SelectTrigger id="transfer-agent">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers
                  .filter(
                    (member) =>
                      (member.role === 'Agent' || member.role === 'Admin') &&
                      member.id !== currentAgentId
                  )
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                        <Badge
                          variant="secondary"
                          className="ml-auto text-xs"
                        >
                          {member.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Reason */}
          <div className="space-y-2">
            <Label htmlFor="transfer-reason">Reason for Transfer *</Label>
            <Select
              value={transferData.reason}
              onValueChange={(value) =>
                setTransferData({ ...transferData, reason: value })
              }
            >
              <SelectTrigger id="transfer-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expertise">
                  Requires Specialized Expertise
                </SelectItem>
                <SelectItem value="language">Language Preference</SelectItem>
                <SelectItem value="workload">Workload Management</SelectItem>
                <SelectItem value="technical">
                  Technical Issue Beyond My Scope
                </SelectItem>
                <SelectItem value="escalation">
                  Escalation Required
                </SelectItem>
                <SelectItem value="unavailable">
                  Going Offline/Unavailable
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="transfer-notes">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="transfer-notes"
              placeholder="Provide context about the conversation, customer needs, or any important information for the receiving agent..."
              value={transferData.notes}
              onChange={(e) =>
                setTransferData({ ...transferData, notes: e.target.value })
              }
              rows={4}
            />
            <p className="text-xs text-gray-500">
              Help the receiving agent by sharing relevant conversation context
            </p>
          </div>

          {/* Chat History Summary */}
          <div className="rounded-lg border bg-blue-50 border-blue-200 p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Transfer includes:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Full chat history and context</li>
                  <li>Customer information and activity</li>
                  <li>Previous tickets and interactions</li>
                  <li>Your transfer notes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              onTransferSubmitted?.(transferData);
              resetAndClose();
            }}
            disabled={!transferData.targetAgentId || !transferData.reason}
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle } from 'lucide-react';

type UserStatus = 'online' | 'away' | 'offline';

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: UserStatus;
  onStatusChange: (status: UserStatus) => void;
}

const STATUS_OPTIONS: {
  value: UserStatus;
  label: string;
  description: string;
  dotColor: string;
  activeColor: string;
  activeBg: string;
  checkColor: string;
}[] = [
  {
    value: 'online',
    label: 'Online',
    description: "You're available and ready to help",
    dotColor: 'bg-green-500',
    activeColor: 'border-green-600',
    activeBg: 'bg-green-50',
    checkColor: 'text-green-600',
  },
  {
    value: 'away',
    label: 'Away',
    description: "You're temporarily unavailable",
    dotColor: 'bg-yellow-500',
    activeColor: 'border-yellow-600',
    activeBg: 'bg-yellow-50',
    checkColor: 'text-yellow-600',
  },
  {
    value: 'offline',
    label: 'Offline',
    description: "You're not available at the moment",
    dotColor: 'bg-gray-400',
    activeColor: 'border-gray-600',
    activeBg: 'bg-gray-50',
    checkColor: 'text-gray-600',
  },
];

export function UpdateStatusDialog({
  open,
  onOpenChange,
  status,
  onStatusChange,
}: UpdateStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Your Status</DialogTitle>
          <DialogDescription>
            Change your availability status to let your team know when you're
            available.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {STATUS_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                status === opt.value
                  ? `${opt.activeColor} ${opt.activeBg}`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onStatusChange(opt.value)}
            >
              <div className="flex-shrink-0">
                <div className={`h-4 w-4 rounded-full ${opt.dotColor}`} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{opt.label}</div>
                <div className="text-sm text-gray-500">{opt.description}</div>
              </div>
              {status === opt.value && (
                <CheckCircle className={`h-5 w-5 ${opt.checkColor}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => onOpenChange(false)}
          >
            Save Status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

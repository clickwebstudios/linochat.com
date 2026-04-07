import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Zap } from 'lucide-react';

interface UpgradeLimitDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  basePath: string;
}

export function UpgradeLimitDialog({ open, onClose, title, description, basePath }: UpgradeLimitDialogProps) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Zap className="h-6 w-6 text-amber-500" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => { onClose(); navigate(`${basePath}/billing?upgrade=1`); }}
          >
            <Zap className="h-4 w-4 mr-2" />
            Upgrade plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

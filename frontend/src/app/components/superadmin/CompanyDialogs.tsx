import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  AlertCircle,
  Trash2,
  Archive,
  Shield,
  Users,
  CreditCard,
  Edit,
  Eye,
} from 'lucide-react';

interface CompanyDialogsProps {
  editedCompanyName: string;

  // Edit dialog
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  tempName: string;
  setTempName: (v: string) => void;
  tempEmail: string;
  setTempEmail: (v: string) => void;
  tempLocation: string;
  setTempLocation: (v: string) => void;
  tempStatus: string;
  setTempStatus: (v: string) => void;
  handleSaveEdit: () => void;

  // Delete dialog
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (v: string) => void;
  handleDeleteCompany: () => void;

  // Archive dialog
  archiveDialogOpen: boolean;
  setArchiveDialogOpen: (open: boolean) => void;
  archiveReason: string;
  setArchiveReason: (v: string) => void;
  handleArchiveCompany: () => void;
}

export function CompanyDialogs({
  editedCompanyName,
  editDialogOpen,
  setEditDialogOpen,
  tempName,
  setTempName,
  tempEmail,
  setTempEmail,
  tempLocation,
  setTempLocation,
  tempStatus,
  setTempStatus,
  handleSaveEdit,
  deleteDialogOpen,
  setDeleteDialogOpen,
  deleteConfirmText,
  setDeleteConfirmText,
  handleDeleteCompany,
  archiveDialogOpen,
  setArchiveDialogOpen,
  archiveReason,
  setArchiveReason,
  handleArchiveCompany,
}: CompanyDialogsProps) {
  return (
    <>
      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update {editedCompanyName}'s information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Company Name</Label>
              <Input
                id="edit-name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={tempStatus} onValueChange={setTempStatus}>
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-blue-600"
              onClick={handleSaveEdit}
              disabled={!tempName.trim() || !tempEmail.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Company Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Company
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete <span className="font-semibold text-gray-900">{editedCompanyName}</span> and all associated data including projects, tickets, chats, and team members.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-confirm" className="text-sm text-gray-600">
              Type <span className="font-mono font-semibold text-gray-900">{editedCompanyName}</span> to confirm deletion:
            </Label>
            <Input
              id="delete-confirm"
              className="mt-2"
              placeholder={editedCompanyName}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(''); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCompany}
              disabled={deleteConfirmText !== editedCompanyName}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Company Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <Archive className="h-5 w-5" />
              Archive Company
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to archive <span className="font-semibold text-gray-900">{editedCompanyName}</span>? This will apply the following restrictions:
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>All active projects will be frozen — no new tickets or chats can be created</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <Users className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Team invitations and role changes will be disabled</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <CreditCard className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Billing will be paused — no plan upgrades or downgrades allowed</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <Edit className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Company details will become read-only</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <Eye className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>All existing data will be preserved and viewable</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="archive-reason" className="text-sm">Reason for archiving <span className="text-gray-400">(optional)</span></Label>
              <Textarea
                id="archive-reason"
                placeholder="e.g. Customer requested account closure, non-payment, etc."
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setArchiveDialogOpen(false); setArchiveReason(''); }}>Cancel</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleArchiveCompany}
            >
              <Archive className="h-4 w-4 mr-1.5" />
              Archive Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

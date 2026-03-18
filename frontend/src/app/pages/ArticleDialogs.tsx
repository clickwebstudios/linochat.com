import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Loader2,
  CheckCircle,
  Trash2,
  AlertCircle,
  FolderKanban,
} from 'lucide-react';

export interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleTitle: string;
  isSaving: boolean;
  onDelete: () => void;
}

export function DeleteDialog({ open, onOpenChange, articleTitle, isSaving, onDelete }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Delete Article
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{articleTitle}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Delete Article
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: 'published' | 'draft';
  editTitle: string;
}

export function SuccessDialog({ open, onOpenChange, status, editTitle }: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {status === 'published' ? 'Article Published!' : 'Draft Saved'}
          </DialogTitle>
          <DialogDescription>
            {status === 'published'
              ? `"${editTitle}" has been published successfully.`
              : `Your changes to "${editTitle}" have been saved as a draft.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end pt-4">
          <Button onClick={() => onOpenChange(false)} className="bg-primary hover:bg-primary/90">
            Continue Editing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface ProjectSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Array<{ id: string; name: string }>;
  onSelectProject: (projectId: string) => void;
}

export function ProjectSelectDialog({ open, onOpenChange, projects, onSelectProject }: ProjectSelectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Project</DialogTitle>
          <DialogDescription>
            Please select a project to save this article to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects available. Please create a project first.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onSelectProject(project.id)}
                >
                  <FolderKanban className="h-4 w-4 mr-2" />
                  {project.name}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

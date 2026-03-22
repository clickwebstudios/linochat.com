import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, Edit, Check, Trash2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
// Mock data removed — projects passed as props or from store

/* ------------------------------------------------------------------ */
/* Add Category Dialog                                                 */
/* ------------------------------------------------------------------ */

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, projectId: string) => void;
}

export function AddCategoryDialog({
  open,
  onOpenChange,
  onAdd,
}: AddCategoryDialogProps) {
  const [name, setName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string; color: string }[]>([]);
  useState(() => {
    api.get<any>('/projects').then(res => {
      if (res.success && res.data) setProjects(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  });

  const resetAndClose = () => {
    setName('');
    setSelectedProjectId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your knowledge base articles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category-project">Project</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger id="category-project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              placeholder="e.g., Getting Started, Billing, Technical Support"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onAdd(name.trim(), selectedProjectId);
              resetAndClose();
            }}
            disabled={!name.trim() || !selectedProjectId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Edit Category Dialog                                                */
/* ------------------------------------------------------------------ */

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: { id: string; name: string } | null;
  onSave: (id: string, newName: string) => void;
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
}: EditCategoryDialogProps) {
  const [name, setName] = useState('');

  // Sync name when category prop changes
  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setName('');
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Edit Category
          </DialogTitle>
          <DialogDescription>
            Update the name of this knowledge base category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-category-name">Category Name</Label>
            <Input
              id="edit-category-name"
              placeholder="e.g., Getting Started, Billing, Technical Support"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (category && name.trim()) {
                onSave(category.id, name.trim());
                handleClose(false);
              }
            }}
            disabled={
              !name.trim() || name.trim() === category?.name
            }
          >
            <Check className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Delete Category Confirmation Dialog                                 */
/* ------------------------------------------------------------------ */

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  articleCount: number;
  onConfirmDelete: () => void;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  categoryName,
  articleCount,
  onConfirmDelete,
}: DeleteCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Category
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">{categoryName}</span>?
            This will remove the category and all its articles permanently. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {articleCount > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 my-2">
            <div className="flex items-center gap-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                This category contains{' '}
                <span className="font-semibold">{articleCount} articles</span>{' '}
                that will also be deleted.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Category
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
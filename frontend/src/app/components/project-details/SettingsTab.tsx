import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { api } from '../../api/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status?: string;
  website?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

interface SettingsTabProps {
  project: ProjectData;
  onSaved?: (project: ProjectData) => void;
}

const formatDisplayDate = (dateString: string | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

const formatRelativeTime = (dateString: string | undefined) => {
  if (!dateString) return '-';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

export function SettingsTab({ project, onSaved }: SettingsTabProps) {
  const [name, setName] = useState(project.name ?? '');
  const [description, setDescription] = useState(project.description ?? '');
  const [status, setStatus] = useState(project.status ?? 'active');
  const [website, setWebsite] = useState(project.website ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(project.name ?? '');
    setDescription(project.description ?? '');
    setStatus(project.status ?? 'active');
    setWebsite(project.website ?? '');
  }, [project]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const response = await api.put<ProjectData>(`/projects/${project.id}`, {
        name,
        description: description || undefined,
        status,
        website: website || undefined,
      });
      if (response.success && response.data) {
        onSaved?.(response.data);
        toast.success('Project settings saved');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(project.name ?? '');
    setDescription(project.description ?? '');
    setStatus(project.status ?? 'active');
    setWebsite(project.website ?? '');
    setError(null);
  };

  const hasChanges =
    name !== (project.name ?? '') ||
    description !== (project.description ?? '') ||
    status !== (project.status ?? 'active') ||
    website !== (project.website ?? '');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Workspace Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter workspace name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter workspace description"
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="project-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-url">Workspace URL</Label>
            <Input
              id="project-url"
              type="url"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving || !hasChanges}>
              Cancel
            </Button>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium mb-4">Workspace Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Workspace Color</Label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg border-2 border-border" style={{ backgroundColor: project.color ?? '#4F46E5' }} />
                <span className="text-sm text-muted-foreground">{project.color ?? '#4F46E5'}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Created</Label>
              <p className="text-sm text-muted-foreground">{formatDisplayDate(project.created_at)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Last Updated</Label>
              <p className="text-sm text-muted-foreground">{formatRelativeTime(project.updated_at)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Workspace ID</Label>
              <p className="text-sm text-muted-foreground">{project.id}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

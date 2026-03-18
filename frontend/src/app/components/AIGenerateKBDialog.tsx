import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Sparkles,
  Bot,
  CheckCircle,
  ExternalLink,
  Info,
  Loader2,
} from 'lucide-react';
import { useProjectsStore, selectProjects, selectProjectsLoading } from '../stores/projectsStore';

interface AIGenerateKBDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate?: (projectId: string) => void;
}

export function AIGenerateKBDialog({
  open,
  onOpenChange,
  onGenerate,
}: AIGenerateKBDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Use projects store
  const projects = useProjectsStore(selectProjects);
  const projectsLoading = useProjectsStore(selectProjectsLoading);
  const fetchProjects = useProjectsStore(state => state.fetchProjects);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const hasWebsite = !!selectedProject?.website;

  // Fetch projects when dialog opens
  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open, fetchProjects]);

  const resetAndClose = () => {
    setSelectedProjectId('');
    setIsGenerating(false);
    onOpenChange(false);
  };

  const handleGenerate = async () => {
    if (!selectedProjectId || !hasWebsite) return;

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/projects/${selectedProjectId}/kb/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ async: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate knowledge base');
      }

      if (data.success) {
        toast.success('Knowledge base generation started', {
          description: 'The AI is scanning your website and creating categories with articles. This may take a few minutes.',
        });
        onGenerate?.(selectedProjectId);
        resetAndClose();
      } else {
        throw new Error(data.message || 'Generation failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate knowledge base';
      toast.error('Generation failed', { description: message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            Generate Knowledge Base with AI
          </DialogTitle>
          <DialogDescription>
            Our AI agent will scan your website and automatically create a
            comprehensive knowledge base based on the content found.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Project</Label>
            {projectsLoading && projects.length === 0 ? (
              <div className="flex items-center justify-center py-8 border rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-secondary mr-2" />
                <span className="text-sm text-muted-foreground">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-sm text-muted-foreground">No projects found.</p>
                <p className="text-xs text-muted-foreground mt-1">Create a project first to generate knowledge base.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProjectId === project.id
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border hover:border-secondary/50 hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color || '#3b82f6' }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{project.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {project.description || 'No description'}
                      </div>
                      {project.website && (
                        <div className="text-xs text-primary mt-1 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {project.website.replace(/^https?:\/\//, '')}
                        </div>
                      )}
                    </div>
                    {selectedProjectId === project.id && (
                      <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Select a project and the AI will scan its website to generate
              knowledge base articles
            </p>
          </div>

          <div className="rounded-lg border border-secondary/20 bg-secondary/10 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-secondary">
                <p className="font-semibold mb-1">What will happen:</p>
                <ul className="list-disc list-inside space-y-1 text-secondary/80">
                  <li>
                    AI will crawl the selected project's website pages
                  </li>
                  <li>Extract key information and FAQs</li>
                  <li>Generate organized articles automatically</li>
                  <li>Create categories based on content themes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {selectedProjectId && !hasWebsite && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            This project has no website URL configured. Add a website in project settings to generate a knowledge base.
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={resetAndClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            className="bg-secondary hover:bg-secondary/90"
            onClick={handleGenerate}
            disabled={!selectedProjectId || !hasWebsite || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Generate Knowledge Base
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

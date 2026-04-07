import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useProjectsStore, selectProjects, selectProjectsLoading, selectProjectsError } from '../../stores/projectsStore';
import { usePlanGuard } from '../../hooks/usePlanGuard';
import { api } from '../../api/client';
import { UpgradeLimitDialog } from '../UpgradeLimitDialog';

interface ProjectsViewProps {
  basePath: string;
  onAddProjectClick: () => void;
}

export function ProjectsView({ basePath, onAddProjectClick }: ProjectsViewProps) {
  const navigate = useNavigate();
  const { isAllowed, getLimit } = usePlanGuard();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [upgradePlanDialogOpen, setUpgradePlanDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Use projects store
  const projects = useProjectsStore(selectProjects);
  const loading = useProjectsStore(selectProjectsLoading);
  const error = useProjectsStore(selectProjectsError);
  const fetchProjects = useProjectsStore(state => state.fetchProjects);
  const refreshProjects = useProjectsStore(state => state.refreshProjects);
  const removeProject = useProjectsStore(state => state.removeProject);

  const projectLimit = getLimit('maxProjects') as number;
  const atProjectLimit = isAllowed('maxProjects', projects.length) === false;

  const handleDeleteClick = (e: React.MouseEvent, project: { id: string; name: string }) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      const res = await api.delete<{ success: boolean; message?: string }>(`/projects/${projectToDelete.id}`);
      if (res.success) {
        removeProject(projectToDelete.id);
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
        toast.success('Project deleted');
        refreshProjects();
      } else {
        toast.error(res.message || 'Failed to delete project');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  // Fetch projects on mount if not already loaded
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (loading && projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/50 p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading projects...</span>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/50 p-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Plus className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No workspaces yet</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Create your first workspace to get started
        </p>
        <Button
          onClick={() => atProjectLimit ? setUpgradePlanDialogOpen(true) : onAddProjectClick()}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Workspace
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Workspaces</h1>
          <Button
            onClick={() => atProjectLimit ? setUpgradePlanDialogOpen(true) : onAddProjectClick()}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Workspace
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refreshProjects()}
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`${basePath}/project/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: project.color || '#3b82f6' }}
                    >
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {project.website?.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={project.status === 'active' ? 'default' : 'secondary'}
                    className={project.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                  >
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>{project.totalTickets || 0} tickets</span>
                    <span className="text-green-600">{project.activeTickets || 0} active</span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${basePath}/project/${project.id}`);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${basePath}/project/${project.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => handleDeleteClick(e, project)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
          if (!deleting) {
            setDeleteDialogOpen(open);
            if (!open) setProjectToDelete(null);
          }
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.name}&quot;? This will permanently remove the project and all associated data (chats, tickets, knowledge base).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeLimitDialog
        open={upgradePlanDialogOpen}
        onClose={() => setUpgradePlanDialogOpen(false)}
        title="Workspace limit reached"
        description={`Your current plan allows ${projectLimit} workspace${projectLimit !== 1 ? 's' : ''}. Upgrade to add more.`}
        basePath={basePath}
      />
    </div>
  );
}

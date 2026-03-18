import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FolderOpen, ChevronDown, Check } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { api } from '../api/client';

interface Project {
  id: string;
  name: string;
  color: string;
  status: string;
  company_id?: string;
  company_name?: string;
}

export function ProjectSelector() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get<any>('/superadmin/projects?per_page=200');
        if (response.success) {
          const raw = response.data;
          // Handle both array and paginated response: { data: [...] }
          const list: Project[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
          setProjects(list);
        }
      } catch (error) {
        console.error('Failed to fetch projects for selector:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const selectedProject = projects.find(p => String(p.id) === String(projectId)) ?? null;

  const handleSelect = (project: Project) => {
    navigate(`/superadmin/project/${project.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="hidden md:flex items-center gap-2 h-10">
          <div
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: selectedProject?.color ?? '#6366f1' }}
          >
            <FolderOpen className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm max-w-[140px] truncate">
            {selectedProject ? selectedProject.name : 'Switch Project'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel>Switch Project</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground text-sm">Loading projects...</span>
          </DropdownMenuItem>
        ) : projects.length === 0 ? (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground text-sm">No projects found</span>
          </DropdownMenuItem>
        ) : (
          projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleSelect(project)}
              className="cursor-pointer"
            >
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color ?? '#6366f1' }}
              />
              <span className="flex-1 truncate">{project.name}</span>
              {String(project.id) === String(projectId) && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

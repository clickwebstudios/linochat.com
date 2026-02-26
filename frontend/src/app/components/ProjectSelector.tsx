import { useState } from 'react';
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
import { mockProjects } from '../data/mockData';

export function ProjectSelector() {
  const [selectedProjectId, setSelectedProjectId] = useState('proj-1');

  const selectedProject = mockProjects.find(p => p.id === selectedProjectId) || mockProjects[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="hidden md:flex items-center gap-2 h-10">
          <div
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: selectedProject.color }}
          >
            <FolderOpen className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm max-w-[140px] truncate">{selectedProject.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Project</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mockProjects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => setSelectedProjectId(project.id)}
            className="cursor-pointer"
          >
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <span className="flex-1 truncate">{project.name}</span>
            {project.id === selectedProjectId && (
              <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
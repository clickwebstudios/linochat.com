import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
} from '../ui/dialog';
import {
  Users,
  Settings,
  Search,
  Plus,
  MoreVertical,
  ExternalLink,
  Edit,
  Trash2,
  FolderKanban,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AddProjectForm } from './AddProjectForm';

interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  website?: string;
  domain?: string;
  tickets: number;
  totalTickets: number;
  activeTickets: number;
  members: number;
  companyId: string;
  status?: string;
}

interface CompanyProjectsTabProps {
  companyProjects: Project[];
  viewingCompanyId: string;
  isArchived: boolean;
  onProjectAdded: (newProject: {
    id: number | string;
    name: string;
    color?: string;
    description?: string;
    website?: string;
    status?: string;
  }) => void;
}

export function CompanyProjectsTab({
  companyProjects,
  viewingCompanyId,
  isArchived,
  onProjectAdded,
}: CompanyProjectsTabProps) {
  const navigate = useNavigate();
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">All Workspaces</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search workspaces..." className="pl-8 h-9 w-[200px]" />
            </div>
            <Button size="sm" className="bg-primary" onClick={() => setAddProjectDialogOpen(true)} disabled={isArchived}><Plus className="h-4 w-4 mr-1" />Add Workspace</Button>
          </div>
        </CardHeader>
        <CardContent>
          {companyProjects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Tickets</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyProjects.map(project => (
                  <TableRow key={project.id} className={`hover:bg-muted/50 ${isArchived ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isArchived && navigate(`/superadmin/project/${project.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color + '20' }}>
                          <FolderKanban className="h-4 w-4" style={{ color: project.color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{project.name}</p>
                          <p className="text-xs text-muted-foreground max-w-[200px] truncate">{project.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {project.website ? (
                        <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-primary text-sm flex items-center gap-1 hover:underline">
                          {project.website.replace('https://', '').replace('http://', '')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">{'\u2014'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-700 text-xs">Active</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{project.totalTickets}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-orange-600">{project.activeTickets}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{project.members}</span>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No workspaces yet</p>
              <Button size="sm" className="mt-3 bg-primary" onClick={() => setAddProjectDialogOpen(true)} disabled={isArchived}><Plus className="h-4 w-4 mr-1" />Create First Workspace</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Workspace Dialog */}
      <Dialog open={addProjectDialogOpen} onOpenChange={setAddProjectDialogOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <AddProjectForm
            userId={viewingCompanyId}
            onClose={() => setAddProjectDialogOpen(false)}
            onSuccess={(newProject) => {
              onProjectAdded(newProject);
              setAddProjectDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

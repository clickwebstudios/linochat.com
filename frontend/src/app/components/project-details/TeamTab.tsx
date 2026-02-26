import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
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
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Edit,
  Trash2,
  UserPlus,
  Settings,
  MoreVertical,
} from 'lucide-react';

interface TeamTabProps {
  project: any;
  isSuperadmin: boolean;
  projectAgents: any[];
  onAddMemberClick: () => void;
}

export function TeamTab({ project, isSuperadmin, projectAgents, onAddMemberClick }: TeamTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isSuperadmin ? 'Project Agents' : 'All Team Members'}</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder={isSuperadmin ? 'Search agents...' : 'Search members...'} className="w-64" />
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={onAddMemberClick}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isSuperadmin ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active Chats</TableHead>
                  <TableHead>Resolved Today</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectAgents.length > 0 ? (
                  projectAgents.map((agent, i) => (
                    <TableRow
                      key={agent.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/superadmin/agent/${agent.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-blue-600 text-white">
                                {agent.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${i % 3 === 0 ? 'bg-green-500' : i % 3 === 1 ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                          </div>
                          <span className="font-medium">{agent.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">{agent.email}</TableCell>
                      <TableCell>
                        <Badge variant={i % 3 === 0 ? 'default' : i % 3 === 1 ? 'secondary' : 'outline'}>
                          {i % 3 === 0 ? 'Online' : i % 3 === 1 ? 'Away' : 'Offline'}
                        </Badge>
                      </TableCell>
                      <TableCell>{Math.floor(Math.random() * 5)}</TableCell>
                      <TableCell>{Math.floor(Math.random() * 12) + 3}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No agents assigned
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(project.members)].map((_, i) => (
                  <TableRow key={i} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {String.fromCharCode(65 + i)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">Team Member {i + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>member{i + 1}@example.com</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {i === 0 ? 'Admin' : i === 1 ? 'Senior Agent' : 'Agent'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {i === 0 ? 'Dec 1, 2024' : i === 1 ? 'Dec 5, 2024' : 'Dec 10, 2024'}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-600">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

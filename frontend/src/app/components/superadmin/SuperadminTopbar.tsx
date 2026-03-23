import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Search,
  LogOut,
  User,
  ChevronDown,
  Building2,
  Users,
  Eye,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ProjectSelector } from '../ProjectSelector';
import { NotificationBell } from './NotificationBell';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';

interface SACompany { id: string; name: string; projects_count: number; agents_count: number; }
interface SAUser { id: string; name: string; email: string; role: string; }

export function SuperadminTopbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [companies, setCompanies] = useState<SACompany[]>([]);
  const [users, setUsers] = useState<SAUser[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    api.get<any>('/superadmin/companies?per_page=100').then(res => {
      if (res.success) setCompanies(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) { setUsers([]); setSelectedUserId(null); return; }
    api.get<any>(`/superadmin/companies/${selectedCompanyId}/agents`).then(res => {
      if (res.success) setUsers(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, [selectedCompanyId]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-4">
          <ProjectSelector />
          <div className="relative w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users, settings..." className="pl-10" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 ml-4 pl-4 border-l hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer">
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {user ? `${user.first_name} ${user.last_name}` : 'Admin User'}
                  </div>
                  <div className="text-xs text-muted-foreground">Superadmin</div>
                </div>
                <Avatar>
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` : 'AD'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <Link to="/superadmin/profile-settings">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={() => { logout(); navigate('/'); }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Superadmin Context Bar */}
      <div className="flex items-center gap-3 px-6 py-2 border-b bg-muted/30 text-sm">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground font-medium">Viewing as:</span>

        {/* Company Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate max-w-[160px]">{selectedCompany?.name || 'All Companies'}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Select Company</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setSelectedCompanyId(null); setSelectedUserId(null); }} className="cursor-pointer">
              <div className="flex items-center justify-between w-full">
                <span>All Companies</span>
                {!selectedCompanyId && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {companies.map(c => (
              <DropdownMenuItem key={c.id} onClick={() => { setSelectedCompanyId(c.id); setSelectedUserId(null); }} className="cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.projects_count} projects · {c.agents_count} agents</div>
                  </div>
                  {selectedCompanyId === c.id && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Selector (shown when company selected) */}
        {selectedCompanyId && (
          <>
            <span className="text-muted-foreground">/</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <Users className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[160px]">{selectedUser?.name || 'All Users'}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>Select User</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedUserId(null)} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span>All Users</span>
                    {!selectedUserId && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {users.map(u => (
                  <DropdownMenuItem key={u.id} onClick={() => setSelectedUserId(u.id)} className="cursor-pointer">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email} · {u.role}</div>
                      </div>
                      {selectedUserId === u.id && <Check className="h-4 w-4" />}
                    </div>
                  </DropdownMenuItem>
                ))}
                {users.length === 0 && <DropdownMenuItem disabled>No users found</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {(selectedCompanyId || selectedUserId) && (
          <Badge variant="outline" className="text-xs ml-auto">
            Superadmin View
          </Badge>
        )}
      </div>
    </>
  );
}
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
} from 'lucide-react';
import { ProjectSelector } from '../ProjectSelector';
import { NotificationBell } from './NotificationBell';
import { useAuthStore } from '../../stores/authStore';

export function SuperadminTopbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
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
  );
}
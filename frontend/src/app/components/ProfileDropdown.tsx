import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { ChevronDown, Settings, CreditCard, User, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { billingService } from '../services/billing';

interface ProfileDropdownProps {
  basePath: string;
  isSuperadmin?: boolean;
  onStatusClick?: () => void;
}

export function ProfileDropdown({ basePath, isSuperadmin = false, onStatusClick }: ProfileDropdownProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);

  useEffect(() => {
    if (isSuperadmin) return;
    billingService.getTokenBalance()
      .then(data => setTokenBalance(data.token_balance))
      .catch(() => {});
  }, [isSuperadmin]);

  const isLow = tokenBalance !== null && tokenBalance < 100;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!isSuperadmin && tokenBalance !== null && (
          <>
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{tokenBalance.toLocaleString()} tokens</span>
              </div>
              <Link
                to={`${basePath}/billing?tab=tokens`}
                className="text-xs text-primary font-medium hover:underline"
              >
                Top Up
              </Link>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link to={`${basePath}/profile-settings`} className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        {!isSuperadmin && (
          <DropdownMenuItem asChild>
            <Link to={`${basePath}/billing`} className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </Link>
          </DropdownMenuItem>
        )}
        {onStatusClick && (
          <DropdownMenuItem onClick={onStatusClick}>
            <User className="mr-2 h-4 w-4" />
            Update Status
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => { logout(); navigate('/'); }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

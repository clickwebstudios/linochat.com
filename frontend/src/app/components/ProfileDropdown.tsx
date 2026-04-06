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
import { ChevronDown, Settings, CreditCard, User, LogOut, Zap, ArrowUpCircle } from 'lucide-react';
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

  const planName = user?.company_plan ?? null;
  const isEnterprise = planName?.toLowerCase() === 'enterprise';

  const isLow = tokenBalance !== null && tokenBalance < 100;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!isSuperadmin && (planName !== null || tokenBalance !== null) && (
          <>
            {planName !== null && (
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Plan</span>
                  <span className="text-xs font-semibold bg-primary/10 text-primary rounded px-1.5 py-0.5 leading-none">
                    {planName}
                  </span>
                </div>
                {!isEnterprise && (
                  <Link
                    to={`${basePath}/billing?tab=plans`}
                    className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    <ArrowUpCircle className="h-3 w-3" />
                    Upgrade
                  </Link>
                )}
              </div>
            )}
            {tokenBalance !== null && (
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{tokenBalance.toLocaleString()} tokens</span>
                  {isLow && (
                    <span className="text-xs font-semibold text-red-500 border border-red-400 rounded px-1 py-0.5 leading-none">Low</span>
                  )}
                </div>
                <Link
                  to={`${basePath}/billing?tab=tokens`}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Top Up
                </Link>
              </div>
            )}
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

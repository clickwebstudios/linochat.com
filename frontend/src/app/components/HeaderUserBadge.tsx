import { useAuthStore } from '../stores/authStore';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ProfileDropdown } from './ProfileDropdown';

interface HeaderUserBadgeProps {
  basePath: string;
  isSuperadmin?: boolean;
  onStatusClick?: () => void;
  status?: 'online' | 'away' | 'offline';
}

/**
 * Shared header user badge: avatar (real initials) + name + plan/role line +
 * ProfileDropdown trigger. Use this in any dashboard header so that the user
 * info display is consistent across the app and stays in sync with the
 * shared ProfileDropdown.
 *
 * Detail pages that intentionally use compact chrome (chat / ticket detail,
 * superadmin topbar) keep rendering <ProfileDropdown /> on its own.
 */
export function HeaderUserBadge({
  basePath,
  isSuperadmin = false,
  onStatusClick,
  status = 'online',
}: HeaderUserBadgeProps) {
  const user = useAuthStore((s) => s.user);

  const firstInitial = user?.first_name?.[0] ?? '';
  const lastInitial = user?.last_name?.[0] ?? '';
  const initials = (firstInitial + lastInitial).toUpperCase() || '??';

  const fullName = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email
    : 'Loading...';

  const planLabel = user?.company_plan || 'Free';

  const statusColor =
    status === 'online'
      ? 'bg-green-500'
      : status === 'away'
      ? 'bg-yellow-500'
      : 'bg-muted-foreground';

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span
          className={`absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${statusColor}`}
        />
      </div>
      <div className="hidden md:block">
        <div className="text-sm font-semibold">{fullName}</div>
        <div className="text-xs">
          {isSuperadmin ? (
            <span className="text-muted-foreground">Superadmin</span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              {planLabel}
            </span>
          )}
        </div>
      </div>
      <ProfileDropdown
        basePath={basePath}
        isSuperadmin={isSuperadmin}
        onStatusClick={onStatusClick}
      />
    </div>
  );
}

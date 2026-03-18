import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  role?: 'agent' | 'admin' | 'superadmin';
}

export default function PrivateRoute({ children, role }: PrivateRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role && !(role === 'admin' && user.role === 'superadmin')) {
    // Redirect to appropriate dashboard based on actual role
    const dashboardMap: Record<string, string> = {
      agent: '/agent/dashboard',
      admin: '/admin/dashboard',
      superadmin: '/superadmin/dashboard',
    };
    return <Navigate to={dashboardMap[user.role] ?? '/'} replace />;
  }

  return <>{children}</>;
}

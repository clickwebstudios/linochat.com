import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/button';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl text-blue-600 font-semibold">LinoChat</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-600">
                {user.first_name} {user.last_name}
              </span>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

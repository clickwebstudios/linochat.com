import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search, Settings, CreditCard, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useAuthStore } from '../stores/authStore';

export default function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const dashboardPath = user?.role === 'superadmin'
    ? '/superadmin/dashboard'
    : user?.role === 'admin'
      ? '/admin/dashboard'
      : '/agent/dashboard';

  const basePath = user?.role === 'superadmin'
    ? '/superadmin'
    : user?.role === 'admin'
      ? '/admin'
      : '/agent';

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-xl text-white">LC</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold">LinoChat</span>
              <span className="text-xs text-gray-500">Seamless Customer Conversations</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                Features <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/features#chat">Live Chat</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/features#ticketing">Ticketing</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/features#analytics">Analytics</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/features#integrations">Integrations</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/pricing" className="hover:text-blue-600 transition-colors">
              Pricing
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                Resources <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/resources#blog">Blog</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/help">Help Center</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/resources#case-studies">Case Studies</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/about" className="hover:text-blue-600 transition-colors">
              About Us
            </Link>

            <Link to="/contact" className="hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="hidden items-center gap-3 md:flex text-base">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` || '?'}
                  </AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      {user.first_name} {user.last_name}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={dashboardPath} className="flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`${basePath}/profile-settings`} className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`${basePath}/billing`} className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Billing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link to="/signup">Sign Up Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col gap-4">
                <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
                <Link to="/features" onClick={() => setMobileOpen(false)}>Features</Link>
                <Link to="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
                <Link to="/resources" onClick={() => setMobileOpen(false)}>Resources</Link>
                <Link to="/about" onClick={() => setMobileOpen(false)}>About Us</Link>
                <Link to="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
                <div className="mt-4 flex flex-col gap-2">
                  {user ? (
                    <>
                      <div className="flex items-center gap-2 py-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                        </div>
                      </div>
                      <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 hover:bg-gray-100 flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link to={`${basePath}/profile-settings`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 hover:bg-gray-100 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Profile Settings
                      </Link>
                      <Link to={`${basePath}/billing`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 hover:bg-gray-100 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Billing
                      </Link>
                      <button onClick={handleLogout} className="rounded-md px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600 text-left w-full">
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild>
                        <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
                      </Button>
                      <Button className="bg-blue-600" asChild>
                        <Link to="/signup" onClick={() => setMobileOpen(false)}>Sign Up Free</Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
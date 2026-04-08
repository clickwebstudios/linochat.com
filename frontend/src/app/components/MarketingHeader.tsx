import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search, Settings, CreditCard, LogOut, LayoutDashboard, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useAuthStore } from '../stores/authStore';
import { billingService } from '../services/billing';

export default function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role === 'superadmin') return;
    billingService.getTokenBalance()
      .then(data => setTokenBalance(data.token_balance))
      .catch(() => {});
  }, [user]);

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
          <Link to="/">
            <img src="/logo-horizontal.svg" alt="LinoChat" className="h-12" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex text-sm font-medium">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors">
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

            <Link to="/pricing" className="hover:text-primary transition-colors">
              Pricing
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors">
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

            <Link to="/about" className="hover:text-primary transition-colors">
              About Us
            </Link>

            <Link to="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="hidden items-center gap-3 md:flex text-sm">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
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
                  <DropdownMenuContent align="end" className="w-56">
                    {user?.role !== 'superadmin' && tokenBalance !== null && (
                      <>
                        <div className="flex items-center justify-between px-2 py-2">
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{tokenBalance.toLocaleString()} tokens</span>
                            {tokenBalance < 100 && (
                              <span className="text-xs font-semibold text-red-500 border border-red-400 rounded px-1 py-0.5 leading-none">Low</span>
                            )}
                          </div>
                          <Link to={`${basePath}/billing?tab=tokens`} className="text-xs text-primary font-medium hover:underline">
                            Top Up
                          </Link>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}
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
                    {user?.role !== 'superadmin' && (
                      <DropdownMenuItem asChild>
                        <Link to={`${basePath}/billing`} className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Billing
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
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
                <Button className="bg-primary hover:bg-primary/90" asChild>
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
            <SheetContent side="right" className="w-[300px] p-0">
              <nav className="flex flex-col h-full">
                <div className="flex flex-col px-2 pt-14 pb-4">
                  {[
                    { to: '/', label: 'Home' },
                    { to: '/features', label: 'Features' },
                    { to: '/pricing', label: 'Pricing' },
                    { to: '/resources', label: 'Resources' },
                    { to: '/about', label: 'About Us' },
                    { to: '/contact', label: 'Contact' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-3 text-[15px] font-medium text-slate-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-slate-100 mt-auto px-4 pt-4 pb-6 flex flex-col gap-2.5">
                  {user ? (
                    <>
                      <div className="flex items-center gap-2 py-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                        </div>
                      </div>
                      {user?.role !== 'superadmin' && tokenBalance !== null && (
                        <div className="flex items-center justify-between rounded-md px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{tokenBalance.toLocaleString()} tokens</span>
                            {tokenBalance < 100 && (
                              <span className="text-xs font-semibold text-red-500 border border-red-400 rounded px-1 py-0.5 leading-none">Low</span>
                            )}
                          </div>
                          <Link to={`${basePath}/billing?tab=tokens`} onClick={() => setMobileOpen(false)} className="text-xs text-primary font-medium hover:underline">
                            Top Up
                          </Link>
                        </div>
                      )}
                      <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 hover:bg-muted flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link to={`${basePath}/profile-settings`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 hover:bg-muted flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Profile Settings
                      </Link>
                      <Link to={`${basePath}/billing`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 hover:bg-muted flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Billing
                      </Link>
                      <button onClick={handleLogout} className="rounded-md px-3 py-2 hover:bg-muted flex items-center gap-2 text-red-600 text-left w-full">
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="h-11 w-full" asChild>
                        <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
                      </Button>
                      <Button className="h-11 w-full bg-primary hover:bg-primary/90" asChild>
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
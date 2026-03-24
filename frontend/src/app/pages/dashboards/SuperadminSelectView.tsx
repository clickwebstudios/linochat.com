import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Building2,
  Search,
  ChevronRight,
  ArrowLeft,
  Shield,
  User,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  email: string;
  plan: string;
  projects_count: number;
  agents_count: number;
  created_at: string;
  status: string;
}

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function SuperadminSelectView() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    api.get<any>('/superadmin/companies?per_page=100').then(res => {
      if (res.success) setCompanies(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;
    setLoadingUsers(true);
    api.get<any>(`/superadmin/companies/${selectedCompany.id}/agents`).then(res => {
      if (res.success) setUsers(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {}).finally(() => setLoadingUsers(false));
  }, [selectedCompany]);

  const handleImpersonate = async (targetUser: CompanyUser) => {
    setImpersonating(targetUser.id);
    try {
      const res = await api.post<any>(`/superadmin/impersonate/${targetUser.id}`, {});
      if (res.success && res.data) {
        // Store original superadmin token for returning later
        const currentToken = localStorage.getItem('access_token');
        if (currentToken) {
          localStorage.setItem('superadmin_token', currentToken);
          localStorage.setItem('superadmin_user', JSON.stringify(user));
        }
        // Switch to impersonated user
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('impersonated_by', res.data.impersonated_by);

        // Update auth store
        const { setUser } = useAuthStore.getState();
        setUser(res.data.user);

        toast.success(`Logged in as ${targetUser.name}`);

        // Navigate based on role
        if (res.data.user.role === 'admin') navigate('/admin/dashboard', { replace: true });
        else navigate('/agent/dashboard', { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to impersonate user');
    } finally {
      setImpersonating(null);
    }
  };

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const filteredCompanies = companies
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = (a as any)[sortKey]; const bv = (b as any)[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : (av ?? 0) - (bv ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Superadmin Portal</h1>
              <p className="text-xs text-muted-foreground">
                Welcome, {user?.first_name}. Choose how to continue.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">Superadmin</Badge>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/superadmin/dashboard')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Superadmin Dashboard</div>
                <div className="text-sm text-muted-foreground">Manage all companies, users, and platform settings</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="border-dashed opacity-70">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Login as User</div>
                <div className="text-sm text-muted-foreground">Select a company and user below to view their dashboard</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={selectedCompany ? 'Search users...' : 'Search companies...'}
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Company / User List */}
        {!selectedCompany ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Companies ({filteredCompanies.length})
              </h2>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No companies found</div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
                        <span className="flex items-center gap-1">Company <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('plan')}>
                        <span className="flex items-center gap-1">Plan <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none text-center" onClick={() => toggleSort('projects_count')}>
                        <span className="flex items-center justify-center gap-1">Projects <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none text-center" onClick={() => toggleSort('agents_count')}>
                        <span className="flex items-center justify-center gap-1">Users <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
                        <span className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                        <span className="flex items-center gap-1">Created <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map(company => (
                      <TableRow
                        key={company.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => { setSelectedCompany(company); setSearch(''); }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                                {company.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{company.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{company.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{company.plan || 'free'}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">{company.projects_count}</TableCell>
                        <TableCell className="text-center text-sm">{company.agents_count}</TableCell>
                        <TableCell>
                          <Badge variant={company.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                            {company.status || 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {company.created_at ? new Date(company.created_at).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedCompany(null); setUsers([]); setSearch(''); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedCompany.name}</span>
              </div>
              <Badge variant="outline" className="text-xs ml-auto">
                {selectedCompany.projects_count} projects · {selectedCompany.agents_count} agents
              </Badge>
            </div>

            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Users ({filteredUsers.length})
            </h2>

            {loadingUsers ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No users found in this company</div>
            ) : (
              <div className="grid gap-2">
                {filteredUsers.map(u => (
                  <Card key={u.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                          {u.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{u.role}</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleImpersonate(u)}
                        disabled={impersonating === u.id}
                      >
                        {impersonating === u.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <User className="h-4 w-4 mr-1" />
                        )}
                        Login as
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

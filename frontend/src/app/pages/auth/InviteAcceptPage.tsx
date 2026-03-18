import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { MessageSquare, User, Lock, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { api, setToken, setRefreshToken } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import type { User as UserType } from '../../api/client';

interface InvitationData {
  invitation_id: string;
  email: string;
  project: { id: string; name: string };
  expires_at: string;
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<InvitationData>(`/invitations/${token}`);
        if (res.success && res.data) {
          setInvitation(res.data);
        } else {
          setError('Invalid or expired invitation');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load invitation';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) return;

    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ access_token: string; refresh_token: string; user: unknown }>(`/invitations/${token}/accept`, {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      if (res.success && res.data) {
        setToken(res.data.access_token);
        setRefreshToken(res.data.refresh_token);
        useAuthStore.setState({
          user: res.data.user as UserType,
          project: null,
          isAuthenticated: true,
        });
        toast.success('Account created! Welcome to LinoChat.');
        const user = res.data.user as { role?: string };
        if (user?.role === 'superadmin') {
          navigate('/superadmin/dashboard', { replace: true });
        } else if (user?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/agent/dashboard', { replace: true });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/10 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Invalid or expired invitation</h2>
                <p className="text-muted-foreground mt-1">{error}</p>
              </div>
              <Link to="/login">
                <Button variant="outline">Go to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/10 flex items-center justify-center p-4">
      <div className="fixed top-6 left-6 flex items-center gap-2 z-10">
        <div className="bg-primary p-2 rounded-lg">
          <MessageSquare className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl text-primary">LinoChat</h1>
      </div>

      <Link
        to="/"
        className="fixed top-6 right-6 z-10 p-2 rounded-lg hover:bg-muted/50 transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6 text-muted-foreground" />
      </Link>

      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle className="h-6 w-6" />
            <span className="font-medium">You're invited!</span>
          </div>
          <CardTitle className="text-2xl">Join {invitation?.project.name} on LinoChat</CardTitle>
          <CardDescription>
            Create your password to accept the invitation and access your support dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm text-primary">
            <p className="font-medium">Invitation for: {invitation?.email}</p>
            <p className="text-primary mt-1">
              You'll join <strong>{invitation?.project.name}</strong> as a team member.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="first_name" className="text-sm font-medium">
                  First name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="first_name"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))}
                    className="pl-10"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="last_name" className="text-sm font-medium">
                  Last name
                </label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  className="pl-10"
                  required
                  minLength={6}
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password_confirmation" className="text-sm font-medium">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password_confirmation"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password_confirmation}
                  onChange={(e) => setFormData((p) => ({ ...p, password_confirmation: e.target.value }))}
                  className="pl-10"
                  required
                  minLength={6}
                  disabled={submitting}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Accept invitation & create account'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            By accepting, you agree to join the team and access the LinoChat dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

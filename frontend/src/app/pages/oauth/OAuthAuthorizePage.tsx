import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/card';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';

interface ClientInfo {
  client_name: string;
  client_id: string;
  redirect_uri: string;
  scopes: Record<string, string>;
  state: string | null;
}

export default function OAuthAuthorizePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const params = {
    client_id:     searchParams.get('client_id') ?? '',
    redirect_uri:  searchParams.get('redirect_uri') ?? '',
    response_type: searchParams.get('response_type') ?? 'code',
    scope:         searchParams.get('scope') ?? '',
    state:         searchParams.get('state') ?? '',
  };

  useEffect(() => {
    if (!isAuthenticated) {
      // Preserve the full authorize URL so we can redirect back after login
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?return_to=${returnTo}`, { replace: true });
      return;
    }

    if (!params.client_id || !params.redirect_uri) {
      setError('Missing required parameters: client_id and redirect_uri.');
      setLoading(false);
      return;
    }

    api.get('/oauth/authorize', { params })
      .then((res: any) => {
        if (res.data?.success) {
          setClientInfo(res.data.data);
        } else {
          setError(res.data?.message ?? 'Invalid authorization request.');
        }
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message ?? 'Failed to load authorization request.');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, params.client_id]);

  const handleDecision = async (approved: boolean) => {
    if (!clientInfo) return;
    setSubmitting(true);

    try {
      const res: any = await api.post('/oauth/authorize', {
        client_id:    clientInfo.client_id,
        redirect_uri: clientInfo.redirect_uri,
        scope:        params.scope,
        state:        clientInfo.state,
        approved,
      });

      if (res.data?.success && res.data?.redirect_to) {
        window.location.href = res.data.redirect_to;
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Authorization Error</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientInfo) return null;

  const scopeEntries = Object.entries(clientInfo.scopes);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          {/* LinoChat branding */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LinoChat</span>
          </div>

          <h1 className="text-xl font-semibold text-foreground">
            Authorize <span className="text-primary">{clientInfo.client_name}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Signed in as <span className="font-medium">{user?.email}</span>
          </p>
          <button
            type="button"
            className="text-xs text-primary hover:underline mt-1"
            onClick={() => {
              const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
              useAuthStore.getState().logout();
              navigate(`/login?return_to=${returnTo}`, { replace: true });
            }}
          >
            Switch account
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-foreground">
            <strong>{clientInfo.client_name}</strong> is requesting permission to access your
            LinoChat account with the following permissions:
          </p>

          <div className="bg-muted/50 rounded-lg border divide-y">
            {scopeEntries.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground italic">No specific permissions requested.</p>
            ) : (
              scopeEntries.map(([scope, description]) => (
                <div key={scope} className="flex items-start gap-3 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{description}</p>
                    <code className="text-xs text-muted-foreground">{scope}</code>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can revoke this access at any time from your account settings.
          </p>
        </CardContent>

        <CardFooter className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={submitting}
            onClick={() => handleDecision(false)}
          >
            Deny
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={submitting}
            onClick={() => handleDecision(true)}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Authorize'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

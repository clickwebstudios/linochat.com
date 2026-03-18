import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function FrubixCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Frubix...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(searchParams.get('error_description') || 'Authorization was denied.');
      notifyOpener(false, 'Authorization denied');
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('Invalid callback — missing authorization code.');
      notifyOpener(false, 'Missing authorization code');
      return;
    }

    // Exchange code for tokens via our backend
    api.post<any>('/integrations/frubix/callback', { code, state })
      .then(() => {
        setStatus('success');
        setMessage('Frubix connected successfully! You can close this window.');
        notifyOpener(true);
        // Auto-close popup after short delay
        setTimeout(() => window.close(), 1500);
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err.message || 'Failed to connect Frubix.');
        notifyOpener(false, err.message);
      });
  }, [searchParams]);

  function notifyOpener(success: boolean, error?: string) {
    if (window.opener) {
      window.opener.postMessage(
        { type: 'frubix-oauth-callback', success, error },
        window.location.origin,
      );
    }
  }

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center">
      <div className="bg-card rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-foreground">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-4" />
            <p className="text-foreground font-medium">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <p className="text-foreground font-medium">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Close this window
            </button>
          </>
        )}
      </div>
    </div>
  );
}

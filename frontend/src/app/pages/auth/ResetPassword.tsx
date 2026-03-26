import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { MessageSquare, Lock, ArrowRight, ArrowLeft, CheckCircle, X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) setEmail(decodeURIComponent(emailParam));
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasValidParams = token && emailParam;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/10 flex items-center justify-center p-4">
      <Link to="/" className="fixed top-6 left-6 z-10">
        <img src="/images/logo-branded@2x.png" alt="LinoChat" className="h-10" />
      </Link>

      <Link
        to="/"
        className="fixed top-6 right-6 z-10 p-2 rounded-lg hover:bg-muted/50 transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6 text-muted-foreground" />
      </Link>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl text-foreground">
              Set a new
              <br />
              <span className="text-primary">password</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Enter your new password below. Make sure it's at least 6 characters long.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">Set new password</CardTitle>
              <CardDescription>
                {isSuccess
                  ? 'Your password has been reset successfully'
                  : hasValidParams
                    ? 'Enter your new password'
                    : 'Invalid or expired reset link'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSuccess ? (
                <div className="space-y-6 py-4">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg text-foreground">Password reset successfully</h3>
                      <p className="text-sm text-muted-foreground">
                        Redirecting you to login...
                      </p>
                    </div>
                  </div>
                </div>
              ) : !hasValidParams ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This link is invalid or has expired. Please request a new password reset.
                  </p>
                  <Link to="/forgot-password">
                    <Button variant="outline" className="w-full">
                      Request new reset link
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password_confirmation" className="text-sm">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password_confirmation"
                        type="password"
                        placeholder="Repeat your password"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 text-center">{error}</div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        Reset password
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              <div className="pt-4">
                <Link
                  to="/login"
                  className="flex items-center justify-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

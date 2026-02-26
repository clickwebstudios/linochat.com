import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { MessageSquare, Mail, ArrowRight, ArrowLeft, CheckCircle, X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.message || 'Failed to send reset link');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Logo in top left */}
      <div className="fixed top-6 left-6 flex items-center gap-2 z-10">
        <div className="bg-blue-600 p-2 rounded-lg">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl text-blue-600">LinoChat</h1>
      </div>

      {/* Close button in top right */}
      <Link 
        to="/" 
        className="fixed top-6 right-6 z-10 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6 text-gray-600" />
      </Link>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl text-gray-900">
              Don't worry,
              <br />
              <span className="text-blue-600">We've got you covered</span>
            </h2>
            <p className="text-lg text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>
        </div>

        {/* Right Side - Reset Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">Reset your password</CardTitle>
              <CardDescription>
                {isSubmitted 
                  ? "Check your email for reset instructions"
                  : "We'll send you a link to reset your password"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSubmitted ? (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="text-sm text-red-600 text-center">
                        {error}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send reset link
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="pt-4">
                    <Link 
                      to="/login" 
                      className="flex items-center justify-center text-sm text-blue-600 hover:underline"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to login
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-6 py-4">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg text-gray-900">Check your email</h3>
                      <p className="text-sm text-gray-600">
                        We've sent password reset instructions to
                        <br />
                        <span className="font-medium text-gray-900">{email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center">
                      Didn't receive the email? Check your spam folder or
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleSubmit()}
                    >
                      Try again
                    </Button>
                  </div>

                  <div className="pt-4">
                    <Link 
                      to="/login" 
                      className="flex items-center justify-center text-sm text-blue-600 hover:underline"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to login
                    </Link>
                  </div>
                </div>
              )}

              <div className="text-center text-sm pt-4 border-t">
                <span className="text-gray-600">Don't have an account? </span>
                <Link to="/signup" className="text-blue-600 hover:underline">
                  Sign up for free
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
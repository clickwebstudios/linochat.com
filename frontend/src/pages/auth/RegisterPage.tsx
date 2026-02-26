import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Eye, EyeOff, Mail, Lock, User, Globe, Building2, 
  Loader2, CheckCircle2, Sparkles, FileText, Bot,
  ArrowRight, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Progress } from '@/app/components/ui/progress';
import { useAuthStore, selectIsLoading, selectAuthError, selectAuthFieldErrors, selectCurrentAnalysis, selectKbArticlesCount } from '@/stores/authStore';
import type { WebsiteAnalysis } from '@/types';

// Helper to normalize URL (add https:// if missing)
const normalizeUrl = (url: string): string => {
  if (!url) return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  // Check if protocol is already present
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // Add https:// prefix
  return `https://${trimmed}`;
};

// Simple domain/URL validation regex (accepts: example.com, www.example.com, https://example.com)
const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]*)+.*$/;

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
  password_confirmation: z.string().min(1, 'Please confirm your password'),
  website_url: z.string()
    .min(1, 'Website URL is required')
    .refine((val) => urlRegex.test(val.trim()), 'Please enter a valid website URL (e.g., example.com)')
    .transform((val) => normalizeUrl(val)),
  company_name: z.string().optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Analysis status component
function AnalysisStatus({ analysis, kbCount }: { analysis: WebsiteAnalysis | null; kbCount: number }) {
  if (!analysis) return null;

  const getStatusConfig = () => {
    switch (analysis.status) {
      case 'pending':
        return {
          icon: <Bot className="h-5 w-5 text-muted-foreground animate-pulse" />,
          title: 'Preparing Analysis',
          description: 'Setting up AI analysis for your website...',
          progress: 10,
          color: 'bg-muted',
        };
      case 'processing':
        return {
          icon: <Sparkles className="h-5 w-5 text-primary animate-pulse" />,
          title: 'AI Analyzing Your Website',
          description: `Crawling pages and extracting content... ${analysis.pages_crawled || 0} of ${analysis.pages_found || '?'} pages`,
          progress: analysis.pages_found && analysis.pages_crawled
            ? Math.round((analysis.pages_crawled / analysis.pages_found) * 70) + 20
            : 30,
          color: 'bg-primary',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          title: 'Analysis Complete!',
          description: `Successfully created ${kbCount} knowledge base articles from your website content.`,
          progress: 100,
          color: 'bg-green-500',
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-5 w-5 text-destructive" />,
          title: 'Analysis Failed',
          description: analysis.error_message || 'Something went wrong. Your chatbot will use default settings.',
          progress: 100,
          color: 'bg-destructive',
        };
      default:
        return {
          icon: <Bot className="h-5 w-5" />,
          title: 'Initializing...',
          description: 'Starting AI analysis...',
          progress: 5,
          color: 'bg-muted',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex-1 space-y-1">
          <h4 className="font-medium text-sm">{config.title}</h4>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>
      
      <Progress value={config.progress} className="h-2" />
      
      
      {analysis.status === 'completed' && kbCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-green-600 pt-2">
          <FileText className="h-4 w-4" />
          <span>{kbCount} knowledge base articles created</span>
        </div>
      )}
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const register = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore(selectIsLoading);
  const error = useAuthStore(selectAuthError);
  const fieldErrors = useAuthStore(selectAuthFieldErrors);
  const currentAnalysis = useAuthStore(selectCurrentAnalysis);
  const kbArticlesCount = useAuthStore(selectKbArticlesCount);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors: formErrors },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      website_url: '',
      company_name: '',
    },
  });

  const websiteUrl = watch('website_url');

  // Sync server field errors with form
  useEffect(() => {
    Object.entries(fieldErrors).forEach(([key, message]) => {
      const formKey = key as keyof RegisterFormData;
      setError(formKey, { message });
    });
  }, [fieldErrors, setError]);

  // Poll for analysis updates during registration
  useEffect(() => {
    if (!showAnalysis || !currentAnalysis) return;

    const pollInterval = setInterval(() => {
      // In a real app, you'd fetch the latest analysis status here
      // For now, the store updates after registration response
      if (currentAnalysis.status === 'completed' || currentAnalysis.status === 'failed') {
        clearInterval(pollInterval);
        
        if (currentAnalysis.status === 'completed') {
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [showAnalysis, currentAnalysis, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    setShowAnalysis(true);
    
    try {
      await register(data);
      toast.success('Account created!', {
        description: 'Your AI chatbot is being set up...',
      });
    } catch {
      setShowAnalysis(false);
      toast.error('Registration failed', {
        description: error || 'Please check your information and try again.',
      });
    }
  };

  // If showing analysis and it's complete or failed, show success/fail state
  if (showAnalysis && currentAnalysis && (currentAnalysis.status === 'completed' || currentAnalysis.status === 'failed')) {
    const isSuccess = currentAnalysis.status === 'completed';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center space-y-4">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${isSuccess ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {isSuccess ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold">
                    {isSuccess ? 'You\'re all set!' : 'Almost there!'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isSuccess 
                      ? `Your AI chatbot has been trained on ${kbArticlesCount} articles from your website.`
                      : 'Your account is created. We\'ll analyze your website shortly.'
                    }
                  </p>
                </div>

                {isSuccess && kbArticlesCount > 0 && (
                  <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">{kbArticlesCount} knowledge base articles created</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => navigate('/dashboard')} 
                className="w-full"
                size="lg"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-2xl font-bold">LinoChat</span>
          </Link>
          <p className="mt-2 text-muted-foreground">Create your AI chatbot in minutes</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
            <CardDescription className="text-center">
              Start with your website and we'll build your AI chatbot
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* AI Analysis Status - shown during/after registration */}
            {showAnalysis && currentAnalysis && (
              <AnalysisStatus analysis={currentAnalysis} kbCount={kbArticlesCount} />
            )}

            {/* Global Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="pl-10"
                    disabled={isLoading}
                    {...registerField('name')}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="pl-10"
                    disabled={isLoading}
                    {...registerField('email')}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email.message}</p>
                )}
              </div>

              {/* Company Name Field */}
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_name"
                    placeholder="Acme Inc. (optional)"
                    className="pl-10"
                    disabled={isLoading}
                    {...registerField('company_name')}
                  />
                </div>
              </div>

              {/* Website URL Field */}
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL *</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website_url"
                    type="url"
                    placeholder="https://example.com"
                    className="pl-10"
                    disabled={isLoading}
                    {...registerField('website_url')}
                  />
                </div>
                {formErrors.website_url && (
                  <p className="text-sm text-destructive">{formErrors.website_url.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  We'll analyze your website to train your AI chatbot
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    {...registerField('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-destructive">{formErrors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    {...registerField('password_confirmation')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password_confirmation && (
                  <p className="text-sm text-destructive">{formErrors.password_confirmation.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || showAnalysis}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Account & Analyze Website
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;

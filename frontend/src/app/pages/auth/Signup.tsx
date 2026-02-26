import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  MessageSquare,
  Mail,
  Lock,
  User,
  Building2,
  Globe,
  ArrowRight,
  Chrome,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const ANALYSIS_STEPS = [
  'Connecting to website...',
  'Extracting page content...',
  'Analyzing brand identity...',
  'Detecting site structure...',
  'Generating knowledge base...',
  'Creating your account...',
];

export default function Signup() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    website: '',
  });
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [kbArticlesCount, setKbArticlesCount] = useState(0);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();
  };

  // Simulate step-by-step analysis progress
  const simulateAnalysisProgress = () => {
    setAnalysisStep(0);
    
    // Simulate each step with delay
    ANALYSIS_STEPS.forEach((_, index) => {
      setTimeout(() => {
        setAnalysisStep(index);
      }, index * 800 + Math.random() * 400);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validation
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Validate website URL
    let website = formData.website.trim();
    if (!website.startsWith('http')) {
      website = `https://${website}`;
    }

    setIsAnalyzing(true);
    simulateAnalysisProgress();

    try {
      const result = await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        website: website,
        company_name: formData.companyName,
      });

      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      setKbArticlesCount(result.kbCount);
      setAnalysisComplete(true);

      toast.success('Account created successfully!');

      // Short delay to show success, then redirect
      setTimeout(() => {
        const { user } = useAuthStore.getState();
        if (user?.role === 'superadmin') {
          navigate('/superadmin/dashboard', { replace: true });
        } else if (user?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/agent/dashboard', { replace: true });
        }
      }, 1500);
    } catch (err: any) {
      setIsAnalyzing(false);
      setAnalysisStep(0);
      toast.error(err.message || 'Registration failed');
    }
  };

  // Show step-by-step analysis screen while processing (no rotating loader)
  if (isAnalyzing) {
    const progressPercent = analysisComplete 
      ? 100 
      : ((analysisStep + 1) / ANALYSIS_STEPS.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {analysisComplete ? 'All set!' : 'Setting up your account...'}
                </h2>
                <p className="text-gray-600">
                  {analysisComplete 
                    ? `We've created ${kbArticlesCount} knowledge base articles from your website.`
                    : 'Our AI is scanning your website to create a knowledge base.'}
                </p>
              </div>

              {/* Step-by-step loader (matches AddProjectDialog) */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-900">
                      {analysisComplete ? 'Complete!' : 'Analyzing...'}
                    </span>
                    <span className="text-blue-600 font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Analysis Steps */}
                <div className="space-y-2">
                  {ANALYSIS_STEPS.map((stepLabel, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2.5 text-sm transition-opacity duration-300 ${
                        index > analysisStep && !analysisComplete ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      {index < analysisStep || analysisComplete ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : index === analysisStep && !analysisComplete ? (
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300 flex-shrink-0" />
                      )}
                      <span
                        className={
                          index === analysisStep && !analysisComplete
                            ? 'text-blue-900 font-medium'
                            : index < analysisStep || analysisComplete
                              ? 'text-green-700'
                              : 'text-gray-400'
                        }
                      >
                        {stepLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {!analysisComplete && (
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                  <Sparkles className="h-4 w-4" />
                  <span>AI is analyzing your content...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              Start with AI-powered
              <br />
              <span className="text-blue-600">Customer Support</span>
            </h2>
            <p className="text-lg text-gray-600">
              Create your account and let our AI analyze your website to build a knowledge base automatically.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>
                Get started with AI-powered customer support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm">
                      First name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm">
                      Last name
                    </label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
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
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm">
                    Confirm password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <label htmlFor="companyName" className="text-sm">
                    Company name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="companyName"
                      placeholder="Acme Inc"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm">
                    Website URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Our AI will analyze your website to create a knowledge base
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="w-full" disabled={isLoading}>
                  <Chrome className="mr-2 h-4 w-4" />
                  Google
                </Button>
              </div>

              <div className="text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link to="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

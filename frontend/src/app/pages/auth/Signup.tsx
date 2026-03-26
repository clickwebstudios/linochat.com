import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  MessageSquare,
  Mail,
  Lock,
  User,
  Building2,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Palette,
  Chrome,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/client';

type SignupStep = 'account' | 'verify' | 'project' | 'team' | 'customize' | 'complete';

const ANALYSIS_STEPS = [
  'Connecting to website...',
  'Extracting page content...',
  'Analyzing brand identity...',
  'Detecting site structure...',
  'Generating knowledge base...',
  'Creating your account...',
];

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'PT', label: 'Portugal' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'AT', label: 'Austria' },
  { value: 'BE', label: 'Belgium' },
  { value: 'IE', label: 'Ireland' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'SG', label: 'Singapore' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'IL', label: 'Israel' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'PL', label: 'Poland' },
  { value: 'CZ', label: 'Czech Republic' },
];

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GoogleSignupButton({ onSuccess }: { onSuccess: (token: string) => void }) {
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse.access_token),
    onError: () => toast.error('Google sign up failed'),
  });
  return (
    <Button variant="outline" className="w-full" onClick={() => handleGoogleLogin()}>
      <GoogleIcon className="mr-2 h-4 w-4" />
      Google
    </Button>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { register, googleLogin, isLoading, error, clearError } = useAuthStore();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [currentStep, setCurrentStep] = useState<SignupStep>('account');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [websiteAnalyzed, setWebsiteAnalyzed] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [kbArticlesCount, setKbArticlesCount] = useState(0);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    country: '',
    projectName: '',
    website: '',
    primaryColor: '#2563eb',
    teamEmails: [''],
  });

  const steps: { id: SignupStep; label: string; description: string }[] = [
    { id: 'account', label: 'Create Account', description: 'Set up your credentials' },
    { id: 'verify', label: 'Verify Email', description: 'Confirm your email address' },
    { id: 'project', label: 'Create Project', description: 'Set up your workspace' },
    { id: 'team', label: 'Invite Team', description: 'Add team members (optional)' },
    { id: 'customize', label: 'Customize', description: 'Personalize your widget' },
    { id: 'complete', label: 'Complete', description: 'You are all set!' },
  ];

  const getCurrentStepIndex = () => steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    const idx = getCurrentStepIndex();
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id);
  };

  const handleBack = () => {
    const idx = getCurrentStepIndex();
    if (idx > 0) setCurrentStep(steps[idx - 1].id);
  };

  const handleVerificationInput = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`)?.focus();
      }
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const sendCode = async (email: string) => {
    setIsSendingCode(true);
    try {
      await authApi.sendVerificationCode(email);
      setResendCooldown(60);
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code');
      throw err;
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      await sendCode(formData.email);
    } catch {
      // toast already shown
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }
    setIsVerifying(true);
    try {
      await authApi.verifyEmailCode(formData.email, code);
      toast.success('Email verified!');
      handleNext();
    } catch (err: any) {
      toast.error(err.message || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const addTeamEmail = () =>
    setFormData({ ...formData, teamEmails: [...formData.teamEmails, ''] });

  const updateTeamEmail = (index: number, value: string) => {
    const emails = [...formData.teamEmails];
    emails[index] = value;
    setFormData({ ...formData, teamEmails: emails });
  };

  const removeTeamEmail = (index: number) =>
    setFormData({ ...formData, teamEmails: formData.teamEmails.filter((_, i) => i !== index) });

  const simulateAnalysisProgress = () => {
    setAnalysisStep(0);
    ANALYSIS_STEPS.forEach((_, index) => {
      setTimeout(() => setAnalysisStep(index), index * 800 + Math.random() * 400);
    });
  };

  /** Called from Step 3 — triggers real API registration + website analysis */
  const handleRegister = async () => {
    if (!formData.website.trim()) {
      toast.error('Please enter your website URL');
      return;
    }
    clearError();

    let website = formData.website.trim();
    if (!website.startsWith('http')) website = `https://${website}`;

    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    setIsAnalyzing(true);
    simulateAnalysisProgress();

    try {
      const result = await register({
        first_name: firstName,
        last_name: lastName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        website,
        company_name: formData.companyName,
      });

      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      setKbArticlesCount(result.kbCount);
      setAnalysisComplete(true);

      setFormData((prev) => ({
        ...prev,
        projectName: prev.projectName || `${prev.companyName} Customer Support`,
      }));

      setIsAnalyzing(false);
      setWebsiteAnalyzed(true);
    } catch (err: any) {
      setIsAnalyzing(false);
      setAnalysisStep(0);
      setAnalysisComplete(false);
      toast.error(err.message || 'Registration failed. Please try again.');
    }
  };

  // Redirect to dashboard once complete step is shown
  useEffect(() => {
    if (currentStep === 'complete') {
      const timer = setTimeout(() => {
        const { user } = useAuthStore.getState();
        if (user?.role === 'superadmin') navigate('/superadmin/dashboard', { replace: true });
        else if (user?.role === 'admin') navigate('/admin/dashboard', { replace: true });
        else navigate('/agent/dashboard', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, navigate]);

  // Validate Step 1 before advancing — sends verification code
  const handleStep1Continue = async () => {
    if (!formData.fullName.trim()) return toast.error('Full name is required');
    if (!formData.email.trim()) return toast.error('Email address is required');
    if (!formData.companyName.trim()) return toast.error('Company name is required');
    if (!formData.password) return toast.error('Password is required');
    if (formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    clearError();
    try {
      await sendCode(formData.email);
      handleNext();
    } catch {
      // toast already shown in sendCode
    }
  };

  // ─── Analysis loading screen (shown while API call is in progress) ────────────
  if (isAnalyzing) {
    const progressPercent = analysisComplete
      ? 100
      : ((analysisStep + 1) / ANALYSIS_STEPS.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/10 flex items-center justify-center p-4">
        <Link to="/" className="fixed top-6 left-6 z-10">
          <img src="/images/logo-branded@2x.png" alt="LinoChat" className="h-10" />
        </Link>

        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">Setting up your account...</h2>
                <p className="text-muted-foreground">
                  Our AI is scanning your website to create a knowledge base.
                </p>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-primary">Analyzing...</span>
                    <span className="text-primary font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {ANALYSIS_STEPS.map((stepLabel, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2.5 text-sm transition-opacity duration-300 ${
                        index > analysisStep ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      {index < analysisStep ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : index === analysisStep ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-border flex-shrink-0" />
                      )}
                      <span
                        className={
                          index === analysisStep
                            ? 'text-primary font-medium'
                            : index < analysisStep
                            ? 'text-green-700'
                            : 'text-muted-foreground'
                        }
                      >
                        {stepLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                <span>AI is analyzing your content...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Main wizard UI ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/10 flex items-center justify-center p-4">
      {/* Logo */}
      <Link to="/" className="fixed top-6 left-6 z-10">
        <img src="/images/logo-branded@2x.png" alt="LinoChat" className="h-10" />
      </Link>

      <div className="w-full max-w-4xl">
        {/* ── Progress Steps ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = getCurrentStepIndex() > index;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted || isActive
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm">{index + 1}</span>
                      )}
                    </div>
                    <div className="mt-2 text-center hidden md:block">
                      <p
                        className={`text-xs ${
                          isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main Card ── */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl">{steps[getCurrentStepIndex()].label}</CardTitle>
            <CardDescription>{steps[getCurrentStepIndex()].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* API error banner */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* ── Step 1: Create Account ── */}
            {currentStep === 'account' && (
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Company + Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="text-sm">Company</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="companyName"
                        placeholder="Acme Inc."
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="country" className="text-sm">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                      <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                      >
                        <SelectTrigger id="country" className="pl-10">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Password + Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">At least 8 characters with letters and numbers</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Social divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
                  </div>
                </div>

                {googleClientId && (
                  <GoogleSignupButton
                    onSuccess={async (token) => {
                      try {
                        await googleLogin(token);
                        navigate('/dashboard');
                      } catch (err: any) {
                        toast.error(err.message || 'Google sign up failed');
                      }
                    }}
                  />
                )}

                <Button onClick={handleStep1Continue} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSendingCode}>
                  {isSendingCode ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline">Sign in</Link>
                </p>
              </div>
            )}

            {/* ── Step 2: Verify Email ── */}
            {currentStep === 'verify' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg">Check your email</h3>
                  <p className="text-sm text-muted-foreground">
                    We sent a verification code to <strong>{formData.email}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm text-center block">Enter verification code</label>
                  <div className="flex gap-2 justify-center">
                    {verificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleVerificationInput(index, e.target.value)}
                        className="w-12 h-12 text-center text-lg"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Didn't receive the code?{' '}
                    <button
                      className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || isSendingCode}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                    </button>
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1" disabled={isVerifying}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleVerifyCode} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isVerifying || verificationCode.join('').length !== 6}>
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Create Project (real API registration) ── */}
            {currentStep === 'project' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="website" className="text-sm">Website URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://example.com"
                        value={formData.website}
                        onChange={(e) => {
                          setFormData({ ...formData, website: e.target.value });
                          setWebsiteAnalyzed(false);
                          setAnalysisComplete(false);
                        }}
                        className="pl-10"
                        disabled={websiteAnalyzed}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Our AI will analyze your website to create a knowledge base and set up your project
                    </p>
                  </div>

                  {!websiteAnalyzed && (
                    <Button
                      onClick={handleRegister}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={!formData.website.trim() || isLoading}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Website & Create Account
                    </Button>
                  )}

                  {websiteAnalyzed && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <h4 className="text-sm font-medium mb-1">Account created & website analyzed!</h4>
                              <p className="text-xs text-muted-foreground">
                                We've created {kbArticlesCount} knowledge base articles from your website.
                              </p>
                            </div>

                            <div className="space-y-3">
                              <div className="bg-card rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <label className="text-xs text-muted-foreground">Company Name</label>
                                </div>
                                <Input
                                  value={formData.companyName}
                                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                  className="border-border"
                                />
                              </div>

                              <div className="bg-card rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                                  <label className="text-xs text-muted-foreground">Project Name</label>
                                </div>
                                <Input
                                  value={formData.projectName}
                                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                  className="border-border"
                                />
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              You can edit these details now or later from your dashboard
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!websiteAnalyzed}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 4: Invite Team ── */}
            {currentStep === 'team' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg">Invite your team</h3>
                  <p className="text-sm text-muted-foreground">
                    Collaborate with your team members to provide better support
                  </p>
                </div>

                <div className="space-y-3">
                  {formData.teamEmails.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="teammate@company.com"
                          value={email}
                          onChange={(e) => updateTeamEmail(index, e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {formData.teamEmails.length > 1 && (
                        <Button variant="outline" size="icon" onClick={() => removeTeamEmail(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button onClick={addTeamEmail} variant="outline" className="w-full">
                    + Add Another Team Member
                  </Button>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">
                    💡 Don't worry, you can always invite team members later from your dashboard
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleNext} variant="outline" className="flex-1">
                    Skip for now
                  </Button>
                  <Button onClick={handleNext} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                    Send Invites
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 5: Customize Widget ── */}
            {currentStep === 'customize' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Palette className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg">Customize your chat widget</h3>
                  <p className="text-sm text-muted-foreground">Make the widget match your brand</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm">Primary Color</label>
                    <div className="flex gap-3">
                      <Input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-20 h-12 cursor-pointer"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="flex-1"
                        placeholder="#2563eb"
                      />
                    </div>
                  </div>

                  {/* Live widget preview */}
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="text-sm font-medium mb-3">Widget Preview</h4>
                    <div className="bg-card rounded-lg p-4 shadow-lg max-w-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">{formData.companyName || 'Your Company'}</h5>
                          <p className="text-xs text-muted-foreground">We typically reply in a few minutes</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-muted rounded-lg p-2 text-xs">
                          Hi! How can we help you today?
                        </div>
                        <button
                          className="w-full text-sm text-white py-2 px-4 rounded-lg font-medium"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          Start Conversation
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">
                      ℹ️ You can customize more settings including welcome message, avatar, and position
                      from your dashboard
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                    Complete Setup
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 6: Complete ── */}
            {currentStep === 'complete' && (
              <div className="space-y-6 text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">You're all set!</h3>
                  <p className="text-muted-foreground">
                    Welcome to LinoChat{formData.fullName ? `, ${formData.fullName.split(' ')[0]}` : ''}!
                  </p>
                </div>

                <div className="space-y-3">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">🎁 14-day free trial activated</Badge>
                </div>

                <p className="text-xs text-muted-foreground">Redirecting to your dashboard in a moment...</p>

                <div className="flex flex-col gap-2 pt-4">
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link to="/agent/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/help">View Getting Started Guide</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security badge */}
        {currentStep !== 'complete' && (
          <div className="text-center mt-6 text-xs text-muted-foreground">
            <p>🔒 Your data is encrypted and secure</p>
          </div>
        )}
      </div>
    </div>
  );
}

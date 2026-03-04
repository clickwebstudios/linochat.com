import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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

export default function Signup() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<SignupStep>('account');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
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

  // Validate Step 1 before advancing
  const handleStep1Continue = () => {
    if (!formData.fullName.trim()) return toast.error('Full name is required');
    if (!formData.email.trim()) return toast.error('Email address is required');
    if (!formData.companyName.trim()) return toast.error('Company name is required');
    if (!formData.password) return toast.error('Password is required');
    if (formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    clearError();
    handleNext();
  };

  // ─── Analysis loading screen (shown while API call is in progress) ────────────
  if (isAnalyzing) {
    const progressPercent = analysisComplete
      ? 100
      : ((analysisStep + 1) / ANALYSIS_STEPS.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="fixed top-6 left-6 flex items-center gap-2 z-10">
          <div className="bg-blue-600 p-2 rounded-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl text-blue-600">LinoChat</h1>
        </div>

        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">Setting up your account...</h2>
                <p className="text-gray-600">
                  Our AI is scanning your website to create a knowledge base.
                </p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-900">Analyzing...</span>
                    <span className="text-blue-600 font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
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
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300 flex-shrink-0" />
                      )}
                      <span
                        className={
                          index === analysisStep
                            ? 'text-blue-900 font-medium'
                            : index < analysisStep
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

              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Logo */}
      <div className="fixed top-6 left-6 flex items-center gap-2 z-10">
        <div className="bg-blue-600 p-2 rounded-lg">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl text-blue-600">LinoChat</h1>
      </div>

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
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
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
                          isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? 'bg-blue-600' : 'bg-gray-300'
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
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
                      <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                      >
                        <SelectTrigger id="country" className="pl-10">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
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
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500">At least 8 characters with letters and numbers</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                    <span className="bg-white px-2 text-gray-500">Or sign up with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" disabled>
                    <Chrome className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                  <Button variant="outline" disabled>
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </Button>
                </div>

                <Button onClick={handleStep1Continue} className="w-full bg-blue-600 hover:bg-blue-700">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
                </p>
              </div>
            )}

            {/* ── Step 2: Verify Email ── */}
            {currentStep === 'verify' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg">Check your email</h3>
                  <p className="text-sm text-gray-600">
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
                  <p className="text-xs text-center text-gray-500">
                    Didn't receive the code?{' '}
                    <button className="text-blue-600 hover:underline">Resend</button>
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Verify & Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
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
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                    <p className="text-xs text-gray-500">
                      Our AI will analyze your website to create a knowledge base and set up your project
                    </p>
                  </div>

                  {!websiteAnalyzed && (
                    <Button
                      onClick={handleRegister}
                      className="w-full bg-blue-600 hover:bg-blue-700"
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
                              <p className="text-xs text-gray-600">
                                We've created {kbArticlesCount} knowledge base articles from your website.
                              </p>
                            </div>

                            <div className="space-y-3">
                              <div className="bg-white rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-gray-400" />
                                  <label className="text-xs text-gray-500">Company Name</label>
                                </div>
                                <Input
                                  value={formData.companyName}
                                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                  className="border-gray-200"
                                />
                              </div>

                              <div className="bg-white rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-gray-400" />
                                  <label className="text-xs text-gray-500">Project Name</label>
                                </div>
                                <Input
                                  value={formData.projectName}
                                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                  className="border-gray-200"
                                />
                              </div>
                            </div>

                            <p className="text-xs text-gray-500">
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg">Invite your team</h3>
                  <p className="text-sm text-gray-600">
                    Collaborate with your team members to provide better support
                  </p>
                </div>

                <div className="space-y-3">
                  {formData.teamEmails.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600">
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
                  <Button onClick={handleNext} className="flex-1 bg-blue-600 hover:bg-blue-700">
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
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <Palette className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg">Customize your chat widget</h3>
                  <p className="text-sm text-gray-600">Make the widget match your brand</p>
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
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="text-sm font-medium mb-3">Widget Preview</h4>
                    <div className="bg-white rounded-lg p-4 shadow-lg max-w-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">{formData.companyName || 'Your Company'}</h5>
                          <p className="text-xs text-gray-500">We typically reply in a few minutes</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-gray-100 rounded-lg p-2 text-xs">
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

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600">
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
                  <Button onClick={handleNext} className="flex-1 bg-blue-600 hover:bg-blue-700">
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
                  <p className="text-gray-600">
                    Welcome to LinoChat{formData.fullName ? `, ${formData.fullName.split(' ')[0]}` : ''}!
                  </p>
                </div>

                <div className="space-y-3">
                  <Badge className="bg-blue-600 text-white px-4 py-1">🎁 14-day free trial activated</Badge>
                </div>

                <p className="text-xs text-gray-500">Redirecting to your dashboard in a moment...</p>

                <div className="flex flex-col gap-2 pt-4">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
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
          <div className="text-center mt-6 text-xs text-gray-500">
            <p>🔒 Your data is encrypted and secure</p>
          </div>
        )}
      </div>
    </div>
  );
}

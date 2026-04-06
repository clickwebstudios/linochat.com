import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
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
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Zap,
  Bot,
  BarChart3,
  Shield,
  Rocket,
  UserPlus,
  Brush,
  PartyPopper,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/client';
import { projectService } from '../../services/projects';

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

// Left panel content per step
const STEP_PANELS: Record<SignupStep, {
  icon: React.ReactNode;
  headline: string;
  sub: string;
  bullets: { icon: React.ReactNode; text: string }[];
}> = {
  account: {
    icon: <Rocket className="h-10 w-10" />,
    headline: 'Start delivering exceptional support',
    sub: 'Join thousands of businesses using LinoChat to delight their customers.',
    bullets: [
      { icon: <Bot className="h-4 w-4" />, text: 'AI handles up to 80% of chats automatically' },
      { icon: <MessageSquare className="h-4 w-4" />, text: 'Unified inbox for chat, tickets & email' },
      { icon: <BarChart3 className="h-4 w-4" />, text: 'Real-time analytics & insights' },
    ],
  },
  verify: {
    icon: <Shield className="h-10 w-10" />,
    headline: 'Keep your account secure',
    sub: "We sent a 4-digit code to your inbox. It expires in 10 minutes.",
    bullets: [
      { icon: <Shield className="h-4 w-4" />, text: 'Two-factor verification keeps bad actors out' },
      { icon: <Check className="h-4 w-4" />, text: 'Takes less than 30 seconds to complete' },
      { icon: <Mail className="h-4 w-4" />, text: "Check spam if you don't see the email" },
    ],
  },
  project: {
    icon: <Zap className="h-10 w-10" />,
    headline: 'AI builds your knowledge base instantly',
    sub: 'Just enter your website URL. Our AI does the rest in under 60 seconds.',
    bullets: [
      { icon: <Bot className="h-4 w-4" />, text: 'Scans your entire website automatically' },
      { icon: <Sparkles className="h-4 w-4" />, text: 'Generates dozens of ready-to-use articles' },
      { icon: <Zap className="h-4 w-4" />, text: 'AI starts answering questions immediately' },
    ],
  },
  team: {
    icon: <UserPlus className="h-10 w-10" />,
    headline: 'Better support starts with the right team',
    sub: 'Invite teammates to collaborate, share workload, and respond faster together.',
    bullets: [
      { icon: <Users className="h-4 w-4" />, text: 'Unlimited agents on all plans' },
      { icon: <Check className="h-4 w-4" />, text: 'Role-based permissions & visibility' },
      { icon: <MessageSquare className="h-4 w-4" />, text: 'Real-time handoff between AI and agents' },
    ],
  },
  customize: {
    icon: <Brush className="h-10 w-10" />,
    headline: 'Make the widget feel like yours',
    sub: 'Match your brand colors so the chat widget blends seamlessly into your site.',
    bullets: [
      { icon: <Palette className="h-4 w-4" />, text: 'Custom colors, logo, and welcome message' },
      { icon: <Globe className="h-4 w-4" />, text: 'Works on any website with one line of code' },
      { icon: <Sparkles className="h-4 w-4" />, text: 'More customization options in the dashboard' },
    ],
  },
  complete: {
    icon: <PartyPopper className="h-10 w-10" />,
    headline: "You're live — let's grow",
    sub: "Your workspace is ready. Install the widget and your first AI-powered conversation is minutes away.",
    bullets: [
      { icon: <Zap className="h-4 w-4" />, text: '14-day free trial, no credit card required' },
      { icon: <Bot className="h-4 w-4" />, text: 'AI is pre-trained on your website content' },
      { icon: <BarChart3 className="h-4 w-4" />, text: 'Your dashboard is ready to explore' },
    ],
  },
};

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

export default function Signup() {
  const navigate = useNavigate();
  const { register, googleLogin, isLoading, error, clearError } = useAuthStore();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [googleAuthed, setGoogleAuthed] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (r) => {
      try {
        await googleLogin(r.access_token);
        const authUser = useAuthStore.getState().user;
        if (authUser) {
          setFormData(prev => ({
            ...prev,
            fullName: [authUser.first_name, authUser.last_name].filter(Boolean).join(' '),
            email: authUser.email || '',
            companyName: authUser.company_name || prev.companyName,
            projectName: authUser.company_name ? `${authUser.company_name} Support` : prev.projectName,
          }));
        }
        setGoogleAuthed(true);
        setCurrentStep('project');
      } catch (e: any) {
        toast.error(e.message || 'Google sign up failed');
      }
    },
    onError: () => toast.error('Google sign up failed'),
  });

  const [currentStep, setCurrentStep] = useState<SignupStep>('account');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
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

  const steps: { id: SignupStep; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'verify', label: 'Verify' },
    { id: 'project', label: 'Workspace' },
    { id: 'team', label: 'Team' },
    { id: 'customize', label: 'Brand' },
    { id: 'complete', label: 'Done' },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const panel = STEP_PANELS[currentStep];

  const handleNext = () => {
    if (currentIndex < steps.length - 1) setCurrentStep(steps[currentIndex + 1].id);
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentStep(steps[currentIndex - 1].id);
  };

  const handleVerificationInput = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      if (value && index < 3) document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-advance after analysis success
  useEffect(() => {
    if (!websiteAnalyzed) return;
    const timer = setTimeout(() => handleNext(), 1800);
    return () => clearTimeout(timer);
  }, [websiteAnalyzed]);

  // Redirect on complete
  useEffect(() => {
    if (currentStep !== 'complete') return;
    const timer = setTimeout(() => {
      const { user } = useAuthStore.getState();
      if (user?.role === 'superadmin') navigate('/superadmin/dashboard', { replace: true });
      else if (user?.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else navigate('/agent/dashboard', { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentStep, navigate]);

  const sendCode = async (email: string) => {
    setIsSendingCode(true);
    setEmailTaken(false);
    try {
      await authApi.sendVerificationCode(email);
      setResendCooldown(60);
      toast.success('Verification code sent');
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('already registered')) {
        setEmailTaken(true);
      } else {
        toast.error(err.message || 'Failed to send code');
      }
      throw err;
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleStep1Continue = async () => {
    if (!formData.fullName.trim()) return toast.error('Full name is required');
    if (!formData.email.trim()) return toast.error('Email is required');
    if (!formData.companyName.trim()) return toast.error('Company name is required');
    if (!formData.password) return toast.error('Password is required');
    if (formData.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    clearError();
    try {
      await sendCode(formData.email);
      handleNext();
    } catch { /* toast already shown */ }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    if (code.length !== 4) { toast.error('Please enter the 4-digit code'); return; }
    setIsVerifying(true);
    try {
      await authApi.verifyEmailCode(formData.email, code);
      toast.success('Email verified!');
      handleNext();
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    } finally {
      setIsVerifying(false);
    }
  };

  const simulateAnalysisProgress = () => {
    setAnalysisStep(0);
    ANALYSIS_STEPS.forEach((_, i) => {
      setTimeout(() => setAnalysisStep(i), i * 800 + Math.random() * 400);
    });
  };

  const handleRegister = async () => {
    if (!formData.website.trim()) { toast.error('Website URL is required'); return; }
    clearError();
    let website = formData.website.trim();
    if (!website.startsWith('http')) website = `https://${website}`;
    setIsAnalyzing(true);
    simulateAnalysisProgress();
    try {
      if (googleAuthed) {
        // User already created via Google — just create the project
        const projectName = formData.projectName || `${formData.companyName} Support`;
        await projectService.create({ name: projectName, website, color: formData.primaryColor });
        setAnalysisStep(ANALYSIS_STEPS.length - 1);
        setKbArticlesCount(0);
        setAnalysisComplete(true);
        setFormData((prev) => ({ ...prev, projectName: prev.projectName || projectName }));
      } else {
        const nameParts = formData.fullName.trim().split(' ');
        const result = await register({
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || nameParts[0] || '',
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          website,
          company_name: formData.companyName,
        });
        setAnalysisStep(ANALYSIS_STEPS.length - 1);
        setKbArticlesCount(result.kbCount);
        setAnalysisComplete(true);
        setFormData((prev) => ({ ...prev, projectName: prev.projectName || `${prev.companyName} Support` }));
      }
      setIsAnalyzing(false);
      setWebsiteAnalyzed(true);
    } catch (err: any) {
      setIsAnalyzing(false);
      setAnalysisStep(0);
      setAnalysisComplete(false);
      toast.error(err.message || (googleAuthed ? 'Failed to create workspace. Please try again.' : 'Registration failed. Please try again.'));
    }
  };

  const addTeamEmail = () => setFormData({ ...formData, teamEmails: [...formData.teamEmails, ''] });
  const updateTeamEmail = (i: number, v: string) => {
    const emails = [...formData.teamEmails]; emails[i] = v;
    setFormData({ ...formData, teamEmails: emails });
  };
  const removeTeamEmail = (i: number) =>
    setFormData({ ...formData, teamEmails: formData.teamEmails.filter((_, idx) => idx !== i) });

  // ── Analysis loading screen ────────────────────────────────────────────────
  if (isAnalyzing) {
    const pct = analysisComplete ? 100 : ((analysisStep + 1) / ANALYSIS_STEPS.length) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Analyzing your website</h2>
            <p className="text-slate-500 mt-1">Building your AI knowledge base in real time</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">Progress</span>
                <span className="text-primary font-semibold">{Math.round(pct)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              {ANALYSIS_STEPS.map((label, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${i > analysisStep ? 'opacity-30' : 'opacity-100'}`}>
                  {i < analysisStep ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : i === analysisStep ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-200 shrink-0" />
                  )}
                  <span className={i === analysisStep ? 'text-primary font-medium' : i < analysisStep ? 'text-slate-500 line-through' : 'text-slate-400'}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">This usually takes 30–60 seconds</p>
        </div>
      </div>
    );
  }

  // ── Main wizard ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left branded panel */}
      <aside className="hidden lg:flex w-[480px] xl:w-[580px] shrink-0 flex-col bg-[#1e3a8a] relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 50%)' }} />
        <div className="relative flex flex-col h-full p-10">
          {/* Logo */}
          <Link to="/" className="mb-16">
            <img src="/logo-light.svg" alt="LinoChat" className="h-10" />
          </Link>

          {/* Step icon */}
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-white mb-6">
            {panel.icon}
          </div>

          {/* Headline */}
          <h2 className="text-2xl xl:text-3xl font-bold text-white leading-tight mb-3">
            {panel.headline}
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-10">
            {panel.sub}
          </p>

          {/* Bullets */}
          <ul className="space-y-4">
            {panel.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-blue-200">
                  {b.icon}
                </div>
                <span className="text-blue-100 text-sm">{b.text}</span>
              </li>
            ))}
          </ul>

          {/* Bottom testimonial */}
          <div className="mt-auto pt-10">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-blue-100 text-sm italic leading-relaxed">
                "LinoChat cut our support response time by 70% in the first week."
              </p>
              <p className="text-blue-300 text-xs mt-2 font-medium">— Sarah K., Head of Support at Growly</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Progress bar */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    i < currentIndex ? 'bg-primary text-white' :
                    i === currentIndex ? 'bg-primary text-white ring-4 ring-primary/20' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {i < currentIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 w-8 xl:w-12 rounded-full transition-all ${i < currentIndex ? 'bg-primary' : 'bg-slate-100'}`} />
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Step {currentIndex + 1} of {steps.length}
            </span>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-start justify-center p-8 pt-10 overflow-y-auto">
          <div className="w-full max-w-md">

            {/* API error */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* ── Step 1: Account ── */}
            {currentStep === 'account' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                  <p className="text-slate-500 text-sm mt-1">Free for 14 days — no credit card required</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input id="fullName" placeholder="John Doe" value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pl-9 h-11" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Work email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input id="email" type="email" placeholder="you@company.com" value={formData.email}
                        onChange={(e) => { setEmailTaken(false); setFormData({ ...formData, email: e.target.value }); }}
                        className={`pl-9 h-11 ${emailTaken ? 'border-amber-400 focus-visible:ring-amber-400' : ''}`} />
                    </div>
                    {emailTaken && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-amber-800">This email is already registered.</span>
                        <Link to="/login" className="ml-auto text-primary font-medium hover:underline whitespace-nowrap">Sign in →</Link>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input id="companyName" placeholder="Acme Inc." value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="pl-9 h-11" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
                      <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                        <SelectTrigger id="country" className="h-11">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input id="password" type="password" placeholder="Min. 8 characters" value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="pl-9 h-11" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input id="confirmPassword" type="password" placeholder="Repeat password" value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="pl-9 h-11" />
                      </div>
                    </div>
                  </div>
                  {googleClientId && (
                    <>
                      <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-white px-3 text-slate-400">or continue with</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="w-full h-11 flex items-center justify-center gap-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleGoogleSignup()}
                      >
                        <GoogleIcon className="h-4 w-4" />
                        Google
                      </button>
                    </>
                  )}
                  <Button onClick={handleStep1Continue} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium" disabled={isSendingCode}>
                    {isSendingCode ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending code...</> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                  <p className="text-center text-sm text-slate-500">
                    Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 2: Verify Email ── */}
            {currentStep === 'verify' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900">Check your inbox</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    We sent a 4-digit code to <span className="font-medium text-slate-700">{formData.email}</span>
                  </p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Verification code</label>
                    <div className="flex gap-3 justify-center">
                      {verificationCode.map((digit, i) => (
                        <Input
                          key={i}
                          id={`code-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleVerificationInput(i, e.target.value)}
                          className="w-14 h-14 text-center text-xl font-bold border-slate-200 focus:border-primary"
                        />
                      ))}
                    </div>
                    <p className="text-center text-sm text-slate-500 mt-4">
                      Didn't get it?{' '}
                      <button className="text-primary font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={async () => { try { await sendCode(formData.email); } catch {} }}
                        disabled={resendCooldown > 0 || isSendingCode}>
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                      </button>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleBack} variant="outline" className="flex-1 h-11" disabled={isVerifying}>
                      <ArrowLeft className="mr-2 h-4 w-4" />Back
                    </Button>
                    <Button onClick={handleVerifyCode} className="flex-2 h-11 bg-primary hover:bg-primary/90 text-white flex-[2]"
                      disabled={isVerifying || verificationCode.join('').length !== 4}>
                      {isVerifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : <>Verify & Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Create Project ── */}
            {currentStep === 'project' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900">Connect your website</h1>
                  <p className="text-slate-500 text-sm mt-1">Our AI will scan it and build a knowledge base in under a minute</p>
                </div>
                <div className="space-y-5">
                  {!websiteAnalyzed ? (
                    <>
                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-1.5">Website URL</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input id="website" type="url" placeholder="https://yourcompany.com"
                            value={formData.website}
                            onChange={(e) => { setFormData({ ...formData, website: e.target.value }); setWebsiteAnalyzed(false); }}
                            className="pl-9 h-11" />
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">Make sure the URL is publicly accessible</p>
                      </div>
                      <Button onClick={handleRegister} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium"
                        disabled={!formData.website.trim() || isLoading}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze & Create Workspace
                      </Button>
                      <Button onClick={handleBack} variant="ghost" className="w-full h-11 text-slate-500">
                        <ArrowLeft className="mr-2 h-4 w-4" />Back
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-900 text-sm">Workspace created!</p>
                          <p className="text-emerald-600 text-xs">{kbArticlesCount > 0 ? `${kbArticlesCount} KB articles generated from your site` : 'Knowledge base is being generated'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Company name</label>
                          <Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="h-9 text-sm bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Workspace name</label>
                          <Input value={formData.projectName} onChange={(e) => setFormData({ ...formData, projectName: e.target.value })} className="h-9 text-sm bg-white" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Continuing to next step...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 4: Team ── */}
            {currentStep === 'team' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900">Invite your team</h1>
                  <p className="text-slate-500 text-sm mt-1">Add teammates now or skip and do it later from your dashboard</p>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    {formData.teamEmails.map((email, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input placeholder="colleague@company.com" value={email}
                            onChange={(e) => updateTeamEmail(i, e.target.value)}
                            className="pl-9 h-11" />
                        </div>
                        {formData.teamEmails.length > 1 && (
                          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => removeTeamEmail(i)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addTeamEmail} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline cursor-pointer">
                    <span className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center text-primary text-base leading-none">+</span>
                    Add another person
                  </button>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p className="text-xs text-slate-500">
                      Each teammate gets an email invite with a link to join your workspace. They can set up their password on their own.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleBack} variant="outline" className="flex-1 h-11">
                      <ArrowLeft className="mr-2 h-4 w-4" />Back
                    </Button>
                    <Button onClick={handleNext} variant="outline" className="h-11 px-5 text-slate-500">Skip</Button>
                    <Button onClick={handleNext} className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white">
                      <UserPlus className="mr-2 h-4 w-4" />Send Invites
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 5: Customize ── */}
            {currentStep === 'customize' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900">Brand your chat widget</h1>
                  <p className="text-slate-500 text-sm mt-1">Pick a color that matches your website — visitors will trust it more</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Primary color</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Input type="color" value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="w-14 h-14 p-1 rounded-xl cursor-pointer border-slate-200" />
                      </div>
                      <Input value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        placeholder="#2563eb" className="flex-1 h-11 font-mono text-sm" />
                    </div>
                    <div className="flex gap-2 mt-3">
                      {['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0f172a'].map((c) => (
                        <button key={c} onClick={() => setFormData({ ...formData, primaryColor: c })}
                          className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer ${formData.primaryColor === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  {/* Live preview */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-3">Live preview</p>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 max-w-xs">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: formData.primaryColor }}>
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{formData.companyName || 'Your Company'}</p>
                          <p className="text-xs text-slate-400">We reply in a few minutes</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600 mb-3">
                        Hi! How can I help you today?
                      </div>
                      <button className="w-full text-xs text-white py-2 rounded-lg font-medium" style={{ backgroundColor: formData.primaryColor }}>
                        Start a conversation
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleBack} variant="outline" className="flex-1 h-11">
                      <ArrowLeft className="mr-2 h-4 w-4" />Back
                    </Button>
                    <Button onClick={handleNext} className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white">
                      Complete Setup <Check className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 6: Complete ── */}
            {currentStep === 'complete' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-50 mb-6">
                  <PartyPopper className="h-10 w-10 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Welcome, {formData.fullName.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-slate-500 text-sm mb-8">Your workspace is ready. Install the widget and go live in minutes.</p>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 mb-6 text-left space-y-3">
                  {[
                    { icon: <Rocket className="h-4 w-4 text-primary" />, title: 'Install the chat widget', desc: 'Paste one line of code into your website' },
                    { icon: <Bot className="h-4 w-4 text-emerald-500" />, title: 'AI is ready to respond', desc: `${kbArticlesCount > 0 ? `${kbArticlesCount} articles` : 'Knowledge base'} created from your site` },
                    { icon: <BarChart3 className="h-4 w-4 text-violet-500" />, title: 'Explore your dashboard', desc: 'View chats, tickets, and analytics' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button asChild className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium text-base">
                  <Link to="/admin/dashboard">
                    Go to Dashboard <ChevronRight className="ml-1.5 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Redirecting automatically...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {currentStep !== 'complete' && (
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <Shield className="h-3 w-3" />
              Your data is encrypted and secure
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

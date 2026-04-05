import { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Download,
  Check,
  Menu,
  Zap,
  Users,
  MessageCircle,
  Ticket,
  AlertCircle,
  Receipt,
  Shield,
  Lock,
  Loader2,
  Info,
  Eye,
  EyeOff,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Coins,
  TrendingUp,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { billingService } from '../../services/billing';
import type { TopUpPack, TopUpPacksResponse, TopUpIntent } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Input } from '../../components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { useLayout } from '../../components/layouts/LayoutContext';
import { useAuthStore } from '../../stores/authStore';
import { UpdateStatusDialog } from '../../components/UpdateStatusDialog';
import { toast } from 'sonner';

// ─── Plan data ─────────────────────────────────────────
const plans = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    period: 'forever',
    features: ['1 agent', 'Basic chat widget', '100 tickets/month', 'Email support', '7-day chat history'],
    agentLimit: 1,
    ticketLimit: 100,
    chatLimit: 500,
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 19,
    priceAnnual: 15,
    period: 'per user/month',
    features: ['Up to 5 agents', 'Unlimited chats', 'Unlimited tickets', 'Email & chat support', '30-day history', 'Basic analytics'],
    agentLimit: 5,
    ticketLimit: -1,
    chatLimit: -1,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 49,
    priceAnnual: 39,
    period: 'per user/month',
    features: ['Unlimited agents', 'AI chatbots', 'Advanced analytics', 'Priority support', 'Unlimited history', 'Custom integrations', 'SLA management'],
    agentLimit: -1,
    ticketLimit: -1,
    chatLimit: -1,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: -1,
    priceAnnual: -1,
    period: 'contact us',
    features: ['Everything in Pro', 'Dedicated account manager', 'Custom AI training', 'White-label options', 'GDPR compliance tools', 'Advanced security', '24/7 phone support'],
    agentLimit: -1,
    ticketLimit: -1,
    chatLimit: -1,
  },
];

// Invoice display shape (mapped from API)
interface DisplayInvoice {
  id: string;
  date: string;
  amount: string;
  status: string;
}

// ─── Card brand detection helpers ──────────────────────
type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

function detectCardBrand(number: string): CardBrand {
  const cleaned = number.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'discover';
  return 'unknown';
}

function formatCardNumber(value: string, brand: CardBrand): string {
  const cleaned = value.replace(/\D/g, '');
  const maxLen = brand === 'amex' ? 15 : 16;
  const truncated = cleaned.slice(0, maxLen);

  if (brand === 'amex') {
    // 4-6-5 grouping
    return truncated.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(' ')
    );
  }
  // 4-4-4-4 grouping
  return truncated.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 2)} / ${cleaned.slice(2)}`;
  }
  return cleaned;
}

function luhnCheck(num: string): boolean {
  const cleaned = num.replace(/\s/g, '');
  if (cleaned.length < 13) return false;
  let sum = 0;
  let alternate = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let n = parseInt(cleaned[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function isValidExpiry(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length !== 4) return false;
  const month = parseInt(cleaned.slice(0, 2), 10);
  const year = parseInt(`20${cleaned.slice(2)}`, 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expiry = new Date(year, month);
  return expiry > now;
}

const brandColors: Record<CardBrand, string> = {
  visa: 'from-primary to-primary/85',
  mastercard: 'from-red-500 to-orange-500',
  amex: 'from-blue-400 to-cyan-600',
  discover: 'from-orange-400 to-orange-600',
  unknown: 'from-gray-500 to-gray-700',
};

const brandLabels: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  unknown: 'Card',
};

// ─── Component ─────────────────────────────────────────
export default function BillingPage() {
  const { toggleMobileSidebar, role } = useLayout();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin')
    ? '/admin'
    : location.pathname.startsWith('/superadmin')
      ? '/superadmin'
      : '/agent';

  const isReadOnly = role === 'Agent';
  const authUser = useAuthStore((s) => s.user);
  const authUserName = authUser ? `${authUser.first_name} ${authUser.last_name}` : '';

  // ─── State ─────────────────────────────────────────
  const [currentPlanId, setCurrentPlanId] = useState('free');
  const [currentPlanDbId, setCurrentPlanDbId] = useState<number | null>(null);
  const [apiPlans, setApiPlans] = useState<{ id: number; name: string }[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
  const [agentCount, setAgentCount] = useState(1);
  const [invoices, setInvoices] = useState<DisplayInvoice[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string | null>(null);
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<'online' | 'away' | 'offline'>('online');

  // Payment form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCvc, setShowCvc] = useState(false);
  const [paymentFormTouched, setPaymentFormTouched] = useState({
    name: false,
    number: false,
    expiry: false,
    cvc: false,
  });

  // ─── Token Top-Up state ────────────────────────────
  const [topUpPacks, setTopUpPacks] = useState<TopUpPacksResponse>({});
  const [topUpPacksLoading, setTopUpPacksLoading] = useState(false);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);

  const [tokenBalance, setTokenBalance] = useState({
    tokens_used: 0,
    tokens_allowance: 0,
    tokens_rollover: 0,
    token_cycle_reset_at: null as string | null,
  });

  const [usageData, setUsageData] = useState({ tickets: 0, chats: 0, storage_gb: 0 });

  const tokenUsedPct = tokenBalance.tokens_allowance > 0
    ? Math.min(100, Math.round((tokenBalance.tokens_used / tokenBalance.tokens_allowance) * 100))
    : 0;
  const tokenRemainingPct = 100 - tokenUsedPct;
  const isLowTokens = tokenRemainingPct < 20;

  const daysUntilReset = useMemo(() => {
    if (!tokenBalance.token_cycle_reset_at) return null;
    const reset = new Date(tokenBalance.token_cycle_reset_at);
    const now = new Date();
    return Math.max(0, Math.ceil((reset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }, [tokenBalance.token_cycle_reset_at]);

  // Load subscription, token balance, invoices, and plans on mount
  useEffect(() => {
    setBillingLoading(true);
    Promise.all([
      billingService.getSubscription().catch(() => null),
      billingService.getTokenBalance().catch(() => null),
      billingService.getInvoices().catch(() => []),
      billingService.getPlans().catch(() => []),
      billingService.getUsage().catch(() => null),
    ]).then(([sub, tb, invs, apiPlanList, usageResp]) => {
      if (Array.isArray(apiPlanList) && apiPlanList.length > 0) {
        setApiPlans(apiPlanList.map(p => ({ id: p.id, name: p.name })));
      }
      if (sub?.plan?.name) {
        setCurrentPlanId(sub.plan.name.toLowerCase());
        setCurrentPlanDbId(sub.plan_id);
        setBillingCycle(sub.billing_cycle ?? 'monthly');
        setSubscriptionEndsAt(sub.ends_at ?? null);
      }
      if (tb) {
        setAgentCount(tb.agent_count || 1);
        setTokenBalance({
          tokens_used: tb.tokens_used_this_cycle,
          tokens_allowance: tb.monthly_token_allowance,
          tokens_rollover: tb.token_rollover,
          token_cycle_reset_at: tb.token_cycle_reset_at,
        });
      }
      if (usageResp) {
        setUsageData({ tickets: usageResp.tickets, chats: usageResp.chats, storage_gb: usageResp.storage_gb });
      }
      if (Array.isArray(invs)) {
        setInvoices(invs.map(inv => ({
          id: `INV-${inv.id}`,
          date: inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
          amount: `$${(inv.amount).toFixed(2)}`,
          status: inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
        })));
      }
    }).finally(() => setBillingLoading(false));
  }, []);

  // Load top-up packs on mount
  useEffect(() => {
    setTopUpPacksLoading(true);
    billingService.getTopUpPacks()
      .then(setTopUpPacks)
      .catch(() => {
        // Fallback packs if API is unavailable
        setTopUpPacks({
          starter_pack: { tokens: 500, price_cents: 700, label: 'Starter Pack' },
          growth_pack: { tokens: 2000, price_cents: 2400, label: 'Growth Pack' },
          power_pack: { tokens: 5000, price_cents: 5000, label: 'Power Pack' },
          scale_pack: { tokens: 15000, price_cents: 12000, label: 'Scale Pack' },
        });
      })
      .finally(() => setTopUpPacksLoading(false));
  }, []);

  const handleBuyPack = async (packType: string) => {
    setBuyingPack(packType);
    try {
      const origin = window.location.origin;
      const url = await billingService.createTopUpCheckout({
        pack_type: packType,
        success_url: `${origin}${window.location.pathname}?topup=success`,
        cancel_url: `${origin}${window.location.pathname}?topup=cancelled`,
      });
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Purchase failed';
      toast.error('Top-up failed', { description: msg });
      setBuyingPack(null);
    }
  };

  // Saved payment method state (simulates persisted card)
  const [savedCard, setSavedCard] = useState({
    brand: 'visa' as CardBrand,
    last4: '4532',
    expiry: '08/2027',
    name: authUserName,
  });

  // ─── Derived values ────────────────────────────────
  const currentPlan = plans.find(p => p.id === currentPlanId) ?? plans[0];

  const pricing = useMemo(() => {
    const monthlyPerUser = currentPlan.priceMonthly;
    const annualPerUser = currentPlan.priceAnnual;
    const isCustom = monthlyPerUser === -1;
    const isFree = monthlyPerUser === 0;

    if (isCustom) {
      return {
        perUser: 'Custom',
        totalPeriod: 'Custom',
        periodLabel: '',
        nextBillingDate: 'Contact sales',
        savingsAnnual: null,
        monthlyEquivalent: null,
        isCustom: true,
        isFree: false,
      };
    }

    if (billingCycle === 'annual') {
      const totalAnnual = annualPerUser * agentCount * 12;
      const monthlyTotal = monthlyPerUser * agentCount * 12;
      const savings = monthlyTotal - totalAnnual;
      return {
        perUser: annualPerUser,
        totalPeriod: totalAnnual,
        periodLabel: '/year',
        nextBillingDate: subscriptionEndsAt ? new Date(subscriptionEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—',
        savingsAnnual: savings,
        monthlyEquivalent: annualPerUser * agentCount,
        isCustom: false,
        isFree,
      };
    }

    return {
      perUser: monthlyPerUser,
      totalPeriod: monthlyPerUser * agentCount,
      periodLabel: '/month',
      nextBillingDate: subscriptionEndsAt ? new Date(subscriptionEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—',
      savingsAnnual: null,
      monthlyEquivalent: null,
      isCustom: false,
      isFree,
    };
  }, [currentPlan, billingCycle, agentCount, subscriptionEndsAt]);

  // Usage mock data (derived from current plan)
  const usage = useMemo(() => ({
    agents: { current: agentCount, limit: currentPlan.agentLimit },
    tickets: { current: usageData.tickets, limit: currentPlan.ticketLimit },
    chats: { current: usageData.chats, limit: currentPlan.chatLimit },
    storage: { current: usageData.storage_gb, limit: currentPlan.id === 'free' ? 1 : currentPlan.id === 'starter' ? 5 : 10 },
  }), [currentPlan, agentCount, usageData]);

  // Card form validation
  const detectedBrand = detectCardBrand(cardNumber);
  const cvcMaxLen = detectedBrand === 'amex' ? 4 : 3;
  const cardNumberClean = cardNumber.replace(/\s/g, '');
  const isCardNumberValid = cardNumberClean.length >= 13 && luhnCheck(cardNumberClean);
  const isExpiryValid = isValidExpiry(cardExpiry);
  const isCvcValid = cardCvc.length === cvcMaxLen;
  const isCardNameValid = cardName.trim().length >= 2;
  const isPaymentFormValid = isCardNumberValid && isExpiryValid && isCvcValid && isCardNameValid;

  // ─── Handlers ──────────────────────────────────────

  const [isConfirmingPlan, setIsConfirmingPlan] = useState(false);

  const confirmPlanChange = async () => {
    if (!selectedUpgradePlan) return;
    const newLocalPlan = plans.find(p => p.id === selectedUpgradePlan);
    if (!newLocalPlan) return;

    // Free plan: update directly in DB (no Stripe)
    if (selectedUpgradePlan === 'free') {
      const freePlan = apiPlans.find(p => p.name.toLowerCase() === 'free');
      if (freePlan) {
        setIsConfirmingPlan(true);
        try {
          await billingService.updateSubscription({ plan_id: freePlan.id, billing_cycle: billingCycle });
          setCurrentPlanId('free');
          setChangePlanDialogOpen(false);
          setSelectedUpgradePlan(null);
          toast.success('Downgraded to Free plan');
        } catch {
          toast.error('Failed to update plan');
        } finally {
          setIsConfirmingPlan(false);
        }
      }
      return;
    }

    // Paid plan: redirect to Stripe Checkout
    const apiPlan = apiPlans.find(p => p.name.toLowerCase() === selectedUpgradePlan);
    if (!apiPlan) {
      toast.error('Plan not found. Please try again.');
      return;
    }

    setIsConfirmingPlan(true);
    try {
      const origin = window.location.origin;
      const url = await billingService.createCheckoutSession({
        plan_id: apiPlan.id,
        billing_cycle: billingCycle,
        success_url: `${origin}${window.location.pathname}?billing=success`,
        cancel_url: `${origin}${window.location.pathname}?billing=cancelled`,
      });
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start checkout';
      toast.error('Checkout failed', { description: msg });
      setIsConfirmingPlan(false);
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading ${invoiceId}`, {
      description: 'Your invoice PDF will be ready shortly.',
    });
  };

  const resetPaymentForm = useCallback(() => {
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setShowCvc(false);
    setPaymentFormTouched({ name: false, number: false, expiry: false, cvc: false });
  }, []);

  const handleUpdatePayment = async () => {
    setIsProcessing(true);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}`;
      const url = await billingService.createPortalSession(returnUrl);
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to open billing portal';
      toast.error('Could not open billing portal', { description: msg });
      setIsProcessing(false);
    }
  };

  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      await billingService.cancelSubscription();
      setCancelDialogOpen(false);
      toast.success('Subscription cancelled', {
        description: `Your plan will remain active until ${pricing.nextBillingDate}.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel subscription';
      toast.error('Cancellation failed', { description: msg });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const brand = detectCardBrand(raw);
    setCardNumber(formatCardNumber(raw, brand));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardExpiry(formatExpiry(e.target.value));
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, cvcMaxLen);
    setCardCvc(cleaned);
  };

  const filteredInvoices = invoiceFilter === 'all'
    ? invoices
    : invoices.filter(inv => inv.status.toLowerCase() === invoiceFilter);

  // ─── Render ────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link
              to={`${basePath}/dashboard`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden md:inline">Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">SC</AvatarFallback>
              </Avatar>
              <span className={`absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                userStatus === 'online' ? 'bg-green-500' :
                userStatus === 'away' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}></span>
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold">{authUserName || 'Account'}</div>
              <div className="text-xs text-muted-foreground capitalize">{role}</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`${basePath}/profile-settings`} className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`${basePath}/billing`} className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusDialogOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Update Status
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <Link to="/">Log Out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-muted/50 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl text-foreground">Billing & Subscription</h1>
                <p className="text-muted-foreground mt-1">
                  {isReadOnly
                    ? 'View your organization\'s plan and invoice history'
                    : 'Manage your plan, payment method, and invoices'}
                </p>
              </div>
              {isReadOnly && (
                <Badge variant="secondary" className="flex items-center gap-1.5 bg-amber-100 text-amber-700 hover:bg-amber-100 self-start">
                  <Eye className="h-3.5 w-3.5" />
                  View Only
                </Badge>
              )}
            </div>

            {/* Agent Read-Only Banner */}
            {isReadOnly && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Lock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-amber-800">
                    Billing management is restricted to Admin users. You can view your current plan and download invoices, but changes require Admin access.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Contact your team administrator to modify billing settings.
                  </p>
                </div>
              </div>
            )}

            {/* ─── Current Plan Card ────────────────────────── */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>Your subscription details and billing</CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                  {currentPlan.name}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price breakdown */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl text-foreground">
                        {pricing.isCustom ? 'Custom' : `$${pricing.perUser}`}
                      </span>
                      {!pricing.isCustom && !pricing.isFree && (
                        <span className="text-muted-foreground">/ user / month</span>
                      )}
                    </div>

                    {!pricing.isCustom && !pricing.isFree && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-sm text-muted-foreground">
                          {agentCount} agents &times; ${pricing.perUser}/mo
                          {billingCycle === 'annual'
                            ? <> &times; 12 months = <span className="text-foreground">${typeof pricing.totalPeriod === 'number' ? pricing.totalPeriod.toLocaleString() : pricing.totalPeriod}{pricing.periodLabel}</span></>
                            : <> = <span className="text-foreground">${pricing.totalPeriod}{pricing.periodLabel}</span></>
                          }
                        </p>
                        {billingCycle === 'annual' && pricing.monthlyEquivalent !== null && (
                          <p className="text-sm text-muted-foreground">
                            Effective monthly cost: <span className="text-foreground">${pricing.monthlyEquivalent}/month</span>
                          </p>
                        )}
                        {billingCycle === 'annual' && pricing.savingsAnnual !== null && pricing.savingsAnnual > 0 && (
                          <p className="text-sm text-green-600">
                            You save ${pricing.savingsAnnual.toLocaleString()}/year compared to monthly billing
                          </p>
                        )}
                      </div>
                    )}

                    {!pricing.isFree && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Next billing date: <span className="text-foreground">{pricing.nextBillingDate}</span>
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Feature highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentPlan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                {!isReadOnly && (
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setChangePlanDialogOpen(true)}>
                      <Zap className="mr-2 h-4 w-4" />
                      Change Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Usage Overview ────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Usage This Period
                </CardTitle>
                <CardDescription>{billingLoading ? 'Loading…' : subscriptionEndsAt ? `Resets ${new Date(subscriptionEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Current period'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Agents */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Agents
                      </span>
                      <span className="text-foreground">
                        {usage.agents.current}
                        {usage.agents.limit !== -1 ? ` / ${usage.agents.limit}` : ' / Unlimited'}
                      </span>
                    </div>
                    <Progress
                      value={usage.agents.limit !== -1 ? (usage.agents.current / usage.agents.limit) * 100 : 15}
                      className="h-2"
                    />
                  </div>

                  {/* Tickets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Ticket className="h-4 w-4" />
                        Tickets
                      </span>
                      <span className="text-foreground">
                        {usage.tickets.current.toLocaleString()}
                        {usage.tickets.limit !== -1 ? ` / ${usage.tickets.limit.toLocaleString()}` : ' / Unlimited'}
                      </span>
                    </div>
                    <Progress
                      value={usage.tickets.limit !== -1 ? (usage.tickets.current / usage.tickets.limit) * 100 : 25}
                      className="h-2"
                    />
                  </div>

                  {/* Chats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="h-4 w-4" />
                        Chats
                      </span>
                      <span className="text-foreground">
                        {usage.chats.current.toLocaleString()}
                        {usage.chats.limit !== -1 ? ` / ${usage.chats.limit.toLocaleString()}` : ' / Unlimited'}
                      </span>
                    </div>
                    <Progress
                      value={usage.chats.limit !== -1 ? (usage.chats.current / usage.chats.limit) * 100 : 35}
                      className="h-2"
                    />
                  </div>

                  {/* Storage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Receipt className="h-4 w-4" />
                        Storage
                      </span>
                      <span className="text-foreground">
                        {usage.storage.current} GB / {usage.storage.limit} GB
                      </span>
                    </div>
                    <Progress
                      value={(usage.storage.current / usage.storage.limit) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── Token Balance + Top-Up ───────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Token Balance
                </CardTitle>
                <CardDescription>AI reply and messaging tokens for this billing cycle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Balance & usage */}
                <div className="space-y-4">
                  {isLowTokens && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-800">
                        Running low on tokens — top up to keep AI replies and messaging active
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {tokenBalance.tokens_used.toLocaleString()} used of {tokenBalance.tokens_allowance.toLocaleString()} included
                      </span>
                      <span className="text-foreground">
                        {(tokenBalance.tokens_allowance - tokenBalance.tokens_used).toLocaleString()} remaining
                      </span>
                    </div>
                    <Progress
                      value={tokenUsedPct}
                      className={`h-3 ${isLowTokens ? '[&>div]:bg-amber-400' : '[&>div]:bg-primary'}`}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{tokenUsedPct}% used</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {daysUntilReset !== null ? `Resets in ${daysUntilReset} day${daysUntilReset !== 1 ? 's' : ''}` : 'Next cycle pending'}
                      </span>
                    </div>
                  </div>
                  {tokenBalance.tokens_rollover > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
                      <RotateCcw className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        <span className="text-foreground">{tokenBalance.tokens_rollover.toLocaleString()} rollover tokens</span> carried from last cycle
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Top-Up Packs */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Top-Up Packs</span>
                    <span className="text-xs text-muted-foreground">— one-time purchases, never expire</span>
                  </div>
                  {topUpPacksLoading ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading packs…
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(topUpPacks).map(([packType, pack]: [string, TopUpPack]) => {
                        const priceUsd = pack.price_cents / 100;
                        const perToken = (pack.price_cents / pack.tokens / 100).toFixed(4);
                        const isBuying = buyingPack === packType;
                        return (
                          <div
                            key={packType}
                            className="flex flex-col gap-3 p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all"
                          >
                            <div>
                              <p className="text-sm text-foreground">{pack.label}</p>
                              <p className="text-2xl text-foreground mt-1">
                                {pack.tokens.toLocaleString()}
                                <span className="text-sm text-muted-foreground ml-1">tokens</span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">${perToken} per token</p>
                            </div>
                            <Button
                              size="sm"
                              className="mt-auto w-full"
                              disabled={isBuying || isReadOnly}
                              onClick={() => handleBuyPack(packType)}
                            >
                              {isBuying ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Processing…</>
                              ) : (
                                <>Buy — ${priceUsd.toFixed(0)}</>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ─── Transaction History ──────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Token Transaction History
                </CardTitle>
                <CardDescription>Recent token additions and usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  Transaction history coming soon
                </div>
              </CardContent>
            </Card>

            {/* ─── Payment Method + Invoice History ────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment Method */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className={`h-10 w-14 rounded bg-gradient-to-r ${brandColors[savedCard.brand]} flex items-center justify-center`}>
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{brandLabels[savedCard.brand]} ending in {savedCard.last4}</p>
                      <p className="text-xs text-muted-foreground">Expires {savedCard.expiry}</p>
                    </div>
                  </div>

                  {isReadOnly ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button variant="outline" className="w-full" disabled>
                            <Lock className="mr-2 h-4 w-4" />
                            Update Payment Method
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Only Admins can update payment methods</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setPaymentMethodDialogOpen(true)}
                    >
                      Update Payment Method
                    </Button>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Billing Address</p>
                    <div className="text-sm text-muted-foreground">
                      <p>{savedCard.name}</p>
                      <p>Acme Corporation</p>
                      <p>123 Business Ave, Suite 400</p>
                      <p>San Francisco, CA 94105</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Billing Email</p>
                    <p className="text-sm text-muted-foreground">billing@acmecorp.com</p>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice History */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      Invoice History
                    </CardTitle>
                    <CardDescription>Download past invoices and receipts</CardDescription>
                  </div>
                  <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading invoices…</TableCell></TableRow>
                      ) : filteredInvoices.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No invoices found</TableCell></TableRow>
                      ) : (filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="text-foreground">{invoice.id}</TableCell>
                          <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                          <TableCell className="text-foreground">{invoice.amount}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                invoice.status === 'Paid'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(invoice.id)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      )))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* ─── Change Plan Dialog ─────────────────────────── */}
        <Dialog open={changePlanDialogOpen} onOpenChange={setChangePlanDialogOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Change Your Plan</DialogTitle>
              <DialogDescription>
                Select a plan that fits your needs. Changes take effect immediately.
              </DialogDescription>
            </DialogHeader>

            {/* Billing toggle inside dialog */}
            <div className="flex items-center justify-center gap-3 py-2">
              <span className={`text-sm ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
              <Switch
                checked={billingCycle === 'annual'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
              />
              <span className={`text-sm ${billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annual
                <Badge variant="secondary" className="ml-1.5 bg-green-100 text-green-700 hover:bg-green-100">
                  -20%
                </Badge>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2">
              {plans.map((plan) => {
                const isCurrentPlan = plan.id === currentPlanId;
                const isSelected = plan.id === selectedUpgradePlan;
                const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
                const monthlyPrice = plan.priceMonthly;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : isCurrentPlan
                          ? 'border-border bg-muted/50'
                          : 'border-border hover:border-border hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (!isCurrentPlan) setSelectedUpgradePlan(plan.id);
                    }}
                  >
                    {plan.popular && !isCurrentPlan && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground hover:bg-primary">
                        Popular
                      </Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-foreground text-primary-foreground hover:bg-foreground">
                        Current
                      </Badge>
                    )}
                    <h3 className="text-foreground mt-1">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-2xl text-foreground">
                        {price === -1 ? 'Custom' : `$${price}`}
                      </span>
                      {price !== -1 && price !== 0 && (
                        <span className="text-sm text-muted-foreground">/mo</span>
                      )}
                    </div>
                    {billingCycle === 'annual' && monthlyPrice > 0 && price !== -1 && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Save ${(monthlyPrice - price) * agentCount * 12}/yr
                      </p>
                    )}
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.slice(0, 4).map((feature) => (
                        <li key={feature} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-xs text-primary">
                          +{plan.features.length - 4} more
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Confirmation summary */}
            {selectedUpgradePlan && selectedUpgradePlan !== currentPlanId && (() => {
              const newPlan = plans.find(p => p.id === selectedUpgradePlan)!;
              const newPrice = billingCycle === 'monthly' ? newPlan.priceMonthly : newPlan.priceAnnual;
              const isUpgrade = plans.indexOf(newPlan) > plans.indexOf(currentPlan);
              return (
                <div className={`p-3 rounded-lg border text-sm ${isUpgrade ? 'bg-primary/10 border-primary/20' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start gap-2">
                    <Info className={`h-4 w-4 mt-0.5 shrink-0 ${isUpgrade ? 'text-primary' : 'text-amber-600'}`} />
                    <div>
                      <p className={isUpgrade ? 'text-primary' : 'text-amber-800'}>
                        {isUpgrade ? 'Upgrade' : 'Downgrade'} from <span className="font-medium">{currentPlan.name}</span> to <span className="font-medium">{newPlan.name}</span>
                      </p>
                      {newPrice !== -1 && (
                        <p className={`mt-0.5 ${isUpgrade ? 'text-primary' : 'text-amber-600'}`}>
                          New cost: ${newPrice * agentCount}{billingCycle === 'annual' ? ` &times; 12 = $${newPrice * agentCount * 12}/year` : '/month'} for {agentCount} agents
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
              <div>
                {!pricing.isFree && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => { setChangePlanDialogOpen(false); setCancelDialogOpen(true); }}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setChangePlanDialogOpen(false); setSelectedUpgradePlan(null); }}>
                  Close
                </Button>
                <Button
                  disabled={!selectedUpgradePlan || selectedUpgradePlan === currentPlanId || isConfirmingPlan}
                  onClick={confirmPlanChange}
                >
                  {isConfirmingPlan ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Redirecting...</> :
                    selectedUpgradePlan && plans.findIndex(p => p.id === selectedUpgradePlan) > plans.findIndex(p => p.id === currentPlanId)
                    ? 'Upgrade Plan'
                    : selectedUpgradePlan && plans.findIndex(p => p.id === selectedUpgradePlan) < plans.findIndex(p => p.id === currentPlanId)
                      ? 'Downgrade Plan'
                      : 'Confirm Change'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Stripe-style Update Payment Method Dialog ── */}
        <Dialog
          open={paymentMethodDialogOpen}
          onOpenChange={(open) => {
            setPaymentMethodDialogOpen(open);
            if (!open) resetPaymentForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Payment Method</DialogTitle>
              <DialogDescription>
                Enter your card details below. Your information is encrypted and processed securely.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Live card preview */}
              <div className={`relative w-full h-40 rounded-xl bg-gradient-to-br ${brandColors[detectedBrand]} p-5 text-white shadow-lg overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <div className="h-8 w-10 rounded bg-white/20 flex items-center justify-center">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <span className="text-xs opacity-80">{brandLabels[detectedBrand]}</span>
                  </div>
                  <div>
                    <p className="text-sm tracking-widest opacity-90 font-mono">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <p className="text-[10px] uppercase opacity-60">Card Holder</p>
                        <p className="text-xs">{cardName || 'YOUR NAME'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase opacity-60">Expires</p>
                        <p className="text-xs">{cardExpiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name on Card */}
              <div className="space-y-1.5">
                <Label htmlFor="card-name">Name on Card</Label>
                <Input
                  id="card-name"
                  placeholder="Card holder name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  onBlur={() => setPaymentFormTouched(t => ({ ...t, name: true }))}
                  className={paymentFormTouched.name && !isCardNameValid ? 'border-red-300 focus-visible:ring-red-400' : ''}
                />
                {paymentFormTouched.name && !isCardNameValid && (
                  <p className="text-xs text-red-500">Please enter the name on your card</p>
                )}
              </div>

              {/* Card Number */}
              <div className="space-y-1.5">
                <Label htmlFor="card-number">Card Number</Label>
                <div className="relative">
                  <Input
                    id="card-number"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    onBlur={() => setPaymentFormTouched(t => ({ ...t, number: true }))}
                    className={`pr-16 ${paymentFormTouched.number && cardNumberClean.length > 0 && !isCardNumberValid ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
                    maxLength={detectedBrand === 'amex' ? 17 : 19}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {cardNumberClean.length > 0 && (
                      isCardNumberValid ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : paymentFormTouched.number ? (
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      ) : null
                    )}
                    <div className={`h-5 w-8 rounded bg-gradient-to-r ${brandColors[detectedBrand]} opacity-60`} />
                  </div>
                </div>
                {paymentFormTouched.number && cardNumberClean.length > 0 && !isCardNumberValid && (
                  <p className="text-xs text-red-500">Please enter a valid card number</p>
                )}
              </div>

              {/* Expiry + CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="card-expiry">Expiry Date</Label>
                  <Input
                    id="card-expiry"
                    placeholder="MM / YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    onBlur={() => setPaymentFormTouched(t => ({ ...t, expiry: true }))}
                    className={paymentFormTouched.expiry && cardExpiry.length > 0 && !isExpiryValid ? 'border-red-300 focus-visible:ring-red-400' : ''}
                    maxLength={7}
                  />
                  {paymentFormTouched.expiry && cardExpiry.length > 0 && !isExpiryValid && (
                    <p className="text-xs text-red-500">Invalid expiry date</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-cvc">CVC</Label>
                  <div className="relative">
                    <Input
                      id="card-cvc"
                      type={showCvc ? 'text' : 'password'}
                      placeholder={detectedBrand === 'amex' ? '1234' : '123'}
                      value={cardCvc}
                      onChange={handleCvcChange}
                      onBlur={() => {
                        setPaymentFormTouched(t => ({ ...t, cvc: true }));
                      }}
                      className={paymentFormTouched.cvc && cardCvc.length > 0 && !isCvcValid ? 'border-red-300 focus-visible:ring-red-400 pr-8' : 'pr-8'}
                      maxLength={cvcMaxLen}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowCvc(v => !v);
                      }}
                    >
                      {showCvc ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {paymentFormTouched.cvc && cardCvc.length > 0 && !isCvcValid && (
                    <p className="text-xs text-red-500">{detectedBrand === 'amex' ? '4 digits required' : '3 digits required'}</p>
                  )}
                </div>
              </div>

              {/* Security info */}
              <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-primary">
                    Your payment is processed securely via Stripe. LinoChat never stores your full card number, CVC, or sensitive card data on our servers.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-primary flex items-center gap-1">
                      <Lock className="h-3 w-3" /> 256-bit SSL
                    </span>
                    <span className="text-[10px] text-primary flex items-center gap-1">
                      <Shield className="h-3 w-3" /> PCI DSS Compliant
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setPaymentMethodDialogOpen(false); resetPaymentForm(); }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePayment}
                disabled={!isPaymentFormValid || isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Save Card Securely
                  </span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Cancel Subscription Dialog ──────────────────── */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Cancel Subscription
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel your subscription?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="p-4 bg-red-50 rounded-lg space-y-2">
                <p className="text-sm text-red-800">If you cancel:</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc pl-5">
                  <li>Your plan will remain active until {pricing.nextBillingDate}</li>
                  <li>After that, your account will be downgraded to Free</li>
                  <li>You'll lose access to {currentPlan.name} features like {currentPlan.features.slice(1, 3).join(' and ')}</li>
                  <li>Your data will be retained for 30 days</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                Keep Subscription
              </Button>
              <Button variant="destructive" onClick={handleCancelSubscription} disabled={isCancelling}>
                {isCancelling ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cancelling...</> : 'Yes, Cancel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <UpdateStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          status={userStatus}
          onStatusChange={setUserStatus}
        />
      </div>
    </TooltipProvider>
  );
}
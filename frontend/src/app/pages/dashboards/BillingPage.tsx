import { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { ProfileDropdown } from '../../components/ProfileDropdown';
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
    features: ['1 agent', 'Basic chat widget', '100 tickets/month', '100 chats/month', 'Email support', '7-day chat history'],
    agentLimit: 1,
    ticketLimit: 100,
    chatLimit: 100,
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 19,
    priceAnnual: 15,
    period: 'per user/month',
    features: ['Up to 5 agents', 'Unlimited chats', 'Unlimited tickets', 'Popover campaigns', 'Email & chat support', '30-day history', 'Basic analytics'],
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
    features: ['Unlimited agents', 'AI chatbots', 'Popover campaigns', 'Advanced analytics', 'Priority support', 'Unlimited history', 'Custom integrations', 'SLA management'],
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
  pdf_url: string | null;
  receipt_url: string | null;
}

// ─── Card brand helpers ──────────────────────
type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

const brandColors: Record<CardBrand, string> = {
  visa: 'from-primary to-primary/85',
  mastercard: 'from-red-500 to-orange-500',
  amex: 'from-blue-400 to-cyan-600',
  discover: 'from-orange-400 to-orange-600',
  unknown: 'from-gray-500 to-gray-700',
};

// ─── Component ─────────────────────────────────────────
export default function BillingPage() {
  const { toggleMobileSidebar, role } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [downgradeSelected, setDowngradeSelected] = useState(false);
  const [agentCount, setAgentCount] = useState(1);
  const [invoices, setInvoices] = useState<DisplayInvoice[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(
    () => new URLSearchParams(location.search).get('upgrade') === '1'
  );
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [tokenTransactions, setTokenTransactions] = useState<{ id: number; action_type: string; tokens_amount: number; balance_after: number; created_at: string }[]>([]);
  const [userStatus, setUserStatus] = useState<'online' | 'away' | 'offline'>('online');

  const [isProcessing, setIsProcessing] = useState(false);

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

  // Load subscription, token balance, invoices, and plans
  const loadBillingData = useCallback(() => {
    setBillingLoading(true);
    return Promise.all([
      billingService.getSubscription().catch(() => null),
      billingService.getTokenBalance().catch(() => null),
      billingService.getStripeInvoices().catch(() => []),
      billingService.getPlans().catch(() => []),
      billingService.getUsage().catch(() => null),
      billingService.getPaymentMethod().catch(() => null),
      billingService.getTokenTransactions().catch(() => []),
    ]).then(([sub, tb, invs, apiPlanList, usageResp, pmResp, txns]) => {
      if (Array.isArray(apiPlanList) && apiPlanList.length > 0) {
        setApiPlans(apiPlanList.map(p => ({ id: p.id, name: p.name })));
      }
      if (sub?.plan?.name) {
        setCurrentPlanId(sub.plan.name.toLowerCase());
        setCurrentPlanDbId(sub.plan_id);
        setBillingCycle(sub.billing_cycle ?? 'monthly');
        setSubscriptionEndsAt(sub.renews_at ?? sub.ends_at ?? null);
        setSubscriptionStatus(sub.status);
        setDowngradeSelected(!!sub.downgrade_selected_at);
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
      if (pmResp) {
        const expMonth = String(pmResp.exp_month).padStart(2, '0');
        const expYear = String(pmResp.exp_year).slice(-2);
        setSavedCard({ brand: pmResp.brand, last4: pmResp.last4, expiry: `${expMonth}/${expYear}`, name: pmResp.name, email: pmResp.email });
      }
      if (Array.isArray(invs)) {
        setInvoices(invs.map(inv => ({
          id: inv.number ?? inv.id,
          date: new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          amount: `$${(inv.amount).toFixed(2)}`,
          status: inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
          pdf_url: inv.pdf_url ?? null,
          receipt_url: inv.receipt_url ?? null,
        })));
      }
      if (Array.isArray(txns)) {
        setTokenTransactions(txns);
      }
    }).finally(() => setBillingLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('billing') === 'success') {
      // Sync subscription from Stripe before loading (webhook may not have fired yet)
      navigate(location.pathname, { replace: true });
      billingService.syncSubscription().catch(() => {}).finally(() => loadBillingData());
    } else {
      loadBillingData();
    }
  }, [loadBillingData, location.search, location.pathname, navigate]);

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
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Purchase failed';
      toast.error('Top-up failed', { description: msg });
      setBuyingPack(null);
    }
  };

  const [savedCard, setSavedCard] = useState<{ brand: string; last4: string; expiry: string; name: string | null; email: string | null } | null>(null);

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

  const usage = useMemo(() => ({
    agents: { current: agentCount, limit: currentPlan.agentLimit },
    tickets: { current: usageData.tickets, limit: currentPlan.ticketLimit },
    chats: { current: usageData.chats, limit: currentPlan.chatLimit },
    storage: { current: usageData.storage_gb, limit: currentPlan.id === 'free' ? 1 : currentPlan.id === 'starter' ? 5 : 10 },
  }), [currentPlan, agentCount, usageData]);

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

    // Paid plan: update existing subscription (with proration) or start new checkout
    setIsConfirmingPlan(true);
    try {
      if (subscriptionStatus === 'active') {
        // Active subscriber — update Stripe subscription in-place with proration
        await billingService.upgradePaidPlan({ plan_name: selectedUpgradePlan, billing_cycle: billingCycle });
        await loadBillingData();
        setChangePlanDialogOpen(false);
        setSelectedUpgradePlan(null);
        toast.success(`Plan updated to ${selectedUpgradePlan}`, { description: 'Prorated charges have been applied.' });
        setIsConfirmingPlan(false);
      } else {
        // No active subscription or cancelled — create fresh Stripe Checkout session
        const origin = window.location.origin;
        const url = await billingService.createCheckoutSession({
          plan_name: selectedUpgradePlan,
          billing_cycle: billingCycle,
          success_url: `${origin}${window.location.pathname}?billing=success`,
          cancel_url: `${origin}${window.location.pathname}?billing=cancelled`,
        });
        window.location.href = url;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to update plan';
      toast.error('Plan update failed', { description: msg });
      setIsConfirmingPlan(false);
    }
  };

  const handleDownloadInvoice = (invoice: DisplayInvoice) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('PDF not available for this invoice');
    }
  };

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

  const [isResuming, setIsResuming] = useState(false);

  const handleResumeSubscription = async () => {
    setIsResuming(true);
    try {
      await billingService.resumeSubscription();
      toast.success('Subscription resumed', {
        description: 'Your subscription is now active again.',
      });
      await loadBillingData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resume subscription';
      toast.error('Resume failed', { description: msg });
    } finally {
      setIsResuming(false);
    }
  };

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      await billingService.cancelSubscription(cancelReason || undefined);
      setCancelDialogOpen(false);
      toast.success('Subscription cancelled', {
        description: `Your plan will remain active until ${pricing.nextBillingDate}.`,
      });
      await loadBillingData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel subscription';
      toast.error('Cancellation failed', { description: msg });
    } finally {
      setIsCancelling(false);
    }
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
            <ProfileDropdown
              basePath={basePath}
              isSuperadmin={basePath === '/superadmin'}
              onStatusClick={() => setStatusDialogOpen(true)}
            />
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
                <div className="flex items-center gap-2">
                  {subscriptionStatus === 'cancelled' && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                      Cancellation pending
                    </Badge>
                  )}
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                    {currentPlan.name}
                  </Badge>
                </div>
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

                    {!pricing.isCustom && !pricing.isFree && billingCycle === 'annual' && (
                      <div className="mt-1 space-y-0.5">
                        {pricing.monthlyEquivalent !== null && (
                          <p className="text-sm text-muted-foreground">
                            Effective monthly cost: <span className="text-foreground">${pricing.monthlyEquivalent}/month</span>
                          </p>
                        )}
                        {pricing.savingsAnnual !== null && pricing.savingsAnnual > 0 && (
                          <p className="text-sm text-green-600">
                            You save ${pricing.savingsAnnual.toLocaleString()}/year compared to monthly billing
                          </p>
                        )}
                      </div>
                    )}

                    {!pricing.isFree && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {subscriptionStatus === 'cancelled' ? 'Expires on' : 'Next billing date'}: <span className="text-foreground">{pricing.nextBillingDate}</span>
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
                    {subscriptionStatus === 'cancelled' ? (
                      <>
                        <Button onClick={handleResumeSubscription} disabled={isResuming}>
                          {isResuming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                          Resume Subscription
                        </Button>
                        {!downgradeSelected && (
                          <Button variant="outline" onClick={() => navigate(`${basePath}/billing/downgrade-selection`)}>
                            Choose what to keep
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button onClick={() => { setBillingCycle('annual'); setChangePlanDialogOpen(true); }}>
                        <Zap className="mr-2 h-4 w-4" />
                        Change Plan
                      </Button>
                    )}
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
                      value={usage.tickets.limit !== -1 ? (usage.tickets.current / usage.tickets.limit) * 100 : 100}
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
                      value={usage.chats.limit !== -1 ? (usage.chats.current / usage.chats.limit) * 100 : 100}
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
                {billingLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading…</div>
                ) : tokenTransactions.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No transactions yet</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokenTransactions.map((tx) => {
                        const isCredit = tx.tokens_amount > 0;
                        const label: Record<string, string> = {
                          monthly_grant: 'Monthly Grant',
                          rollover: 'Rollover',
                          expiry: 'Expiry',
                          topup: 'Top-Up Purchase',
                          ai_reply: 'AI Reply',
                          ai_resolution: 'AI Resolution',
                          messenger: 'Messenger',
                          whatsapp_service: 'WhatsApp Service',
                          whatsapp_utility: 'WhatsApp Utility',
                          whatsapp_marketing: 'WhatsApp Marketing',
                        };
                        return (
                          <TableRow key={tx.id}>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="text-sm">{label[tx.action_type] ?? tx.action_type}</TableCell>
                            <TableCell className={`text-right font-medium ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                              {isCredit ? '+' : ''}{tx.tokens_amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {tx.balance_after.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
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
                  {savedCard ? (
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                      <div className={`h-10 w-14 rounded bg-gradient-to-r ${brandColors[savedCard.brand as CardBrand] ?? brandColors.unknown} flex items-center justify-center`}>
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground capitalize">{savedCard.brand} ending in {savedCard.last4}</p>
                        <p className="text-xs text-muted-foreground">Expires {savedCard.expiry}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50 text-muted-foreground">
                      <CreditCard className="h-5 w-5 shrink-0" />
                      <p className="text-sm">No payment method on file</p>
                    </div>
                  )}

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
                      onClick={handleUpdatePayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting…</>
                      ) : (
                        'Update Payment Method'
                      )}
                    </Button>
                  )}

                  {(savedCard?.name || savedCard?.email) && (
                    <>
                      <Separator />
                      {savedCard.name && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Billing Name</p>
                          <p className="text-sm">{savedCard.name}</p>
                        </div>
                      )}
                      {savedCard.email && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Billing Email</p>
                          <p className="text-sm">{savedCard.email}</p>
                        </div>
                      )}
                    </>
                  )}
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
                          <TableCell className="text-right flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(invoice)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!invoice.receipt_url}
                              onClick={() => invoice.receipt_url && window.open(invoice.receipt_url, '_blank', 'noopener,noreferrer')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Receipt
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
        <Dialog open={changePlanDialogOpen} onOpenChange={(open) => { setChangePlanDialogOpen(open); if (!open) setSelectedUpgradePlan(null); }}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
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
                disabled={currentPlanId !== 'free'}
              />
              <span className={`text-sm ${billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annual
                <Badge variant="secondary" className="ml-1.5 bg-green-100 text-green-700 hover:bg-green-100">
                  -20%
                </Badge>
              </span>
              {currentPlanId !== 'free' && (
                <span className="text-xs text-muted-foreground">(manage via billing portal)</span>
              )}
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
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
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
                        <>
                          <p className={`mt-0.5 ${isUpgrade ? 'text-primary' : 'text-amber-600'}`}>
                            New cost: ${newPrice}{billingCycle === 'annual' ? ` × 12 = $${newPrice * 12}/year` : '/month'}
                          </p>
                          {billingCycle === 'annual' && newPlan.priceMonthly > 0 && newPrice !== -1 && (
                            <p className="mt-0.5 text-xs text-green-600">
                              Save ${(newPlan.priceMonthly - newPrice) * 12}/year vs monthly billing
                            </p>
                          )}
                          {isUpgrade && subscriptionStatus === 'active' && subscriptionEndsAt && (() => {
                            const msRemaining = new Date(subscriptionEndsAt).getTime() - Date.now();
                            const daysRemaining = Math.max(0, Math.ceil(msRemaining / 86400000));
                            const daysInCycle = billingCycle === 'annual' ? 365 : 30;
                            const currentPrice = billingCycle === 'annual' ? currentPlan.priceAnnual : currentPlan.priceMonthly;
                            const credit = Math.round((daysRemaining / daysInCycle) * currentPrice * 100) / 100;
                            const charge = Math.round((daysRemaining / daysInCycle) * newPrice * 100) / 100;
                            const net = Math.max(0, Math.round((charge - credit) * 100) / 100);
                            return (
                              <p className="mt-1 text-xs opacity-70">
                                Prorated today: ~${net} ({daysRemaining} days remaining · ${charge} new − ${credit} credit)
                              </p>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
              <div>
                {!pricing.isFree && subscriptionStatus !== 'cancelled' && (
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
                {selectedUpgradePlan === 'enterprise' ? (
                  <Button onClick={() => { setChangePlanDialogOpen(false); navigate('/contact'); }}>
                    Contact Support
                  </Button>
                ) : (
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
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Cancel Subscription Dialog ──────────────────── */}
        <Dialog open={cancelDialogOpen} onOpenChange={(open) => { setCancelDialogOpen(open); if (!open) setCancelReason(''); }}>
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
            <div className="space-y-4 py-4">
              <div className="p-4 bg-red-50 rounded-lg space-y-2">
                <p className="text-sm text-red-800">If you cancel:</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc pl-5">
                  <li>Your plan will remain active until {pricing.nextBillingDate}</li>
                  <li>After that, your account will be downgraded to Free</li>
                  <li>You'll lose access to {currentPlan.name} features like {currentPlan.features.slice(1, 3).join(' and ')}</li>
                  <li>Your data will be retained for 30 days</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Why are you cancelling? <span className="text-muted-foreground font-normal">(optional)</span></p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Too expensive',
                    'Missing features',
                    'Switching to competitor',
                    'Not using it enough',
                    'Technical issues',
                    'Other',
                  ].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setCancelReason(cancelReason === reason ? '' : reason)}
                      className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                        cancelReason === reason
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border text-muted-foreground hover:border-muted-foreground'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCancelDialogOpen(false); setCancelReason(''); }}>
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
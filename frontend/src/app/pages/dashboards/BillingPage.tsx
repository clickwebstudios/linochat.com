import { useState, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
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

// ─── Mock invoice data ─────────────────────────────────
const mockInvoices = [
  { id: 'INV-2026-0002', date: 'Feb 1, 2026', amount: '$245.00', status: 'Paid', plan: 'Pro', agents: 5 },
  { id: 'INV-2026-0001', date: 'Jan 1, 2026', amount: '$245.00', status: 'Paid', plan: 'Pro', agents: 5 },
  { id: 'INV-2025-0012', date: 'Dec 1, 2025', amount: '$245.00', status: 'Paid', plan: 'Pro', agents: 5 },
  { id: 'INV-2025-0011', date: 'Nov 1, 2025', amount: '$196.00', status: 'Paid', plan: 'Pro', agents: 4 },
  { id: 'INV-2025-0010', date: 'Oct 1, 2025', amount: '$196.00', status: 'Paid', plan: 'Pro', agents: 4 },
  { id: 'INV-2025-0009', date: 'Sep 1, 2025', amount: '$147.00', status: 'Paid', plan: 'Pro', agents: 3 },
];

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
  visa: 'from-blue-600 to-blue-800',
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

  // ─── State ─────────────────────────────────────────
  const [currentPlanId, setCurrentPlanId] = useState('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
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

  // Saved payment method state (simulates persisted card)
  const [savedCard, setSavedCard] = useState({
    brand: 'visa' as CardBrand,
    last4: '4532',
    expiry: '08/2027',
    name: 'Sarah Chen',
  });

  // ─── Derived values ────────────────────────────────
  const currentPlan = plans.find(p => p.id === currentPlanId)!;
  const agentCount = 5;

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
        nextBillingDate: 'February 1, 2027',
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
      nextBillingDate: 'March 1, 2026',
      savingsAnnual: null,
      monthlyEquivalent: null,
      isCustom: false,
      isFree,
    };
  }, [currentPlan, billingCycle, agentCount]);

  // Usage mock data (derived from current plan)
  const usage = useMemo(() => ({
    agents: { current: agentCount, limit: currentPlan.agentLimit },
    tickets: { current: 847, limit: currentPlan.ticketLimit },
    chats: { current: 2340, limit: currentPlan.chatLimit },
    storage: { current: 2.4, limit: currentPlan.id === 'free' ? 1 : currentPlan.id === 'starter' ? 5 : 10 },
  }), [currentPlan, agentCount]);

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

  const confirmPlanChange = () => {
    if (selectedUpgradePlan) {
      const oldPlan = currentPlan;
      setCurrentPlanId(selectedUpgradePlan);
      setChangePlanDialogOpen(false);
      setSelectedUpgradePlan(null);
      const newPlan = plans.find(p => p.id === selectedUpgradePlan)!;
      const isUpgrade = plans.indexOf(newPlan) > plans.indexOf(oldPlan);
      toast.success(`${isUpgrade ? 'Upgraded' : 'Downgraded'} to ${newPlan.name}`, {
        description: isUpgrade
          ? 'Your new plan is now active. Enjoy the additional features!'
          : `Your plan will be downgraded at the end of the current billing period.`,
      });
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
    if (!isPaymentFormValid) return;

    setIsProcessing(true);

    // Simulate Stripe-style processing with delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const last4 = cardNumberClean.slice(-4);
    const expiryClean = cardExpiry.replace(/\s/g, '');
    const [expMonth, expYear] = expiryClean.split('/');

    setSavedCard({
      brand: detectedBrand,
      last4,
      expiry: `${expMonth}/20${expYear}`,
      name: cardName,
    });

    setIsProcessing(false);
    setPaymentMethodDialogOpen(false);
    resetPaymentForm();

    toast.success('Payment method updated', {
      description: `${brandLabels[detectedBrand]} ending in ${last4} has been saved securely.`,
    });
  };

  const handleCancelSubscription = () => {
    setCancelDialogOpen(false);
    toast.success('Subscription cancelled', {
      description: `Your plan will remain active until ${pricing.nextBillingDate}.`,
    });
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
    ? mockInvoices
    : mockInvoices.filter(inv => inv.status.toLowerCase() === invoiceFilter);

  // ─── Render ────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
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
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden md:inline">Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-blue-600 text-white">SC</AvatarFallback>
              </Avatar>
              <span className={`absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                userStatus === 'online' ? 'bg-green-500' :
                userStatus === 'away' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}></span>
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold">Sarah Chen</div>
              <div className="text-xs text-gray-500 capitalize">{role}</div>
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
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl text-gray-900">Billing & Subscription</h1>
                <p className="text-gray-500 mt-1">
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
                    <Zap className="h-5 w-5 text-blue-600" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>Your subscription details and billing</CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {currentPlan.name}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price breakdown */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl text-gray-900">
                        {pricing.isCustom ? 'Custom' : `$${pricing.perUser}`}
                      </span>
                      {!pricing.isCustom && !pricing.isFree && (
                        <span className="text-gray-500">/ user / month</span>
                      )}
                    </div>

                    {!pricing.isCustom && !pricing.isFree && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-sm text-gray-500">
                          {agentCount} agents &times; ${pricing.perUser}/mo
                          {billingCycle === 'annual'
                            ? <> &times; 12 months = <span className="text-gray-900">${typeof pricing.totalPeriod === 'number' ? pricing.totalPeriod.toLocaleString() : pricing.totalPeriod}{pricing.periodLabel}</span></>
                            : <> = <span className="text-gray-900">${pricing.totalPeriod}{pricing.periodLabel}</span></>
                          }
                        </p>
                        {billingCycle === 'annual' && pricing.monthlyEquivalent !== null && (
                          <p className="text-sm text-gray-500">
                            Effective monthly cost: <span className="text-gray-900">${pricing.monthlyEquivalent}/month</span>
                          </p>
                        )}
                        {billingCycle === 'annual' && pricing.savingsAnnual !== null && pricing.savingsAnnual > 0 && (
                          <p className="text-sm text-green-600">
                            You save ${pricing.savingsAnnual.toLocaleString()}/year compared to monthly billing
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-gray-500 mt-1">
                      Next billing date: <span className="text-gray-700">{pricing.nextBillingDate}</span>
                    </p>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="billing-toggle" className="text-sm text-gray-600">Monthly</Label>
                        <Switch
                          id="billing-toggle"
                          checked={billingCycle === 'annual'}
                          onCheckedChange={(checked) => {
                            setBillingCycle(checked ? 'annual' : 'monthly');
                            toast.info(
                              checked ? 'Switched to annual billing' : 'Switched to monthly billing',
                              { description: checked ? 'Save 20% with annual billing.' : 'You will be billed monthly.' }
                            );
                          }}
                        />
                        <Label htmlFor="billing-toggle" className="text-sm text-gray-600">
                          Annual
                          <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 hover:bg-green-100">
                            Save 20%
                          </Badge>
                        </Label>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Feature highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentPlan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
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
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Usage Overview ────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Usage This Period
                </CardTitle>
                <CardDescription>Feb 1 – Feb 28, 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Agents */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        Agents
                      </span>
                      <span className="text-gray-900">
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
                      <span className="flex items-center gap-2 text-gray-600">
                        <Ticket className="h-4 w-4" />
                        Tickets
                      </span>
                      <span className="text-gray-900">
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
                      <span className="flex items-center gap-2 text-gray-600">
                        <MessageCircle className="h-4 w-4" />
                        Chats
                      </span>
                      <span className="text-gray-900">
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
                      <span className="flex items-center gap-2 text-gray-600">
                        <Receipt className="h-4 w-4" />
                        Storage
                      </span>
                      <span className="text-gray-900">
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

            {/* ─── Payment Method + Invoice History ────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment Method */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                    <div className={`h-10 w-14 rounded bg-gradient-to-r ${brandColors[savedCard.brand]} flex items-center justify-center`}>
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{brandLabels[savedCard.brand]} ending in {savedCard.last4}</p>
                      <p className="text-xs text-gray-500">Expires {savedCard.expiry}</p>
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
                    <p className="text-sm text-gray-600">Billing Address</p>
                    <div className="text-sm text-gray-500">
                      <p>{savedCard.name}</p>
                      <p>Acme Corporation</p>
                      <p>123 Business Ave, Suite 400</p>
                      <p>San Francisco, CA 94105</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Billing Email</p>
                    <p className="text-sm text-gray-500">billing@acmecorp.com</p>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice History */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-blue-600" />
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
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="text-gray-900">{invoice.id}</TableCell>
                          <TableCell className="text-gray-500">{invoice.date}</TableCell>
                          <TableCell className="text-gray-900">{invoice.amount}</TableCell>
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
                      ))}
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
              <span className={`text-sm ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
              <Switch
                checked={billingCycle === 'annual'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
              />
              <span className={`text-sm ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
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
                        ? 'border-blue-600 bg-blue-50 shadow-sm'
                        : isCurrentPlan
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (!isCurrentPlan) setSelectedUpgradePlan(plan.id);
                    }}
                  >
                    {plan.popular && !isCurrentPlan && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white hover:bg-blue-600">
                        Popular
                      </Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gray-600 text-white hover:bg-gray-600">
                        Current
                      </Badge>
                    )}
                    <h3 className="text-gray-900 mt-1">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-2xl text-gray-900">
                        {price === -1 ? 'Custom' : `$${price}`}
                      </span>
                      {price !== -1 && price !== 0 && (
                        <span className="text-sm text-gray-500">/mo</span>
                      )}
                    </div>
                    {billingCycle === 'annual' && monthlyPrice > 0 && price !== -1 && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Save ${(monthlyPrice - price) * agentCount * 12}/yr
                      </p>
                    )}
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.slice(0, 4).map((feature) => (
                        <li key={feature} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-xs text-blue-600">
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
                <div className={`p-3 rounded-lg border text-sm ${isUpgrade ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start gap-2">
                    <Info className={`h-4 w-4 mt-0.5 shrink-0 ${isUpgrade ? 'text-blue-600' : 'text-amber-600'}`} />
                    <div>
                      <p className={isUpgrade ? 'text-blue-800' : 'text-amber-800'}>
                        {isUpgrade ? 'Upgrade' : 'Downgrade'} from <span className="font-medium">{currentPlan.name}</span> to <span className="font-medium">{newPlan.name}</span>
                      </p>
                      {newPrice !== -1 && (
                        <p className={`mt-0.5 ${isUpgrade ? 'text-blue-600' : 'text-amber-600'}`}>
                          New cost: ${newPrice * agentCount}{billingCycle === 'annual' ? ` &times; 12 = $${newPrice * agentCount * 12}/year` : '/month'} for {agentCount} agents
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <DialogFooter>
              <Button variant="outline" onClick={() => { setChangePlanDialogOpen(false); setSelectedUpgradePlan(null); }}>
                Cancel
              </Button>
              <Button
                disabled={!selectedUpgradePlan || selectedUpgradePlan === currentPlanId}
                onClick={confirmPlanChange}
              >
                {selectedUpgradePlan && plans.findIndex(p => p.id === selectedUpgradePlan) > plans.findIndex(p => p.id === currentPlanId)
                  ? 'Upgrade Plan'
                  : selectedUpgradePlan && plans.findIndex(p => p.id === selectedUpgradePlan) < plans.findIndex(p => p.id === currentPlanId)
                    ? 'Downgrade Plan'
                    : 'Confirm Change'}
              </Button>
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
                  placeholder="Sarah Chen"
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-blue-700">
                    Your payment is processed securely via Stripe. LinoChat never stores your full card number, CVC, or sensitive card data on our servers.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-blue-500 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> 256-bit SSL
                    </span>
                    <span className="text-[10px] text-blue-500 flex items-center gap-1">
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
              <Button variant="destructive" onClick={handleCancelSubscription}>
                Yes, Cancel
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
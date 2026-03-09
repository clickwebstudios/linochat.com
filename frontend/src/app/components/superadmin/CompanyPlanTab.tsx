import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  plan: string;
  email?: string;
  location?: string;
  joined?: string;
  mrr?: string;
  status?: string;
  usage?: number;
  color?: string;
}

interface CompanyPlanTabProps {
  company: Company;
  editedCompanyName: string;
  companyAgentsCount: number;
  companyProjectsCount: number;
  totalTickets: number;
  defaultMeta: {
    mrr: string;
    usage: number;
  };
  isArchived: boolean;
}

export function CompanyPlanTab({
  company,
  editedCompanyName,
  companyAgentsCount,
  companyProjectsCount,
  totalTickets,
  defaultMeta,
  isArchived,
}: CompanyPlanTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Current Plan</CardTitle>
            <Badge className={company.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : company.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
              {company.plan}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Monthly Recurring Revenue</p>
                <p className="text-xl font-bold">{defaultMeta.mrr}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Billing Cycle</p>
                <p className="text-xl font-bold">Monthly</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Next Billing Date</p>
                <p className="text-xl font-bold">Mar 1, 2026</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                <p className="text-xl font-bold flex items-center gap-1"><CreditCard className="h-4 w-4" /> &bull;&bull;&bull;&bull; 4242</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Plan Features</h4>
              <div className="grid grid-cols-2 gap-2">
                {(company.plan === 'Enterprise'
                  ? ['Unlimited agents', 'AI chatbots', 'Advanced analytics', 'Priority support', 'Unlimited history', 'Custom integrations', 'SLA management', 'White-label options']
                  : company.plan === 'Pro'
                  ? ['Up to 25 agents', 'AI chatbots', 'Advanced analytics', 'Priority support', 'Unlimited history', 'Custom integrations']
                  : ['Up to 5 agents', 'Basic chat widget', '500 tickets/month', 'Email support', '30-day history', 'Basic analytics']
                ).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">Agents</span>
                <span className="text-xs font-semibold">{companyAgentsCount} / {company.plan === 'Enterprise' ? '\u221E' : company.plan === 'Pro' ? '25' : '5'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min((companyAgentsCount / (company.plan === 'Enterprise' ? 100 : company.plan === 'Pro' ? 25 : 5)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">Projects</span>
                <span className="text-xs font-semibold">{companyProjectsCount} / {company.plan === 'Enterprise' ? '\u221E' : company.plan === 'Pro' ? '20' : '3'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min((companyProjectsCount / (company.plan === 'Enterprise' ? 50 : company.plan === 'Pro' ? 20 : 3)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">Tickets This Month</span>
                <span className="text-xs font-semibold">{totalTickets} / {company.plan === 'Enterprise' ? '\u221E' : company.plan === 'Pro' ? '10,000' : '500'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min((totalTickets / (company.plan === 'Enterprise' ? 10000 : company.plan === 'Pro' ? 10000 : 500)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">Storage</span>
                <span className="text-xs font-semibold">{defaultMeta.usage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${defaultMeta.usage > 80 ? 'bg-red-500' : defaultMeta.usage > 60 ? 'bg-orange-500' : 'bg-green-600'}`} style={{ width: `${defaultMeta.usage}%` }} />
              </div>
            </div>
            <div className="pt-2">
              {company.plan !== 'Enterprise' && (
                <Button size="sm" className="w-full bg-blue-600" disabled={isArchived}>
                  <ArrowUpRight className="h-4 w-4 mr-1" />Upgrade Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Adjust Plan */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Adjust Plan</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Change the subscription plan for {editedCompanyName}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Free', price: '$0', period: 'forever', color: 'gray', features: ['1 agent', 'Basic chat widget', '100 tickets/month', 'Email support', '7-day chat history'] },
                { name: 'Starter', price: '$19', period: 'per user/month', color: 'green', features: ['Up to 5 agents', 'Unlimited chats', 'Unlimited tickets', 'Email & chat support', '30-day history', 'Basic analytics'] },
                { name: 'Pro', price: '$49', period: 'per user/month', color: 'blue', popular: true, features: ['Up to 25 agents', 'AI chatbots', 'Advanced analytics', 'Priority support', 'Unlimited history', 'Custom integrations', 'SLA management'] },
                { name: 'Enterprise', price: 'Custom', period: 'contact us', color: 'purple', features: ['Unlimited agents', 'AI chatbots', 'Advanced analytics', 'Dedicated account manager', 'Custom AI training', 'White-label options', 'GDPR compliance', '24/7 phone support'] },
              ].map((plan) => {
                const isCurrent = company.plan === plan.name;
                const borderColor = plan.color === 'gray' ? 'border-gray-300' : plan.color === 'green' ? 'border-green-500' : plan.color === 'blue' ? 'border-blue-500' : 'border-purple-500';
                const badgeBg = plan.color === 'gray' ? 'bg-gray-100 text-gray-700' : plan.color === 'green' ? 'bg-green-100 text-green-700' : plan.color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
                const isDowngrade = (['Free', 'Starter', 'Pro', 'Enterprise'].indexOf(plan.name) < ['Free', 'Starter', 'Pro', 'Enterprise'].indexOf(company.plan));
                return (
                  <div key={plan.name} className={`relative rounded-xl border-2 p-4 transition-all ${isCurrent ? borderColor + ' bg-gray-50/50' : 'border-gray-200 hover:border-gray-300'} ${plan.popular && !isCurrent ? 'ring-1 ring-blue-200' : ''}`}>
                    {plan.popular && !isCurrent && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white text-[10px] px-2">Popular</Badge>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <Badge className={`${badgeBg} text-[10px] px-2`}>Current Plan</Badge>
                      </div>
                    )}
                    <div className="text-center pt-2 pb-3">
                      <h4 className="text-sm font-semibold">{plan.name}</h4>
                      <div className="mt-1.5">
                        <span className="text-2xl font-bold">{plan.price}</span>
                        {plan.period !== 'forever' && plan.period !== 'contact us' && (
                          <span className="text-xs text-gray-500 ml-1">/{plan.period.split('/')[1]}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{plan.period}</p>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-gray-600">{f}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      {isCurrent ? (
                        <Button size="sm" variant="outline" className="w-full text-xs" disabled>Current Plan</Button>
                      ) : isDowngrade ? (
                        <Button size="sm" variant="outline" className="w-full text-xs text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700" disabled={isArchived}>
                          <ArrowDownRight className="h-3.5 w-3.5 mr-1" />Downgrade
                        </Button>
                      ) : (
                        <Button size="sm" className="w-full text-xs bg-blue-600 hover:bg-blue-700" disabled={isArchived}>
                          <ArrowUpRight className="h-3.5 w-3.5 mr-1" />Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 font-semibold">Plan changes take effect immediately</p>
                <p className="text-xs text-amber-700 mt-0.5">Upgrades are prorated. Downgrades apply at the end of the current billing cycle. The company admin will be notified by email.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

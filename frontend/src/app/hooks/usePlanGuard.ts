import { useState, useEffect } from 'react';
import { billingService } from '../services/billing';
import type { Subscription } from '../types';

interface PlanLimits {
  maxProjects?: number;
  maxAgents?: number;
  maxArticles?: number;
  aiReplies?: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free:       { maxProjects: 1, maxAgents: 1,  maxArticles: 10,  aiReplies: false },
  starter:    { maxProjects: 3, maxAgents: 5,  maxArticles: 50,  aiReplies: true  },
  pro:        { maxProjects: 10, maxAgents: 20, maxArticles: 200, aiReplies: true  },
  enterprise: { maxProjects: Infinity, maxAgents: Infinity, maxArticles: Infinity, aiReplies: true },
};

export interface PlanGuardResult {
  subscription: Subscription | null;
  limits: PlanLimits;
  planName: string;
  isLoading: boolean;
  /** Returns true when the feature/count is within the plan limit */
  isAllowed: (feature: keyof PlanLimits, currentCount?: number) => boolean;
  /** Returns the limit value for a given feature */
  getLimit: (feature: keyof PlanLimits) => number | boolean | undefined;
}

export function usePlanGuard(): PlanGuardResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    billingService
      .getSubscription()
      .then(setSubscription)
      .catch(() => setSubscription(null))
      .finally(() => setIsLoading(false));
  }, []);

  const planName = subscription?.plan?.name?.toLowerCase() ?? 'free';
  const limits: PlanLimits = PLAN_LIMITS[planName] ?? PLAN_LIMITS.free;

  const isAllowed = (feature: keyof PlanLimits, currentCount?: number): boolean => {
    const limit = limits[feature];
    if (limit === undefined) return true;
    if (typeof limit === 'boolean') return limit;
    if (currentCount !== undefined) return currentCount < (limit as number);
    return true;
  };

  const getLimit = (feature: keyof PlanLimits) => limits[feature];

  return { subscription, limits, planName, isLoading, isAllowed, getLimit };
}

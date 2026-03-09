import { renderHook, waitFor } from '@testing-library/react';
import { usePlanGuard } from '../../app/hooks/usePlanGuard';
import { billingService } from '../../app/services/billing';

vi.mock('../../app/services/billing');

const mockBillingService = billingService as jest.Mocked<typeof billingService>;

describe('usePlanGuard', () => {
  afterEach(() => vi.clearAllMocks());

  it('defaults to free plan limits when subscription fetch fails', async () => {
    mockBillingService.getSubscription.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => usePlanGuard());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.planName).toBe('free');
    expect(result.current.getLimit('maxProjects')).toBe(1);
  });

  it('applies correct limits for starter plan', async () => {
    mockBillingService.getSubscription.mockResolvedValue({
      id: 1,
      company_id: 1,
      plan_id: 2,
      billing_cycle: 'monthly',
      status: 'active',
      plan: { id: 2, name: 'Starter', price_monthly: 29, price_annual: 290, features: [] },
    });
    const { result } = renderHook(() => usePlanGuard());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.planName).toBe('starter');
    expect(result.current.isAllowed('maxProjects', 2)).toBe(true);
    expect(result.current.isAllowed('maxProjects', 3)).toBe(false);
    expect(result.current.isAllowed('aiReplies')).toBe(true);
  });

  it('enterprise plan allows everything', async () => {
    mockBillingService.getSubscription.mockResolvedValue({
      id: 1,
      company_id: 1,
      plan_id: 4,
      billing_cycle: 'annual',
      status: 'active',
      plan: { id: 4, name: 'Enterprise', price_monthly: 0, price_annual: 0, features: [] },
    });
    const { result } = renderHook(() => usePlanGuard());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAllowed('maxProjects', 999)).toBe(true);
    expect(result.current.isAllowed('aiReplies')).toBe(true);
  });
});

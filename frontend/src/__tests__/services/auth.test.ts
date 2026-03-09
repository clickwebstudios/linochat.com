/**
 * Auth service smoke tests — verifies the service methods call the right
 * endpoints without hitting a real backend.
 */
import { authService } from '../../app/services/auth';
import api from '../../app/lib/api';

vi.mock('../../app/lib/api');
const mockApi = api as jest.Mocked<typeof api>;

describe('authService', () => {
  afterEach(() => vi.clearAllMocks());

  it('login calls POST /api/auth/login with credentials', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: { access_token: 'tok', user: { id: 1, email: 'a@b.com', role: 'admin' } },
      },
    };
    (mockApi.post as any).mockResolvedValue(mockResponse);
    const result = await authService.login('a@b.com', 'secret');
    expect(mockApi.post).toHaveBeenCalledWith('/api/auth/login', { email: 'a@b.com', password: 'secret', remember: false });
    expect(result.access_token).toBe('tok');
  });

  it('logout calls POST /api/auth/logout', async () => {
    (mockApi.post as any).mockResolvedValue({ data: { success: true } });
    await authService.logout();
    expect(mockApi.post).toHaveBeenCalledWith('/api/auth/logout');
  });
});

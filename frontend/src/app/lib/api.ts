import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  timeout: 8000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Fetch CSRF cookie once before the first mutating request
let csrfReady = false;
async function ensureCsrf() {
  if (!csrfReady) {
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
        withCredentials: true,
        timeout: 5000,
      });
    } catch {
      // Backend unreachable — continue without CSRF token so the actual
      // request can fail with a meaningful network error instead of hanging.
    }
    csrfReady = true;
  }
}

api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method ?? '')) {
    await ensureCsrf();
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if the user is on a protected page.
      // Don't redirect from public pages (login, signup, forgot-password, etc.)
      // or from the /me probe that just checks session status.
      const publicPaths = ['/login', '/signup', '/forgot-password', '/', '/features', '/pricing', '/resources', '/about', '/contact', '/help'];
      const isPublic = publicPaths.some(
        (p) => window.location.pathname === p || window.location.pathname.startsWith('/help')
      );
      const isMeCheck = (error.config?.url ?? '').includes('/auth/me');
      if (!isPublic && !isMeCheck) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

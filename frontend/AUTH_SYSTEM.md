# LinoChat Authentication System

## Overview
Complete authentication system for LinoChat frontend using React + TypeScript + Vite + Tailwind CSS + Zustand.

## File Structure

```
/Users/alexandrdomashev/Sites/linochat.com/frontend/src/
├── api/
│   ├── client.ts          # HTTP client with JWT handling
│   └── auth.ts            # Authentication API endpoints
├── stores/
│   └── authStore.ts       # Zustand auth state management
├── types/
│   └── index.ts           # TypeScript type definitions
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx    # Route protection components
│   └── layout/
│       ├── Header.tsx     # Header with user info
│       └── Layout.tsx     # Main layout wrapper
└── pages/
    └── auth/
        ├── LoginPage.tsx   # Login form with validation
        └── RegisterPage.tsx # Registration with AI analysis feedback
```

## Features Implemented

### 1. API Client (`src/api/client.ts`)
- JWT token management (store, retrieve, clear)
- Automatic token expiration checking
- HTTP methods: GET, POST, PUT, PATCH, DELETE
- Automatic Authorization header injection
- Error handling with automatic logout on 401

### 2. Auth API (`src/api/auth.ts`)
- `login(credentials)` - Authenticate user
- `register(credentials)` - Create account with website analysis
- `getCurrentUser()` - Fetch current user
- `logout()` - Sign out user
- `refreshToken()` - Refresh access token

### 3. Zustand Store (`src/stores/authStore.ts`)
- User state management
- Authentication status tracking
- Registration data (project, analysis, KB articles)
- Loading states for async operations
- Error handling with field-level errors
- Persisted storage for user data
- Selectors for optimized re-renders

### 4. Type Definitions (`src/types/index.ts`)
- User, Project, WebsiteAnalysis interfaces
- Auth request/response types
- API error handling types
- Form validation types

### 5. ProtectedRoute Component (`src/components/auth/ProtectedRoute.tsx`)
- `ProtectedRoute` - Redirects to login if not authenticated
- `PublicRoute` - Redirects to dashboard if already authenticated
- Loading states during initialization

### 6. LoginPage (`src/pages/auth/LoginPage.tsx`)
- Form validation with Zod + react-hook-form
- Email/password with show/hide toggle
- Loading states
- Error display (global + field-level)
- Link to registration
- Responsive design

### 7. RegisterPage (`src/pages/auth/RegisterPage.tsx`)
- Full registration form with validation
- AI website analysis feedback display:
  - Real-time progress indicator
  - Status updates (pending/processing/completed/failed)
  - Pages crawled counter
  - KB articles count
- Success state with redirect
- Responsive design

### 8. Header Component (`src/components/layout/Header.tsx`)
- Logo and navigation
- User avatar with initials
- Dropdown menu with profile/settings/logout
- Responsive mobile navigation

### 9. Layout Component (`src/components/layout/Layout.tsx`)
- Wrapper for authenticated pages
- Consistent spacing and background

### 10. Router Integration (`src/app/App.tsx`)
- `/login` - Login page (public)
- `/register` - Registration page (public)
- `/dashboard` - Protected dashboard
- Auth state initialization on app load
- Legacy route compatibility

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Authenticate user |
| POST | /auth/register | Create account + start analysis |
| GET | /auth/me | Get current user |
| POST | /auth/logout | Sign out |
| POST | /auth/refresh | Refresh access token |

## Environment Variables

```bash
VITE_API_URL=http://localhost:8000/api/v1
```

## Usage Examples

### Login
```tsx
import { useAuthStore } from '@/stores/authStore';

function MyComponent() {
  const login = useAuthStore((state) => state.login);
  
  const handleLogin = async () => {
    await login('user@example.com', 'password');
  };
}
```

### Protected Route
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### Access User Data
```tsx
import { useAuthStore, selectUser } from '@/stores/authStore';

function Profile() {
  const user = useAuthStore(selectUser);
  return <div>Hello {user?.name}</div>;
}
```

## Dependencies Added
- `zustand` - State management
- `zod` - Schema validation
- `@hookform/resolvers` - Form validation resolver

## Build Status
✅ Production build successful
✅ TypeScript compilation clean
✅ All imports resolved

## Notes
- The existing auth pages (`/src/app/pages/auth/*`) are kept for backward compatibility
- New auth pages are at `/src/pages/auth/*`
- Store uses `@/` path alias which maps to `./src`

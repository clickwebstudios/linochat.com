# Frontend Tests

This directory contains tests for the LinoChat frontend application.

## Setup

Install Vitest and testing utilities:

```bash
cd /Users/alexandrdomashev/Sites/linochat.com/frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Test Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/__tests__/stores/authStore.test.ts
```

## Test Structure

```
src/__tests__/
├── stores/
│   └── authStore.test.ts      # Auth state management tests
├── api/
│   └── integration.test.ts    # API integration tests
└── components/
    └── ProjectsView.test.tsx  # Component rendering tests
```

## Common Issues Tested

### 1. API Authentication
- ✅ Token passed in Authorization header
- ✅ 401 errors handled correctly
- ✅ Token refresh flow

### 2. Paginated Responses
- ✅ Projects endpoint returns paginated data
- ✅ Frontend extracts `data.data` correctly

### 3. Data Type Conversions
- ✅ `is_published` is boolean (not integer)
- ✅ Date formats are ISO strings

### 4. Empty States
- ✅ No projects shows empty message
- ✅ No KB articles shows "No Knowledge Base Yet"
- ✅ Missing token handled gracefully

### 5. Loading States
- ✅ Spinner shown while loading
- ✅ Error states handled

## Writing New Tests

Example test for new component:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('MyComponent', () => {
  it('should render with real data', () => {
    const mockData = { name: 'Test' };
    render(<MyComponent data={mockData} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Mocking Fetch

```typescript
// Setup mock
(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ success: true, data: [] }),
});

// Verify call
expect(fetch).toHaveBeenCalledWith('/api/endpoint', {
  headers: {
    'Authorization': 'Bearer test-token',
  },
});
```

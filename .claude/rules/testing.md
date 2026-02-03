---
paths:
  - tests/**
  - src/**/__tests__/**
  - jest.config.js
---

# Testing Domain

## Jest Configuration

**Location:** `jest.config.js`

Two test environments configured:

### Node Environment (Services & Backend)

- **Tests:** `tests/**/*.test.ts`, `src/services/__tests__/**`
- **Use for:** Services, utilities, API logic

### JSDOM Environment (React & Hooks)

- **Tests:** `src/hooks/__tests__/**`, `src/components/__tests__/**`
- **Use for:** React components, custom hooks
- **Setup:** React Testing Library

## Test File Locations

```
tests/
├── api/
│   └── full-app-stream.test.ts  # SSE streaming tests (legacy, references old endpoint)
├── setup.ts                   # Common setup
├── setup-react.ts             # React-specific setup
└── __mocks__/                 # Dependency mocks
    ├── js-tiktoken.ts
    ├── tree-sitter.ts
    └── tree-sitter-typescript.ts
```

## Test Commands

```bash
# Run all tests
npm test

# Specific test suites
npm run test:hooks          # Hook tests (JSDOM)
npm run test:services       # Service tests (Node)
npm run test:unit           # All unit tests
npm run test:integration    # Integration tests

# Development
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

## Mock Patterns

### Mocking External Dependencies

```typescript
// tests/__mocks__/js-tiktoken.ts
module.exports = {
  getEncoding: jest.fn(() => ({
    encode: jest.fn((text) => text.split('')),
    decode: jest.fn((tokens) => tokens.join('')),
  })),
};
```

### Mocking Zustand Store

```typescript
import { useAppStore } from '@/store/useAppStore';

jest.mock('@/store/useAppStore');

const mockStore = useAppStore as jest.MockedFunction<typeof useAppStore>;
mockStore.mockReturnValue({
  messages: [],
  addMessage: jest.fn(),
  // ... mock state and methods
});
```

### Mocking API Routes

```typescript
// Mock fetch for API tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
) as jest.Mock;
```

## Hook Testing Pattern

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.data).toBeNull();
  });

  it('should update state on action', async () => {
    const { result } = renderHook(() => useMyHook());

    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.data).toBeDefined();
  });
});
```

## Service Testing Pattern

```typescript
import { MyService } from '../MyService';

describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process data correctly', async () => {
    const result = await MyService.process({ input: 'test' });
    expect(result.output).toBe('expected');
  });
});
```

## Coverage Requirements

- Aim for 70%+ coverage on critical services
- All hooks should have basic tests
- Integration tests for API routes

## Critical Test Files

| File                          | Tests                                          |
| ----------------------------- | ---------------------------------------------- |
| `full-app-stream.test.ts`    | SSE streaming patterns (legacy, needs updating) |


import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { OrderProvider } from '@/contexts/OrderContext';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  },
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

type CustomRenderOptions = {
  routePath?: string;
} & Omit<RenderOptions, 'wrapper'>;

function customRender(
  ui: ReactElement,
  { routePath = '/', ...renderOptions }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[routePath]}>
        <OrderProvider>{children}</OrderProvider>
      </MemoryRouter>
    ),
    ...renderOptions,
  });
}

export * from '@testing-library/react';
export { customRender as render };

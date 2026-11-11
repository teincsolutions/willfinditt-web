'use client';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';

let browserQueryClient: QueryClient | undefined;

/**
 * One QueryClient in the browser (as before), but a new one for every
 * server render, so cached data from one visitor's request is never shown
 * to another. TanStack Query's recommended setup for the App Router.
 */
function getQueryClient() {
  if (isServer) return new QueryClient();
  browserQueryClient ??= new QueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>{children}</LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

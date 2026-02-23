'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error-boundary';

// Android back button handler component
function BackButtonHandler() {
  const router = useRouter();

  useEffect(() => {
    // Only run on client and in Capacitor environment
    if (typeof window === 'undefined') return;

    let cleanup: (() => void) | undefined;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');

        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // On home page, minimize the app instead of closing
            App.minimizeApp();
          }
        });

        cleanup = () => {
          listener.remove();
        };
      } catch (error) {
        // Not running in Capacitor environment, ignore
        console.log('Not running in Capacitor environment');
      }
    };

    setupBackButton();

    return () => {
      if (cleanup) cleanup();
    };
  }, [router]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BackButtonHandler />
        {children}
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

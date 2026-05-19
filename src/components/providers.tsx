'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink }                   from '@trpc/client';
import superjson                           from 'superjson';
import { trpc }                            from '@/lib/trpc/client';
import { ClerkProvider }                   from '@clerk/nextjs';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc]  = useState(() => new QueryClient());
  const [tc]  = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
      })],
    })
  );
  return (
    <ClerkProvider>
      <trpc.Provider client={tc} queryClient={qc}>
        <QueryClientProvider client={qc}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    </ClerkProvider>
  );
}
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter }           from '@/server/trpc/routers';
import { createTRPCContext }   from '@/server/trpc/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ error }) => {
      if (error.code === 'INTERNAL_SERVER_ERROR')
        console.error('tRPC error:', error);
    },
  });

export { handler as GET, handler as POST };
import { initTRPC, TRPCError } from '@trpc/server';
import { auth }               from '@clerk/nextjs/server';
import superjson               from 'superjson';
import { db }                  from '@/server/db';
import { eq }                  from 'drizzle-orm';
import { users }               from '@/server/db/schema';

export const createTRPCContext = async () => {
  const { userId: clerkId } = await auth();
  let user = null;
  if (clerkId) {
    user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });
  }
  return { db, clerkId, user };
};

const t = initTRPC
  .context<typeof createTRPCContext>()
  .create({ transformer: superjson });

export const router        = t.router;
export const publicProc    = t.procedure;
export const protectedProc = t.procedure.use(({ ctx, next }) => {
  if (!ctx.clerkId || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user, clerkId: ctx.clerkId } });
});
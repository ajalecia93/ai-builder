import { router, protectedProc } from '../trpc';

export const billingRouter = router({
  getCredits: protectedProc.query(({ ctx }) => ({
    credits: ctx.user.credits,
    plan:    ctx.user.plan,
  })),
});
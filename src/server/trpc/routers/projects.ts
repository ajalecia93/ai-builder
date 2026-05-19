import { z }                  from 'zod';
import { router, protectedProc } from '../trpc';
import { projects, messages, fragments } from '@/server/db/schema';
import { eq, desc, and }      from 'drizzle-orm';
import { TRPCError }          from '@trpc/server';

export const projectsRouter = router({
  list: protectedProc.query(async ({ ctx }) => {
    return ctx.db.query.projects.findMany({
      where: eq(projects.userId, ctx.user.id),
      orderBy: [desc(projects.updatedAt)],
      limit: 20,
    });
  }),

  getById: protectedProc
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)),
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      return project;
    }),

  getWithContent: protectedProc
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)),
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      const msgs = await ctx.db.query.messages.findMany({
        where: eq(messages.projectId, input.id),
        orderBy: [desc(messages.createdAt)],
      });
      const latestFragment = await ctx.db.query.fragments.findFirst({
        where: eq(fragments.projectId, input.id),
        orderBy: [desc(fragments.createdAt)],
      });
      return { ...project, messages: msgs.reverse(), fragment: latestFragment };
    }),

  create: protectedProc
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const [project] = await ctx.db.insert(projects).values({
        userId: ctx.user.id,
        name:   input.name,
      }).returning();
      return project;
    }),

  rename: protectedProc
    .input(z.object({ id: z.string(), name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(projects)
        .set({ name: input.name, updatedAt: new Date() })
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));
    }),

  delete: protectedProc
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(projects)
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));
    }),
});
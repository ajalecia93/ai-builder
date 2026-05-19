import { z }                     from 'zod';
import { router, protectedProc } from '../trpc';
import { messages, projects, users } from '@/server/db/schema';
import { eq, and }               from 'drizzle-orm';
import { TRPCError }             from '@trpc/server';
import { inngest }               from '@/server/inngest/client';

export const messagesRouter = router({
  send: protectedProc
    .input(z.object({
      projectId: z.string(),
      content:   z.string().min(1).max(4000),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify project belongs to user
      const project = await ctx.db.query.projects.findFirst({
        where: and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)),
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      // Check credits
      if (ctx.user.credits < 1) {
        throw new TRPCError({
          code:    'FORBIDDEN',
          message: 'NO_CREDITS',
        });
      }

      // Deduct credit
      await ctx.db.update(users)
        .set({ credits: ctx.user.credits - 1 })
        .where(eq(users.id, ctx.user.id));

      // Save user message
      const [message] = await ctx.db.insert(messages).values({
        projectId: input.projectId,
        role:      'user',
        content:   input.content,
      }).returning();

      // Set project to building
      await ctx.db.update(projects)
        .set({ status: 'building', updatedAt: new Date() })
        .where(eq(projects.id, input.projectId));

      // Fire background AI job
      await inngest.send({
        name: 'ai/generate.website',
        data: {
          projectId: input.projectId,
          messageId: message.id,
          userId:    ctx.user.id,
          prompt:    input.content,
        },
      });

      return { messageId: message.id };
    }),
});
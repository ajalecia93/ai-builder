import { inngest }        from './client';
import { db }             from '@/server/db';
import { projects }       from '@/server/db/schema';
import { eq }             from 'drizzle-orm';
import { runAgentLoop }   from '@/server/agents/generate';
import { createSandbox }  from '@/server/agents/sandbox';

export const generateWebsite = inngest.createFunction(
  { id: 'generate-website', retries: 2 },
  { event: 'ai/generate.website' },
  async ({ event }: { event: { data: { projectId: string; messageId: string; userId: string; prompt: string } } }) => {
    const { projectId, messageId, userId, prompt } = event.data;

    try {
      const sandbox = await createSandbox();

      const result = await runAgentLoop({
        sandbox, prompt, projectId, messageId, userId
      });

      await db.update(projects)
        .set({ status: 'ready', previewUrl: result.previewUrl, updatedAt: new Date() })
        .where(eq(projects.id, projectId));

      return { success: true, previewUrl: result.previewUrl };
    } catch (err) {
      // Surface the failure instead of leaving the project stuck in "building".
      await db.update(projects)
        .set({ status: 'error', updatedAt: new Date() })
        .where(eq(projects.id, projectId));
      throw err;
    }
  }
);
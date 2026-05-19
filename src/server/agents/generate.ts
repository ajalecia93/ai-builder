import Anthropic from '@anthropic-ai/sdk';
import { db }         from '@/server/db';
import { messages, fragments } from '@/server/db/schema';
import { eq, asc }   from 'drizzle-orm';
import { agentTools } from './tools';
import {
  writeFileInSandbox,
  runCommandInSandbox,
  readFileInSandbox,
  getPreviewUrl,
} from './sandbox';
import type { Sandbox } from '@e2b/code-interpreter';

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an expert full-stack web developer.
Generate complete, production-ready React applications with Tailwind CSS.
Always write complete files — never truncate or use placeholders.
File rules:
- Use React functional components with TypeScript
- Use Tailwind CSS for all styling
- Entry point must be src/App.tsx which exports a default component
- Include a package.json with react, react-dom, vite, @vitejs/plugin-react
- Include vite.config.ts and index.html
After writing all files, run: npm install && npm run dev -- --port 3000 --host 0.0.0.0
When the server starts, you are done.`;

export async function runAgentLoop({
  sandbox, prompt, projectId, messageId, userId
}: {
  sandbox: Sandbox; prompt: string; projectId: string;
  messageId: string; userId: string;
}) {
  // Load message history for context
  const history = await db.query.messages.findMany({
    where: eq(messages.projectId, projectId),
    orderBy: [asc(messages.createdAt)],
  });

  const msgHistory: Anthropic.MessageParam[] = history.map(m => ({
    role:    m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const writtenFiles: { path: string; content: string }[] = [];
  let continueLoop = true;
  let previewUrl    = '';

  while (continueLoop) {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system:     SYSTEM_PROMPT,
      tools:      agentTools,
      messages:   msgHistory,
    });

    msgHistory.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      continueLoop = false;
    } else if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        let result: unknown;

        try {
          if (block.name === 'write_file') {
            const { path, content } = block.input as { path: string; content: string };
            await writeFileInSandbox(sandbox, path, content);
            writtenFiles.push({ path, content });
            result = { success: true, path };
          } else if (block.name === 'run_terminal') {
            const { command } = block.input as { command: string };
            result = await runCommandInSandbox(sandbox, command);
            // Check if dev server started
            if (command.includes('dev') || command.includes('start')) {
              previewUrl = await getPreviewUrl(sandbox, 3000);
            }
          } else if (block.name === 'read_file') {
            const { path } = block.input as { path: string };
            result = await readFileInSandbox(sandbox, path);
          }
        } catch (e) {
          result = { error: String(e) };
        }

        toolResults.push({
          type:        'tool_result',
          tool_use_id: block.id,
          content:     JSON.stringify(result),
        });
      }

      msgHistory.push({ role: 'user', content: toolResults });
    }
  }

  // Get the assistant's final text response
  const finalMsg = msgHistory.findLast(m => m.role === 'assistant');
  const assistantText = typeof finalMsg?.content === 'string'
    ? finalMsg.content
    : (finalMsg?.content as Anthropic.ContentBlock[])?.find(b => b.type === 'text')?.text ?? '';

  // Save assistant reply + fragment to DB
  const [assistantMessage] = await db.insert(messages).values({
    projectId,
    role:    'assistant',
    content: assistantText,
  }).returning();

  if (writtenFiles.length > 0) {
    await db.insert(fragments).values({
      projectId,
      messageId: assistantMessage.id,
      sandboxId: sandbox.sandboxId,
      files:     writtenFiles,
      previewUrl,
    });
  }

  return { previewUrl, filesWritten: writtenFiles.length };
}
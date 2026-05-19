import type { Anthropic } from '@anthropic-ai/sdk';

export const agentTools: Anthropic.Tool[] = [
  {
    name: 'write_file',
    description: 'Write or overwrite a file in the project. Always use this to create React components, CSS, config files.',
    input_schema: {
      type: 'object',
      properties: {
        path:    { type: 'string', description: 'File path relative to project root (e.g. src/App.tsx)' },
        content: { type: 'string', description: 'Complete file contents' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'run_terminal',
    description: 'Run a shell command. Use for npm install, building, starting dev servers.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
      },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the current contents of a file.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
  },
];
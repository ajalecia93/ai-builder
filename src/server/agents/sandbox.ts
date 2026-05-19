import { Sandbox } from '@e2b/code-interpreter';

export async function createSandbox() {
  return await Sandbox.create({
    template:  'base',
    timeoutMs: 5 * 60 * 1000,
    apiKey:    process.env.E2B_API_KEY!,
  });
}

export async function writeFileInSandbox(
  sandbox: Sandbox, path: string, content: string
) {
  await sandbox.files.write(path, content);
  return { success: true, path };
}

export async function readFileInSandbox(sandbox: Sandbox, path: string) {
  const content = await sandbox.files.read(path);
  return { content };
}

export async function runCommandInSandbox(sandbox: Sandbox, cmd: string) {
  const result = await sandbox.commands.run(cmd, {
    timeoutMs: 120_000,
    background: cmd.includes('dev') || cmd.includes('start'),
  });
  return {
    stdout:   result.stdout   ?? '',
    stderr:   result.stderr   ?? '',
    exitCode: result.exitCode ?? 0,
  };
}

export async function getPreviewUrl(sandbox: Sandbox, port = 3000) {
  return `https://${sandbox.getHost(port)}`;
}
'use client';
import { useState }       from 'react';
import { useRouter }      from 'next/navigation';
import { trpc }           from '@/lib/trpc/client';
import Link               from 'next/link';
import { UserButton }     from '@clerk/nextjs';

const EXAMPLES = [
  'Build a SaaS landing page with pricing table',
  'Create a portfolio website for a designer',
  'Make a restaurant menu with online ordering',
  'Build a blog with dark mode support',
];

export default function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const router              = useRouter();
  const utils               = trpc.useUtils();
  const { data: projects }  = trpc.projects.list.useQuery();
  const { data: billing }   = trpc.billing.getCredits.useQuery();

  const createProject = trpc.projects.create.useMutation({
    onSuccess: (p) => router.push(`/project/${p.id}`),
  });

  const sendMsg = trpc.messages.send.useMutation({
    onSuccess: () => utils.projects.list.invalidate(),
  });

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    const name = prompt.slice(0, 60) + (prompt.length > 60 ? '...' : '');
    const project = await createProject.mutateAsync({ name });
    await sendMsg.mutateAsync({ projectId: project.id, content: prompt });
    router.push(`/project/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-6 h-14 flex items-center justify-between">
        <span className="font-bold text-violet-400">AI Builder</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">
            {billing?.credits ?? '—'} credits
          </span>
          <UserButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-center mb-3">
          What do you want to build?
        </h1>
        <p className="text-neutral-400 text-center mb-10">
          Describe your website and AI will generate it instantly.
        </p>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            placeholder="Build a landing page for a coffee shop with menu and contact form..."
            className="w-full bg-transparent text-white text-sm resize-none focus:outline-none
              placeholder-neutral-600 min-h-25"
          />
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
            <span className="text-xs text-neutral-600">⌘ + Enter to generate</span>
            <button onClick={handleSubmit}
              disabled={!prompt.trim() || createProject.isPending}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white
                px-5 py-2 rounded-xl text-sm font-medium transition-colors">
              Generate →
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => setPrompt(ex)}
              className="text-xs text-neutral-500 hover:text-white bg-neutral-900
                border border-neutral-800 px-3 py-1.5 rounded-full transition-colors">
              {ex}
            </button>
          ))}
        </div>

        {projects && projects.length > 0 && (
          <div className="mt-16">
            <h2 className="text-sm font-medium text-neutral-400 mb-4">Recent Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map(p => (
                <Link key={p.id} href={`/project/${p.id}`}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4
                    hover:border-violet-700 transition-colors">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{p.status}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
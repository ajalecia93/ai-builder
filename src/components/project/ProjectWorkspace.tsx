'use client';
import { useState }        from 'react';
import { trpc }            from '@/lib/trpc/client';
import { MessageList }     from '@/components/chat/MessageList';
import { MessageInput }    from '@/components/chat/MessageInput';
import { FragmentView }    from './FragmentView';
import { CodeView }        from './CodeView';
import Link                from 'next/link';

const STATUS_STYLES: Record<string, string> = {
  idle:     'bg-neutral-700 text-neutral-300',
  building: 'bg-amber-500/20 text-amber-400 animate-pulse',
  ready:    'bg-emerald-500/20 text-emerald-400',
  error:    'bg-red-500/20 text-red-400',
};

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const { data: project } = trpc.projects.getWithContent.useQuery(
    { id: projectId },
    { refetchInterval: (q) => q.state.data?.status === 'building' ? 2000 : false }
  );

  if (!project) return (
    <div className="h-screen flex items-center justify-center bg-neutral-950 text-neutral-500">
      Loading project...
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-neutral-950">
      <header className="h-12 border-b border-neutral-800 flex items-center px-4 gap-3 flex-shrink-0">
        <Link href="/" className="text-neutral-500 hover:text-white text-sm transition-colors">← Home</Link>
        <span className="text-neutral-600">/</span>
        <span className="text-white text-sm font-medium truncate flex-1">{project.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[project.status] ?? STATUS_STYLES.idle}`}>
          {project.status}
        </span>
        <div className="flex gap-1 ml-2">
          {['preview', 'code'].map(t => (
            <button key={t} onClick={() => setTab(t as typeof tab)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors
                ${tab === t ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-white'}`}>
              {t === 'preview' ? 'Preview' : 'Code'}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 flex-shrink-0 border-r border-neutral-800 flex flex-col">
          <MessageList projectId={projectId} />
          <MessageInput projectId={projectId} />
        </div>
        {tab === 'preview' ? (
          <FragmentView
            previewUrl={project.fragment?.previewUrl ?? project.previewUrl ?? undefined}
            isBuilding={project.status === 'building'} />
        ) : project.fragment ? (
          <CodeView fragment={project.fragment} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
            No code generated yet
          </div>
        )}
      </div>
    </div>
  );
}
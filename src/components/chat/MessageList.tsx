'use client';
import { useEffect, useRef } from 'react';
import { trpc }              from '@/lib/trpc/client';

export function MessageList({ projectId }: { projectId: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: project } = trpc.projects.getWithContent.useQuery(
    { id: projectId },
    { refetchInterval: (q) => q.state.data?.status === 'building' ? 2000 : false }
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project?.messages?.length]);

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
      {project?.messages.map(msg => (
        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
            ${msg.role === 'user'
              ? 'bg-violet-600 text-white rounded-br-sm'
              : 'bg-neutral-800 text-neutral-200 rounded-bl-sm'}`}>
            {msg.content}
          </div>
        </div>
      ))}

      {/* Typing indicator while building */}
      {project?.status === 'building' && (
        <div className="flex justify-start">
          <div className="bg-neutral-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

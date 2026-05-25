'use client';
import { useState } from 'react';
import { trpc }     from '@/lib/trpc/client';

export function MessageInput({ projectId }: { projectId: string }) {
  const [text, setText]   = useState('');
  const [error, setError] = useState('');
  const utils = trpc.useUtils();

  const { mutate, isPending } = trpc.messages.send.useMutation({
    onSuccess: () => {
      setText('');
      setError('');
      utils.projects.getWithContent.invalidate({ id: projectId });
    },
    onError: (e) => {
      setError(e.message === 'NO_CREDITS' ? "You're out of credits." : e.message);
    },
  });

  const send = () => {
    if (!text.trim() || isPending) return;
    setError('');
    mutate({ projectId, content: text.trim() });
  };

  return (
    <div className="border-t border-neutral-800 p-3 flex flex-col gap-2 shrink-0">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
        placeholder="Describe a change... (⌘+Enter to send)"
        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2
          text-sm text-white placeholder-neutral-500 resize-none focus:outline-none
          focus:border-violet-500 min-h-11 max-h-30"
        rows={1}
        disabled={isPending}
      />
      <button
        onClick={send}
        disabled={isPending || !text.trim()}
        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white
          px-4 rounded-xl text-sm font-medium transition-colors self-end py-2"
      >
        {isPending ? '...' : 'Send'}
      </button>
      </div>
    </div>
  );
}

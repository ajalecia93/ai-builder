'use client';
import { useState }      from 'react';
import Editor            from '@monaco-editor/react';
import type { Fragment } from '@/server/db/schema';

export function CodeView({ fragment }: { fragment: Fragment }) {
  const files  = fragment.files as { path: string; content: string }[];
  const [active, setActive] = useState(files[0]?.path ?? '');
  const current = files.find(f => f.path === active);
  const getLang = (p: string) =>
    p.endsWith('.tsx') || p.endsWith('.ts') ? 'typescript'
    : p.endsWith('.css') ? 'css'
    : p.endsWith('.json') ? 'json'
    : p.endsWith('.html') ? 'html' : 'plaintext';

  return (
    <div className="flex-1 flex overflow-hidden">
      <aside className="w-52 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 overflow-y-auto">
        {files.map(f => (
          <button key={f.path} onClick={() => setActive(f.path)}
            className={`w-full text-left px-3 py-2 text-xs truncate transition-colors
              ${active === f.path ? 'bg-violet-600/20 text-violet-300' : 'text-neutral-400 hover:text-white'}`}>
            {f.path}
          </button>
        ))}
      </aside>
      <div className="flex-1">
        <Editor height="100%" theme="vs-dark"
          language={getLang(active)} value={current?.content ?? ''}
          options={{ readOnly: true, fontSize: 13, minimap: { enabled: false } }} />
      </div>
    </div>
  );
}
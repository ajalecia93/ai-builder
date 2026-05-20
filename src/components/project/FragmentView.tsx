'use client';
import { useState } from 'react';

const VIEWPORTS = {
  desktop: { w: '100%',  icon: '🖥' },
  tablet:  { w: '768px', icon: '📱' },
  mobile:  { w: '390px', icon: '📲' },
} as const;

export function FragmentView({ previewUrl, isBuilding }: {
  previewUrl?: string; isBuilding: boolean
}) {
  const [vp, setVp] = useState<keyof typeof VIEWPORTS>('desktop');
  if (!previewUrl) return (
    <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-500 text-sm">
      {isBuilding ? '🔨 Building your website...' : 'Send a prompt to generate your website'}
    </div>
  );
  return (
    <div className="flex-1 flex flex-col bg-neutral-950">
      <div className="border-b border-neutral-800 px-4 py-2 flex items-center gap-2">
        {(Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]).map(key => (
          <button key={key} onClick={() => setVp(key)}
            className={`text-sm px-3 py-1 rounded-lg transition-colors
              ${vp === key ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-white'}`}>
            {VIEWPORTS[key].icon} {key}
          </button>
        ))}
        <a href={previewUrl} target="_blank" rel="noreferrer"
          className="ml-auto text-xs text-neutral-500 hover:text-white transition-colors">
          Open ↗
        </a>
      </div>
      <div className="flex-1 flex justify-center overflow-auto p-4">
        <iframe src={previewUrl} style={{ width: VIEWPORTS[vp].w }}
          className="h-full rounded-lg border border-neutral-800"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="Preview" />
      </div>
    </div>
  );
}
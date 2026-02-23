// client/src/components/chat/EmojiButton.jsx

import { useState, lazy, Suspense } from 'react';
import { Smile } from 'lucide-react';

const Picker = lazy(() => import('@emoji-mart/react'));
import data from '@emoji-mart/data';

export function EmojiButton({ onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <Smile size={20} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-12 left-0 z-50">
            <Suspense fallback={<div className="w-[352px] h-[435px] bg-zinc-800 rounded-xl" />}>
              <Picker
                data={data}
                onEmojiSelect={(emoji) => {
                  onSelect(emoji);
                  setOpen(false);
                }}
                theme="dark"
                locale="ru"
                previewPosition="none"
                skinTonePosition="none"
              />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
}
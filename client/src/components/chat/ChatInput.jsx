// client/src/components/chat/ChatInput.jsx

import { useState, useRef } from 'react';
import { SendHorizontal, Smile } from 'lucide-react';
import { EmojiButton } from './EmojiButton';

export function ChatInput({ emit }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    
    emit('chat:message', { text: trimmed });
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText(prev => prev + emoji.native);
    inputRef.current?.focus();
  };

  return (
    <div className="px-3 py-2 border-t border-zinc-800 flex items-end gap-2 shrink-0">
      <EmojiButton onSelect={handleEmojiSelect} />
      
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 500))}
        onKeyDown={handleKeyDown}
        placeholder="Сообщение..."
        rows={1}
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:border-violet-600 resize-none max-h-24 transition-colors"
      />
      
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="p-2 text-violet-500 hover:text-violet-400 disabled:text-zinc-600 transition-colors shrink-0"
      >
        <SendHorizontal size={20} />
      </button>
    </div>
  );
}
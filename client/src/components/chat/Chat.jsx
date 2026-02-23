// client/src/components/chat/Chat.jsx

import { useRef, useEffect, useState } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { ChatMessage } from './ChatMessage';
import { SystemMessage } from './SystemMessage';
import { ChatInput } from './ChatInput';
import { ChevronDown } from 'lucide-react';

export function Chat({ emit, roomId }) {
  const messages = useChatStore(s => s.messages);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [newCount, setNewCount] = useState(0);

  // Автоскролл
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewCount(0);
    } else {
      setNewCount(prev => prev + 1);
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setAutoScroll(isAtBottom);
    if (isAtBottom) setNewCount(0);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScroll(true);
    setNewCount(0);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок */}
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <h3 className="font-semibold text-sm">💬 Чат</h3>
      </div>

      {/* Сообщения */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-1 relative"
      >
        {messages.map((msg) => (
          msg.type === 'system' ? (
            <SystemMessage key={msg.id} message={msg} />
          ) : (
            <ChatMessage key={msg.id} message={msg} emit={emit} />
          )
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Кнопка «Новые сообщения» */}
      {!autoScroll && newCount > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1 shadow-lg z-10"
        >
          <ChevronDown size={14} />
          Новые сообщения ({newCount})
        </button>
      )}

      {/* Ввод */}
      <ChatInput emit={emit} />
    </div>
  );
}
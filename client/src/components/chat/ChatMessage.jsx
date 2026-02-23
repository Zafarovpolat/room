// client/src/components/chat/ChatMessage.jsx

import { useState } from 'react';
import { Avatar } from './Avatar';
import { Reactions } from './Reactions';
import { ReactionPicker } from './ReactionPicker';
import { formatMessageTime } from '../../utils/formatTime';
import { useUserStore } from '../../stores/useUserStore';

export function ChatMessage({ message, emit }) {
  const [showReactions, setShowReactions] = useState(false);
  const myName = useUserStore(s => s.userName);

  return (
    <div
      className="group relative py-1.5 px-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={message.userName} size={32} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm">{message.userName}</span>
            <span className="text-xs text-zinc-500">
              {formatMessageTime(message.createdAt)}
            </span>
          </div>
          <p className="text-sm text-zinc-300 break-words mt-0.5">{message.text}</p>
          
          {/* Реакции */}
          {message.reactions?.length > 0 && (
            <Reactions reactions={message.reactions} messageId={message.id} emit={emit} myName={myName} />
          )}
        </div>
      </div>

      {/* Пикер реакций при hover */}
      {showReactions && (
        <ReactionPicker
          messageId={message.id}
          emit={emit}
        />
      )}
    </div>
  );
}
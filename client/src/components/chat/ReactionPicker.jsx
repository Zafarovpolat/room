// client/src/components/chat/ReactionPicker.jsx

import { QUICK_REACTIONS } from '../../utils/constants';

export function ReactionPicker({ messageId, emit }) {
  const handleReaction = (emoji) => {
    emit('chat:reaction', { messageId, emoji });
  };

  return (
    <div className="absolute -top-3 right-2 bg-zinc-800 border border-zinc-700 rounded-lg px-1 py-0.5 flex items-center gap-0.5 shadow-lg z-10">
      {QUICK_REACTIONS.map(emoji => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          className="p-1 hover:bg-zinc-700 rounded transition-colors text-sm"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
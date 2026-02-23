// client/src/components/chat/Reactions.jsx

export function Reactions({ reactions, messageId, emit, myName }) {
  // Группировать по эмодзи
  const grouped = {};
  reactions.forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(r.userName);
  });

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, users]) => {
        const isMine = users.includes(myName);
        return (
          <button
            key={emoji}
            onClick={() => emit('chat:reaction', { messageId, emoji })}
            className={`px-1.5 py-0.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
              isMine
                ? 'bg-violet-600/20 border border-violet-600/50 text-violet-300'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            {emoji} {users.length}
          </button>
        );
      })}
    </div>
  );
}
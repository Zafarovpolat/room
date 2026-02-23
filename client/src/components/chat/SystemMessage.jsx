// client/src/components/chat/SystemMessage.jsx

export function SystemMessage({ message }) {
  return (
    <div className="text-center py-1">
      <span className="text-xs text-zinc-500">
        ——— {message.text} ———
      </span>
    </div>
  );
}
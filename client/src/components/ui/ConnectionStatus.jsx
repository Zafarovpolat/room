// client/src/components/ui/ConnectionStatus.jsx

import { useRoomStore } from '../../stores/useRoomStore';

export function ConnectionStatus() {
  const connected = useRoomStore(s => s.connected);
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
      <span className="text-zinc-400">
        {connected ? 'Подключено' : 'Отключено'}
      </span>
    </div>
  );
}
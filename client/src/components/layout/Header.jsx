// client/src/components/layout/Header.jsx

import { useRoomStore } from '../../stores/useRoomStore';
import { ConnectionStatus } from '../ui/ConnectionStatus';
import { Button } from '../ui/Button';
import { Copy, History } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { HistoryPanel } from '../history/HistoryPanel';

export function Header({ roomId }) {
  const users = useRoomStore(s => s.users);
  const [showHistory, setShowHistory] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Ссылка скопирована!');
  };

  return (
    <>
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">🎬 SyncRoom</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
            <History size={16} className="mr-1" />
            История
          </Button>
          
          <Button variant="ghost" size="sm" onClick={copyLink}>
            <Copy size={16} className="mr-1" />
            Ссылка
          </Button>

          {/* Онлайн пользователи */}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            {users.map(user => (
              <span key={user} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {user}
              </span>
            ))}
          </div>

          <ConnectionStatus />
        </div>
      </header>

      {showHistory && (
        <HistoryPanel roomId={roomId} onClose={() => setShowHistory(false)} />
      )}
    </>
  );
}
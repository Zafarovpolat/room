// client/src/components/home/HomePage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useUserStore } from '../../stores/useUserStore';
import { createRoom, checkRoom } from '../../api';
import { toast } from 'sonner';

export function HomePage() {
  const navigate = useNavigate();
  const { userName, setUserName } = useUserStore();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!userName.trim() || userName.trim().length < 2) {
      toast.error('Введите имя (минимум 2 символа)');
      return;
    }

    setLoading(true);
    try {
      const { id } = await createRoom();
      setUserName(userName.trim());
      navigate(`/room/${id}`);
    } catch {
      toast.error('Ошибка создания комнаты');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!userName.trim() || userName.trim().length < 2) {
      toast.error('Введите имя (минимум 2 символа)');
      return;
    }
    if (!joinCode.trim()) {
      toast.error('Введите код комнаты');
      return;
    }

    setLoading(true);
    try {
      const room = await checkRoom(joinCode.trim());
      if (!room) {
        toast.error('Комната не найдена');
        return;
      }
      setUserName(userName.trim());
      navigate(`/room/${joinCode.trim()}`);
    } catch {
      toast.error('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎬 SyncRoom</h1>
          <p className="text-zinc-400">Смотрите вместе. Просто.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">👤 Ваше имя</label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Как вас зовут?"
              maxLength={20}
            />
          </div>

          <Button onClick={handleCreate} disabled={loading} className="w-full" size="lg">
            🎬 Создать комнату
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-500 text-sm">или</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">🔗 Код комнаты</label>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Вставьте код"
            />
          </div>

          <Button onClick={handleJoin} disabled={loading} variant="secondary" className="w-full" size="lg">
            🚪 Войти в комнату
          </Button>
        </div>
      </div>
    </div>
  );
}
// client/src/components/layout/RoomPage.jsx

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useUserStore } from '../../stores/useUserStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { useVideoStore } from '../../stores/useVideoStore';
import { Header } from './Header';
import { VideoPlayer } from '../video/VideoPlayer';
import { VideoUrlInput } from '../video/VideoUrlInput';
import { VideoControls } from '../video/VideoControls';
import { Chat } from '../chat/Chat';
import { Playlist } from '../playlist/Playlist';
import { Spinner } from '../ui/Spinner';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

export function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { userName, setUserName } = useUserStore();
  const { connect, emit, disconnect } = useSocket();
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (userName && !joinedRef.current) {
      joinRoom(userName);
    }
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinRoom = (name) => {
    if (joinedRef.current) return;
    joinedRef.current = true;
    setJoining(true);

    const socket = connect();

    const doJoin = () => {
      console.log('[RoomPage] Joining room:', roomId);
      socket.emit('room:join', { roomId, userName: name });
    };

    // Используем .once чтобы не перезаписывать основные обработчики из useSocket
    // и слушаем только один раз для определения успеха/ошибки входа
    const onStateReceived = () => {
      console.log('[RoomPage] Joined successfully (room:state received)');
      setJoined(true);
      setJoining(false);
      useRoomStore.getState().setRoomId(roomId);
    };

    const onNotFound = () => {
      toast.error('Комната не найдена');
      navigate('/');
    };

    const onFull = () => {
      toast.error('Комната заполнена');
      setJoining(false);
      joinedRef.current = false;
    };

    // Подписываемся на события через store вместо перезаписи socket обработчиков
    // room:state уже обрабатывается в useSocket и обновляет store
    // Мы просто ждём когда url появится или users обновятся
    
    // Временные обработчики для ошибок входа
    socket.once('room:notFound', onNotFound);
    socket.once('room:full', onFull);

    // Подписка на изменение users в store — когда мы успешно вошли
    const checkJoined = () => {
      const users = useRoomStore.getState().users;
      const videoUrl = useVideoStore.getState().url;
      console.log('[RoomPage] Checking state: users=', users.length, 'videoUrl=', videoUrl);
      
      // Если есть users — мы вошли
      if (users.length > 0) {
        onStateReceived();
        return true;
      }
      return false;
    };

    // Слушаем обновления store
    // Используем локальную переменную вместо stale-замыкания на joined
    let joinHandled = false;
    const unsub = useRoomStore.subscribe((state) => {
      if (state.users.length > 0 && !joinHandled) {
        joinHandled = true;
        unsub(); // отписываемся ДО вызова onStateReceived, чтобы избежать рекурсии
        onStateReceived();
      }
    });

    // Таймаут на случай если всё уже загружено до подписки
    setTimeout(() => {
      if (!joinHandled && checkJoined()) {
        joinHandled = true;
        unsub();
      }
    }, 100);

    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
    }
  };

  const handleJoinSubmit = () => {
    if (!tempName.trim() || tempName.trim().length < 2) {
      toast.error('Минимум 2 символа');
      return;
    }
    setUserName(tempName.trim());
    joinRoom(tempName.trim());
  };

  if (!userName && !joined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
          <h2 className="text-xl font-bold text-center">Введите имя</h2>
          <Input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Ваше имя"
            maxLength={20}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinSubmit()}
          />
          <Button onClick={handleJoinSubmit} className="w-full" size="lg">
            Войти
          </Button>
        </div>
      </div>
    );
  }

  if (joining || !joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-zinc-400">Подключение к комнате...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-950">
      <Header roomId={roomId} />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <VideoUrlInput emit={emit} />

          <div className="flex-1 min-h-0 bg-black">
            <VideoPlayer emit={emit} />
          </div>

          <VideoControls />
          <Playlist emit={emit} />
        </div>

        <div className="h-[280px] lg:h-auto lg:w-[380px] xl:w-[420px] border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col min-h-0 overflow-hidden">
          <Chat emit={emit} roomId={roomId} />
        </div>
      </div>
    </div>
  );
}
// client/src/components/video/VideoControls.jsx

import { useVideoStore } from '../../stores/useVideoStore';
import { formatVideoTime } from '../../utils/formatTime';

export function VideoControls() {
  const currentTime = useVideoStore(s => s.currentTime);
  const duration = useVideoStore(s => s.duration);
  const playing = useVideoStore(s => s.playing);
  const peerBuffering = useVideoStore(s => s.peerBuffering);
  const peerBufferingUser = useVideoStore(s => s.peerBufferingUser);
  const source = useVideoStore(s => s.source);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Rutube не отдаёт duration через postMessage (только если плеер поддерживает player:durationChange)
  // VK — duration неизвестен, время tracked внутренне
  const noDuration = (source === 'vk' || source === 'rutube') && duration === 0;

  return (
    <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-2">
      {/* Прогресс бар */}
      <div className="w-full h-1 bg-zinc-700 rounded-full mb-2">
        <div
          className="h-full rounded-full transition-all duration-500 bg-violet-600"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Инфо */}
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${playing ? 'bg-green-500' : 'bg-zinc-600'}`} />
          <span>
            {peerBuffering
              ? `${peerBufferingUser} буферизует...`
              : playing
                ? 'Воспроизводится'
                : 'Пауза'}
          </span>
        </div>
        <span>
          {noDuration
            ? `${formatVideoTime(currentTime)} / —:—`
            : `${formatVideoTime(currentTime)} / ${formatVideoTime(duration)}`}
        </span>
      </div>
    </div>
  );
}
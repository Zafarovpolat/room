// client/src/hooks/useKeyboardShortcuts.js

import { useEffect } from 'react';
import { useVideoStore } from '../stores/useVideoStore';

export function useKeyboardShortcuts(emit) {
  const playing = useVideoStore(s => s.playing);
  const currentTime = useVideoStore(s => s.currentTime);
  const volume = useVideoStore(s => s.volume);
  const muted = useVideoStore(s => s.muted);
  const setVolume = useVideoStore(s => s.setVolume);
  const setMuted = useVideoStore(s => s.setMuted);

  useEffect(() => {
    const handler = (e) => {
      // Игнорировать если фокус в текстовом поле
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (playing) {
            emit('video:pause', { time: currentTime });
          } else {
            emit('video:play', { time: currentTime });
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          emit('video:seek', { time: Math.max(0, currentTime - 10) });
          break;

        case 'ArrowRight':
          e.preventDefault();
          emit('video:seek', { time: currentTime + 10 });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;

        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;

        case 'm':
        case 'M':
          setMuted(!muted);
          break;

        case 'f':
        case 'F':
          document.querySelector('.react-player')
            ?.closest('div')
            ?.requestFullscreen?.();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playing, currentTime, volume, muted, emit]);
}
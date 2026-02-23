// client/src/components/video/VideoPlayer.jsx

import { useRef, useEffect, useState, useCallback } from 'react';
import { useVideoStore } from '../../stores/useVideoStore';

// ============ URL парсинг ============

function getVideoInfo(url) {
  if (!url) return null;

  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] };

  const vkMatch = url.match(/vk\.com\/video(-?\d+_\d+)/);
  if (vkMatch) return { type: 'vk', id: vkMatch[1] };
  const vkClipMatch = url.match(/vk\.com\/clip(-?\d+_\d+)/);
  if (vkClipMatch) return { type: 'vk', id: vkClipMatch[1] };

  const rtMatch = url.match(/rutube\.ru\/video\/([a-f0-9]+)/);
  if (rtMatch) return { type: 'rutube', id: rtMatch[1] };

  return null;
}

// ============ URL билдеры ============

function buildVkUrl(info, time = 0, autoplay = true, bust = 0) {
  const parts = info.id.replace(/^-/, '').split('_');
  const oid = info.id.startsWith('-') ? `-${parts[0]}` : parts[0];
  let url = `https://vk.com/video_ext.php?oid=${oid}&id=${parts[1]}&autoplay=${autoplay ? 1 : 0}`;
  if (time > 1) url += `&t=${Math.floor(time)}s`;
  // bust=timestamp гарантирует перезагрузку iframe даже при одинаковых параметрах
  if (bust) url += `&_r=${bust}`;
  return url;
}

function buildRutubeUrl(info, time = 0, autoplay = true) {
  let url = `https://rutube.ru/play/embed/${info.id}?autoplay=${autoplay ? 1 : 0}`;
  if (time > 1) url += `&t=${Math.floor(time)}`;
  return url;
}

// ============ YouTube IFrame API ============

let ytApiLoaded = false;
let ytApiReady = false;
const ytReadyCallbacks = [];

function loadYouTubeApi() {
  if (ytApiLoaded) return;
  ytApiLoaded = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytReadyCallbacks.forEach(cb => cb());
    ytReadyCallbacks.length = 0;
  };
}

function onYtReady(cb) {
  if (ytApiReady) cb();
  else { ytReadyCallbacks.push(cb); loadYouTubeApi(); }
}

// ============ Компонент ============

export function VideoPlayer({ emit }) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const timeTrackerRef = useRef(null);
  const currentTimeRef = useRef(0);
  const lastSyncRef = useRef(0);
  const ignoreRef = useRef(false);
  const currentYtIdRef = useRef(null);
  const lastRemoteActionRef = useRef(null);
  const nonYtCurrentTimeRef = useRef(0);
  const nonYtVideoInfoRef = useRef(null);

  // Rutube: очередь команд до готовности плеера
  const rutubeReadyRef = useRef(false);
  const rutubeQueueRef = useRef([]);
  // Rutube: последняя отправленная команда — для игнорирования эха (не блокируем все события)
  const rutubeCommandSentRef = useRef(null); // { action: 'play'|'pause'|'seek', sentAt: timestamp }

  const url = useVideoStore(s => s.url);
  const [nonYtUrl, setNonYtUrl] = useState(null);
  const [videoType, setVideoType] = useState(null);

  // ======= Rutube postMessage =======
  // targetOrigin='*' — Rutube embed может отдаваться с разных поддоменов
  const sendToRutube = useCallback((type, data) => {
    const msg = data !== undefined ? { type, data } : { type };
    if (!rutubeReadyRef.current) {
      // Плеер ещё не готов — ставим в очередь
      rutubeQueueRef.current.push(msg);
      return;
    }
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), '*');
  }, []);

  const flushRutubeQueue = useCallback(() => {
    const queue = rutubeQueueRef.current.splice(0);
    queue.forEach(msg => {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), '*');
    });
  }, []);

  // ======= Вспомогательные функции =======

  const destroyYtPlayer = useCallback(() => {
    if (timeTrackerRef.current) { clearInterval(timeTrackerRef.current); timeTrackerRef.current = null; }
    if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch { /**/ } ytPlayerRef.current = null; }
    currentYtIdRef.current = null;
  }, []);

  const startTimeTracker = useCallback(() => {
    if (timeTrackerRef.current) clearInterval(timeTrackerRef.current);
    timeTrackerRef.current = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player || typeof player.getCurrentTime !== 'function') return;
      try {
        const time = player.getCurrentTime();
        const dur = player.getDuration();
        currentTimeRef.current = time;
        useVideoStore.getState().setCurrentTime(time);
        if (dur > 0) useVideoStore.getState().setDuration(dur);
        const now = Date.now();
        if (now - lastSyncRef.current > 3000) { emit('video:timeUpdate', { time }); lastSyncRef.current = now; }
      } catch { /**/ }
    }, 500);
  }, [emit]);

  // ======= Реакция на удалённые команды =======
  useEffect(() => {
    const unsub = useVideoStore.subscribe((state) => {
      const action = state.remoteAction;
      if (!action) return;
      if (lastRemoteActionRef.current?.ts === action.ts) return;
      lastRemoteActionRef.current = action;

      // YouTube
      const player = ytPlayerRef.current;
      if (player && typeof player.seekTo === 'function') {
        ignoreRef.current = true;
        if (action.type === 'play') { player.seekTo(action.time, true); player.playVideo(); }
        else if (action.type === 'pause') { player.seekTo(action.time, true); player.pauseVideo(); }
        else if (action.type === 'seek') { player.seekTo(action.time, true); }
        setTimeout(() => { ignoreRef.current = false; useVideoStore.getState().clearRemoteAction(); }, 1000);
        return;
      }

      // Rutube — postMessage (команды могут попасть в очередь если плеер ещё не готов)
      if (videoType === 'rutube') {
        // Запоминаем команду для точечного игнорирования эха вместо глобальной блокировки
        rutubeCommandSentRef.current = { action: action.type, sentAt: Date.now() };
        if (action.type === 'play') {
          sendToRutube('player:setCurrentTime', { time: action.time });
          sendToRutube('player:play');
        } else if (action.type === 'pause') {
          sendToRutube('player:setCurrentTime', { time: action.time });
          sendToRutube('player:pause');
        } else if (action.type === 'seek') {
          sendToRutube('player:setCurrentTime', { time: action.time });
        }
        useVideoStore.getState().clearRemoteAction();
        return;
      }

      // VK — перезагрузка iframe с нужным временем и autoplay
      if (videoType === 'vk' && nonYtVideoInfoRef.current) {
        const autoplay = action.type !== 'pause';
        nonYtCurrentTimeRef.current = action.time;
        useVideoStore.getState().setPlaying(autoplay);
        setNonYtUrl(buildVkUrl(nonYtVideoInfoRef.current, action.time, autoplay, Date.now()));
        useVideoStore.getState().clearRemoteAction();
      }
    });
    return () => unsub();
  }, [videoType, sendToRutube]);

  // ======= postMessage события от Rutube =======
  useEffect(() => {
    if (videoType !== 'rutube') return;

    const handleMessage = (e) => {
      if (!e.origin.includes('rutube.ru')) return;
      try {
        const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!msg?.type) return;

        // Первое сообщение от Rutube = плеер готов, сбрасываем очередь
        if (!rutubeReadyRef.current) {
          rutubeReadyRef.current = true;
          flushRutubeQueue();
        }

        if (msg.type === 'player:currentTime' && msg.data?.time != null) {
          nonYtCurrentTimeRef.current = msg.data.time;
          useVideoStore.getState().setCurrentTime(msg.data.time);
        }
        if (msg.type === 'player:durationChange' && msg.data?.duration) {
          useVideoStore.getState().setDuration(msg.data.duration);
        }
        if (msg.type === 'player:changeState') {
          const s = msg.data?.state;
          // Проверяем — эхо нашей команды или действие пользователя?
          const cmd = rutubeCommandSentRef.current;
          if (cmd) {
            const timeSinceSent = Date.now() - cmd.sentAt;
            const isEcho = timeSinceSent < 2000 && (
              (cmd.action === 'play' && s === 'playing') ||
              (cmd.action === 'pause' && (s === 'paused' || s === 'stopped'))
            );
            if (isEcho) {
              rutubeCommandSentRef.current = null;
              return;
            }
          }
          if (s === 'playing') {
            useVideoStore.getState().setPlaying(true);
            emit('video:play', { time: nonYtCurrentTimeRef.current });
          } else if (s === 'paused' || s === 'stopped') {
            useVideoStore.getState().setPlaying(false);
            emit('video:pause', { time: nonYtCurrentTimeRef.current });
          }
        }
      } catch { /**/ }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [videoType, emit, flushRutubeQueue]);

  // ======= Создание плеера при смене URL =======
  useEffect(() => {
    console.log('[VideoPlayer] URL changed to:', url);

    nonYtCurrentTimeRef.current = 0;

    if (!url) {
      destroyYtPlayer();
      setNonYtUrl(null);
      setVideoType(null);
      nonYtVideoInfoRef.current = null;
      rutubeReadyRef.current = false;
      rutubeQueueRef.current = [];
      return;
    }

    const info = getVideoInfo(url);
    console.log('[VideoPlayer] Parsed info:', info);

    if (!info) {
      destroyYtPlayer();
      setNonYtUrl(null);
      setVideoType(null);
      nonYtVideoInfoRef.current = null;
      return;
    }

    setVideoType(info.type);
    nonYtVideoInfoRef.current = info;

    const savedTime = useVideoStore.getState().currentTime || 0;
    nonYtCurrentTimeRef.current = savedTime;

    // === VK ===
    if (info.type === 'vk') {
      destroyYtPlayer();
      const iframeUrl = buildVkUrl(info, savedTime, true);
      console.log('[VideoPlayer] VK iframe URL:', iframeUrl);
      setNonYtUrl(iframeUrl);
      useVideoStore.getState().setPlaying(true);
      return;
    }

    // === Rutube ===
    if (info.type === 'rutube') {
      destroyYtPlayer();
      // Сброс readiness при новом видео
      rutubeReadyRef.current = false;
      rutubeQueueRef.current = [];
      const iframeUrl = buildRutubeUrl(info, savedTime, true);
      console.log('[VideoPlayer] Rutube iframe URL:', iframeUrl);
      setNonYtUrl(iframeUrl);
      return;
    }

    // === YouTube ===
    setNonYtUrl(null);
    if (currentYtIdRef.current === info.id && ytPlayerRef.current) {
      console.log('[VideoPlayer] Same YT video, skip');
      return;
    }

    console.log('[VideoPlayer] Creating YT player for:', info.id);
    currentYtIdRef.current = info.id;

    onYtReady(() => {
      destroyYtPlayer();
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      const div = document.createElement('div');
      div.id = 'yt-player-' + Date.now();
      containerRef.current.appendChild(div);

      const savedTimeYt = useVideoStore.getState().currentTime || 0;
      const shouldPlayYt = useVideoStore.getState().playing;

      ytPlayerRef.current = new window.YT.Player(div.id, {
        videoId: info.id,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: shouldPlayYt ? 1 : 0, modestbranding: 1, rel: 0, playsinline: 1, start: Math.floor(savedTimeYt) },
        events: {
          onReady: (event) => {
            const dur = event.target.getDuration();
            if (dur > 0) useVideoStore.getState().setDuration(dur);
            if (savedTimeYt > 1) event.target.seekTo(savedTimeYt, true);
            if (shouldPlayYt) event.target.playVideo();
            startTimeTracker();
          },
          onStateChange: (event) => {
            if (ignoreRef.current) return;
            const s = event.data;
            if (s === window.YT.PlayerState.PLAYING) {
              const time = ytPlayerRef.current.getCurrentTime();
              currentTimeRef.current = time;
              useVideoStore.getState().setPlaying(true);
              emit('video:play', { time });
            } else if (s === window.YT.PlayerState.PAUSED) {
              const time = ytPlayerRef.current.getCurrentTime();
              currentTimeRef.current = time;
              useVideoStore.getState().setPlaying(false);
              emit('video:pause', { time });
            } else if (s === window.YT.PlayerState.ENDED) {
              emit('video:ended');
            } else if (s === window.YT.PlayerState.BUFFERING) {
              emit('video:buffering', { isBuffering: true });
            }
            if (s === 1 || s === 2) emit('video:buffering', { isBuffering: false });
          },
        },
      });
    });
  }, [url, emit, destroyYtPlayer, startTimeTracker]);

  useEffect(() => {
    return () => { destroyYtPlayer(); };
  }, [destroyYtPlayer]);

  // ======= Render =======

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950">
        <div className="text-center text-zinc-500">
          <p className="text-6xl mb-4">🎬</p>
          <p className="text-lg">Вставьте ссылку на видео</p>
          <p className="text-sm mt-1">YouTube · VK · Rutube</p>
        </div>
      </div>
    );
  }

  // VK — нативный iframe (VK video_ext.php не отправляет postMessage в родительский фрейм)
  if (nonYtUrl && videoType === 'vk') {
    return (
      <div className="w-full h-full">
        <iframe
          key={nonYtUrl}
          ref={iframeRef}
          src={nonYtUrl}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; screen-wake-lock"
          allowFullScreen
        />
      </div>
    );
  }

  // Rutube — iframe (управляется через postMessage)
  if (nonYtUrl && videoType === 'rutube') {
    return (
      <div className="w-full h-full">
        <iframe
          key={nonYtUrl}
          ref={iframeRef}
          src={nonYtUrl}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; screen-wake-lock"
          allowFullScreen
        />
      </div>
    );
  }

  // YouTube
  return <div ref={containerRef} className="w-full h-full bg-black" />;
}

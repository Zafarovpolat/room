import { create } from 'zustand';

export const useVideoStore = create((set, get) => ({
  url: null,
  title: null,
  source: null,
  playing: false,
  currentTime: 0,
  duration: 0,
  speed: 1.0,
  volume: parseFloat(localStorage.getItem('syncroom_volume') || '0.8'),
  muted: false,
  buffering: false,
  peerBuffering: false,
  peerBufferingUser: null,

  // Специальный флаг — "это удалённая команда, не моя"
  remoteAction: null,

  setUrl: (url) => set({ url }),
  setTitle: (title) => set({ title }),
  setSource: (source) => set({ source }),
  setPlaying: (playing) => set({ playing }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setSpeed: (speed) => set({ speed }),

  setVolume: (volume) => {
    localStorage.setItem('syncroom_volume', String(volume));
    set({ volume });
  },

  setMuted: (muted) => set({ muted }),
  setBuffering: (buffering) => set({ buffering }),

  setPeerBuffering: (peerBuffering, peerBufferingUser) =>
    set({ peerBuffering, peerBufferingUser }),

  // Вызывается при получении video:changed или room:state
  setVideo: ({ url, title, source, currentTime, isPlaying }) => set({
    url: url || null,
    title: title || null,
    source: source || null,
    currentTime: currentTime || 0,
    playing: isPlaying || false,
  }),

  // Удалённые команды — с флагом чтобы VideoPlayer знал что это от другого участника
  remotePlay: (time) => set({
    playing: true,
    currentTime: time,
    remoteAction: { type: 'play', time, ts: Date.now() },
  }),

  remotePause: (time) => set({
    playing: false,
    currentTime: time,
    remoteAction: { type: 'pause', time, ts: Date.now() },
  }),

  remoteSeek: (time) => set({
    currentTime: time,
    remoteAction: { type: 'seek', time, ts: Date.now() },
  }),

  clearRemoteAction: () => set({ remoteAction: null }),
}));
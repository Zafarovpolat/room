import { roomManager } from '../services/roomManager.js';
import { parseVideoUrl } from '../utils/validation.js';
import { db } from '../db/index.js';
import { watchHistory } from '../db/schema.js';

const saveIntervals = new Map();

function startSaveInterval(roomId) {
  if (saveIntervals.has(roomId)) return;
  const interval = setInterval(() => {
    roomManager.saveVideoState(roomId);
  }, 10000);
  saveIntervals.set(roomId, interval);
}

export function videoHandler(io, socket) {

  socket.on('video:play', ({ time }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    console.log(`[Video] ${socket.data.userName} PLAY at ${time}`);

    roomManager.updateVideo(roomId, { isPlaying: true, currentTime: time });
    startSaveInterval(roomId);

    socket.to(roomId).emit('video:play', {
      time,
      userName: socket.data.userName,
    });
  });

  socket.on('video:pause', ({ time }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    console.log(`[Video] ${socket.data.userName} PAUSE at ${time}`);

    roomManager.updateVideo(roomId, { isPlaying: false, currentTime: time });

    socket.to(roomId).emit('video:pause', {
      time,
      userName: socket.data.userName,
    });
  });

  socket.on('video:seek', ({ time }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    console.log(`[Video] ${socket.data.userName} SEEK to ${time}`);

    roomManager.updateVideo(roomId, { currentTime: time });

    socket.to(roomId).emit('video:seek', {
      time,
      userName: socket.data.userName,
    });
  });

  socket.on('video:change', async ({ url, title, source }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    console.log(`[Video] ${socket.data.userName} CHANGE video: ${url}`);

    const parsed = parseVideoUrl(url);
    if (!parsed.valid) {
      socket.emit('room:error', { message: 'Невалидная ссылка' });
      return;
    }

    // Записать предыдущее видео в историю
    const rooms = roomManager.getActiveRooms();
    const room = rooms.get(roomId);
    if (room && room.video.url) {
      const users = room.users.map(u => u.userName);
      try {
        await db.insert(watchHistory).values({
          roomId,
          url: room.video.url,
          title: room.video.title || 'Без названия',
          source: room.video.source || 'unknown',
          watchedBy: JSON.stringify(users),
        });
      } catch (err) {
        console.error('[History] Error saving:', err.message);
      }
    }

    roomManager.updateVideo(roomId, {
      url,
      title: title || 'Без названия',
      source: parsed.type,
      currentTime: 0,
      isPlaying: true,
    });

    startSaveInterval(roomId);

    // ОБОИМ
    io.to(roomId).emit('video:changed', {
      url,
      title: title || 'Без названия',
      source: parsed.type,
      userName: socket.data.userName,
    });

    console.log(`[Video] Sent video:changed to room ${roomId}`);
  });

  socket.on('video:speed', ({ speed }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    roomManager.updateVideo(roomId, { speed });
    socket.to(roomId).emit('video:speedChanged', { speed });
  });

  socket.on('video:timeUpdate', ({ time }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    roomManager.updateVideo(roomId, { currentTime: time });
  });

  socket.on('video:buffering', ({ isBuffering }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('video:peerBuffering', {
      userName: socket.data.userName,
      isBuffering,
    });
  });

  socket.on('video:ended', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const rooms = roomManager.getActiveRooms();
    const room = rooms.get(roomId);
    if (!room) return;

    const currentIndex = room.playlist.findIndex(
      item => item.url === room.video.url
    );

    if (currentIndex !== -1 && currentIndex < room.playlist.length - 1) {
      const next = room.playlist[currentIndex + 1];
      roomManager.updateVideo(roomId, {
        url: next.url,
        title: next.title,
        source: next.source,
        currentTime: 0,
        isPlaying: true,
      });

      io.to(roomId).emit('video:changed', {
        url: next.url,
        title: next.title,
        source: next.source,
        userName: 'Плейлист',
      });
    }
  });
}
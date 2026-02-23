// server/socket/playlistHandler.js

import { nanoid } from 'nanoid';
import { roomManager } from '../services/roomManager.js';
import { parseVideoUrl } from '../utils/validation.js';
import { db } from '../db/index.js';
import { playlistItems } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export function playlistHandler(io, socket) {

  socket.on('playlist:add', async ({ url, title, source, thumbnail }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const parsed = parseVideoUrl(url);
    if (!parsed.valid) {
      socket.emit('room:error', { message: 'Невалидная ссылка' });
      return;
    }

    const rooms = roomManager.getActiveRooms();
    const room = rooms.get(roomId);
    if (!room) return;

    const item = {
      id: nanoid(),
      url,
      title: title || 'Без названия',
      source: parsed.type,
      thumbnail: thumbnail || null,
      duration: null,
      position: room.playlist.length,
      addedBy: socket.data.userName,
    };

    room.playlist.push(item);

    // Сохранить в БД
    try {
      await db.insert(playlistItems).values({
        ...item,
        roomId,
      });
    } catch (err) {
      console.error('[Playlist] Error saving:', err.message);
    }

    io.to(roomId).emit('playlist:updated', { playlist: room.playlist });
  });

  socket.on('playlist:remove', async ({ itemId }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const rooms = roomManager.getActiveRooms();
    const room = rooms.get(roomId);
    if (!room) return;

    room.playlist = room.playlist.filter(item => item.id !== itemId);
    // Пересчитать позиции
    room.playlist.forEach((item, i) => { item.position = i; });

    try {
      await db.delete(playlistItems).where(eq(playlistItems.id, itemId));
    } catch (err) {
      console.error('[Playlist] Error removing:', err.message);
    }

    io.to(roomId).emit('playlist:updated', { playlist: room.playlist });
  });

  socket.on('playlist:reorder', async ({ orderedIds }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const rooms = roomManager.getActiveRooms();
    const room = rooms.get(roomId);
    if (!room) return;

    // Пересортировать
    const newPlaylist = [];
    for (const id of orderedIds) {
      const item = room.playlist.find(p => p.id === id);
      if (item) {
        item.position = newPlaylist.length;
        newPlaylist.push(item);
      }
    }
    room.playlist = newPlaylist;

    // Обновить позиции в БД
    try {
      for (const item of newPlaylist) {
        await db.update(playlistItems)
          .set({ position: item.position })
          .where(eq(playlistItems.id, item.id));
      }
    } catch (err) {
      console.error('[Playlist] Error reordering:', err.message);
    }

    io.to(roomId).emit('playlist:updated', { playlist: room.playlist });
  });

  socket.on('playlist:select', ({ itemId }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const rooms = roomManager.getActiveRooms();
    const room = rooms.get(roomId);
    if (!room) return;

    const item = room.playlist.find(p => p.id === itemId);
    if (!item) return;

    roomManager.updateVideo(roomId, {
      url: item.url,
      title: item.title,
      source: item.source,
      currentTime: 0,
      isPlaying: true,
    });

    io.to(roomId).emit('video:changed', {
      url: item.url,
      title: item.title,
      source: item.source,
      userName: socket.data.userName,
    });
  });

  socket.on('playlist:clear', async () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const rooms = roomManager.getActiveRooms();
    const room = rooms.get(roomId);
    if (!room) return;

    room.playlist = [];

    try {
      await db.delete(playlistItems).where(eq(playlistItems.roomId, roomId));
    } catch (err) {
      console.error('[Playlist] Error clearing:', err.message);
    }

    io.to(roomId).emit('playlist:updated', { playlist: [] });
  });
}
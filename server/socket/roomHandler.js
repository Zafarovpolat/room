// server/socket/roomHandler.js

import { roomManager } from '../services/roomManager.js';
import { validateUserName } from '../utils/validation.js';

export function roomHandler(io, socket) {

  socket.on('room:join', async ({ roomId, userName }) => {
    console.log(`[Room] Join request: ${userName} → ${roomId}`);

    if (!validateUserName(userName)) {
      socket.emit('room:error', { message: 'Невалидное имя' });
      return;
    }

    const room = await roomManager.getRoom(roomId);
    if (!room) {
      console.log(`[Room] Room ${roomId} not found`);
      socket.emit('room:notFound');
      return;
    }

    if (room.users.length >= 2) {
      console.log(`[Room] Room ${roomId} is full`);
      socket.emit('room:full');
      return;
    }

    const added = roomManager.addUser(roomId, socket.id, userName.trim());
    if (!added) {
      socket.emit('room:error', { message: 'Не удалось войти' });
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userName = userName.trim();

    // Подготовить состояние для отправки
    const videoState = {
      url: room.video.url,
      title: room.video.title,
      source: room.video.source,
      currentTime: room.video.currentTime,
      isPlaying: room.video.isPlaying,
      speed: room.video.speed,
    };

    console.log(`[Room ${roomId}] Sending state to ${userName}:`);
    console.log(`[Room ${roomId}] - video.url: ${videoState.url}`);
    console.log(`[Room ${roomId}] - video.currentTime: ${videoState.currentTime}`);
    console.log(`[Room ${roomId}] - video.isPlaying: ${videoState.isPlaying}`);

    socket.emit('room:state', {
      room: {
        id: room.id,
        users: room.users.map(u => u.userName),
      },
      video: videoState,
      messages: room.messagesCache,
      playlist: room.playlist,
    });

    socket.to(roomId).emit('room:userJoined', { userName: userName.trim() });

    console.log(`[Room ${roomId}] ${userName} joined (${room.users.length}/2)`);
  });

  socket.on('disconnect', () => {
    const info = roomManager.findUserRoom(socket.id);
    if (!info) return;

    const { roomId, userName } = info;
    roomManager.removeUser(roomId, socket.id);

    socket.to(roomId).emit('room:userLeft', { userName });
    console.log(`[Room ${roomId}] ${userName} left`);
  });
}
// server/socket/chatHandler.js

import { nanoid } from 'nanoid';
import { roomManager } from '../services/roomManager.js';
import { messageBuffer } from '../services/messageBuffer.js';
import { db } from '../db/index.js';
import { reactions } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';

export function chatHandler(io, socket) {

  socket.on('chat:message', ({ text }) => {
    const roomId = socket.data.roomId;
    const userName = socket.data.userName;
    if (!roomId || !userName || !text) return;

    // Обрезать и валидировать
    const cleanText = text.trim().slice(0, 500);
    if (cleanText.length === 0) return;

    const message = {
      id: nanoid(),
      roomId,
      userName,
      text: cleanText,
      type: 'user',
      createdAt: new Date().toISOString(),
      reactions: [],
    };

    // В RAM кеш
    roomManager.addMessageToCache(roomId, message);

    // В буфер для записи в БД
    messageBuffer.add(message);

    // Отправить обоим
    io.to(roomId).emit('chat:message', message);
  });

  // Системные сообщения (вызываются из других хендлеров)
  socket.on('chat:system', ({ text }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const message = {
      id: nanoid(),
      roomId,
      userName: 'system',
      text,
      type: 'system',
      createdAt: new Date().toISOString(),
      reactions: [],
    };

    roomManager.addMessageToCache(roomId, message);
    messageBuffer.add(message);
    io.to(roomId).emit('chat:message', message);
  });

  socket.on('chat:reaction', async ({ messageId, emoji }) => {
    const roomId = socket.data.roomId;
    const userName = socket.data.userName;
    if (!roomId || !userName || !messageId || !emoji) return;

    const allowedEmojis = ['😂', '❤️', '👍', '👎', '😮', '🔥'];
    if (!allowedEmojis.includes(emoji)) return;

    try {
      // Попробовать вставить (toggle: если есть — удалить)
      const existing = await db.select()
        .from(reactions)
        .where(and(
          eq(reactions.messageId, messageId),
          eq(reactions.userName, userName)
        ));

      if (existing.length > 0) {
        if (existing[0].emoji === emoji) {
          // Убрать реакцию
          await db.delete(reactions).where(eq(reactions.id, existing[0].id));
          io.to(roomId).emit('chat:reaction', {
            messageId, userName, emoji, action: 'remove',
          });
        } else {
          // Заменить на другую
          await db.update(reactions)
            .set({ emoji })
            .where(eq(reactions.id, existing[0].id));
          io.to(roomId).emit('chat:reaction', {
            messageId, userName, emoji: existing[0].emoji, action: 'remove',
          });
          io.to(roomId).emit('chat:reaction', {
            messageId, userName, emoji, action: 'add',
          });
        }
      } else {
        // Новая реакция
        await db.insert(reactions).values({ messageId, userName, emoji });
        io.to(roomId).emit('chat:reaction', {
          messageId, userName, emoji, action: 'add',
        });
      }
    } catch (err) {
      console.error('[Reaction] Error:', err.message);
    }
  });
}
// server/routes/rooms.js

import { db } from '../db/index.js';
import { rooms, messages, watchHistory } from '../db/schema.js';
import { eq, desc, lt, and } from 'drizzle-orm';
import { roomManager } from '../services/roomManager.js';

export async function roomRoutes(fastify) {

  // Создать комнату
  fastify.post('/api/rooms', async (request, reply) => {
    const room = await roomManager.createRoom();
    return { id: room.id };
  });

  // Проверить существование
  fastify.get('/api/rooms/:id', async (request, reply) => {
    const { id } = request.params;
    const room = await roomManager.getRoom(id);
    if (!room) {
      reply.code(404);
      return { error: 'Room not found' };
    }
    return {
      id: room.id,
      usersCount: room.users.length,
    };
  });

  // Загрузить историю чата (пагинация)
  fastify.get('/api/rooms/:id/messages', async (request, reply) => {
    const { id } = request.params;
    const { cursor, limit = 50 } = request.query;
    const limitNum = Math.min(parseInt(limit) || 50, 100);

    let query = db.select()
      .from(messages)
      .where(eq(messages.roomId, id))
      .orderBy(desc(messages.createdAt))
      .limit(limitNum + 1);

    if (cursor) {
      query = db.select()
        .from(messages)
        .where(and(
          eq(messages.roomId, id),
          lt(messages.createdAt, new Date(cursor))
        ))
        .orderBy(desc(messages.createdAt))
        .limit(limitNum + 1);
    }

    const result = await query;
    const hasMore = result.length > limitNum;
    const items = result.slice(0, limitNum).reverse();

    return { messages: items, hasMore };
  });

  // История просмотров
  fastify.get('/api/rooms/:id/history', async (request, reply) => {
    const { id } = request.params;
    const { cursor, limit = 20 } = request.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);

    let conditions = [eq(watchHistory.roomId, id)];
    if (cursor) {
      conditions.push(lt(watchHistory.id, parseInt(cursor)));
    }

    const result = await db.select()
      .from(watchHistory)
      .where(and(...conditions))
      .orderBy(desc(watchHistory.watchedAt))
      .limit(limitNum + 1);

    const hasMore = result.length > limitNum;
    const items = result.slice(0, limitNum);

    return { items, hasMore };
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', uptime: process.uptime() };
  });
}
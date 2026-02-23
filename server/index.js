// server/index.js

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { roomRoutes } from './routes/rooms.js';
import { setupSocket } from './socket/index.js';
import { messageBuffer } from './services/messageBuffer.js';
import { cleanupOldRooms } from './utils/cleanup.js';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Fastify
const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: CLIENT_URL,
  credentials: true,
});

// REST маршруты
await fastify.register(roomRoutes);

// Запуск HTTP сервера
await fastify.listen({ port: PORT, host: '0.0.0.0' });

// Socket.io поверх Fastify
const io = new Server(fastify.server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

setupSocket(io);

// Запустить буфер сообщений
messageBuffer.start(5000);

// Автоочистка старых комнат — каждые 24 часа
setInterval(cleanupOldRooms, 24 * 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] Shutting down...');
  messageBuffer.stop();
  io.close();
  await fastify.close();
  process.exit(0);
});

console.log(`
╔═══════════════════════════════════╗
║     SyncRoom Server Started       ║
║     Port: ${PORT}                    ║
║     Client: ${CLIENT_URL}    ║
╚═══════════════════════════════════╝
`);
// server/socket/index.js

import { roomHandler } from './roomHandler.js';
import { videoHandler } from './videoHandler.js';
import { chatHandler } from './chatHandler.js';
import { playlistHandler } from './playlistHandler.js';

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    roomHandler(io, socket);
    videoHandler(io, socket);
    chatHandler(io, socket);
    playlistHandler(io, socket);

    socket.on('error', (err) => {
      console.error(`[Socket] Error: ${err.message}`);
    });
  });
}
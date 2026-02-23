// server/services/messageBuffer.js

import { db } from '../db/index.js';
import { messages } from '../db/schema.js';

class MessageBuffer {
  constructor() {
    this.buffer = [];
    this.interval = null;
  }

  add(message) {
    this.buffer.push({
      id: message.id,
      roomId: message.roomId,
      userName: message.userName,
      text: message.text,
      type: message.type || 'user',
      createdAt: new Date(message.createdAt),
    });
  }

  async flush() {
    if (this.buffer.length === 0) return;
    
    const batch = this.buffer.splice(0);
    try {
      await db.insert(messages).values(batch);
      console.log(`[MessageBuffer] Flushed ${batch.length} messages to DB`);
    } catch (err) {
      console.error('[MessageBuffer] Error flushing:', err.message);
      // Вернуть обратно в буфер при ошибке
      this.buffer.unshift(...batch);
    }
  }

  start(intervalMs = 5000) {
    this.interval = setInterval(() => this.flush(), intervalMs);
    console.log(`[MessageBuffer] Started with ${intervalMs}ms interval`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.flush(); // финальный flush
    }
  }
}

export const messageBuffer = new MessageBuffer();
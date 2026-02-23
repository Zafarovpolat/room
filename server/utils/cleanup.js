// server/utils/cleanup.js

import { db } from '../db/index.js';
import { rooms } from '../db/schema.js';
import { lt } from 'drizzle-orm';

export async function cleanupOldRooms() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  try {
    const result = await db.delete(rooms)
      .where(lt(rooms.lastActivity, thirtyDaysAgo));
    console.log(`[Cleanup] Removed old rooms`);
  } catch (err) {
    console.error('[Cleanup] Error:', err.message);
  }
}
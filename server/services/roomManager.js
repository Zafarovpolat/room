import { db } from '../db/index.js';
import { rooms, messages, playlistItems } from '../db/schema.js';
import { eq, desc, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const activeRooms = new Map();

export const roomManager = {

  async createRoom() {
    const id = nanoid(8);
    await db.insert(rooms).values({ id });

    const room = {
      id,
      users: [],
      video: {
        url: null,
        title: null,
        source: null,
        currentTime: 0,
        isPlaying: false,
        speed: 1.0,
      },
      playlist: [],
      messagesCache: [],
    };

    activeRooms.set(id, room);
    return room;
  },

  async getRoom(roomId) {
    if (activeRooms.has(roomId)) {
      return activeRooms.get(roomId);
    }

    const [dbRoom] = await db.select().from(rooms).where(eq(rooms.id, roomId));
    if (!dbRoom) return null;

    // Загрузить сообщения
    const dbMessages = await db.select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(100);

    // Загрузить плейлист
    const dbPlaylist = await db.select()
      .from(playlistItems)
      .where(eq(playlistItems.roomId, roomId))
      .orderBy(asc(playlistItems.position));

    const room = {
      id: dbRoom.id,
      users: [],
      video: {
        url: dbRoom.currentVideoUrl || null,
        title: dbRoom.currentVideoTitle || null,
        source: dbRoom.currentVideoSource || null,
        currentTime: dbRoom.currentTime || 0,
        isPlaying: false,
        speed: dbRoom.playbackSpeed || 1.0,
      },
      playlist: dbPlaylist.map(item => ({
        id: item.id,
        url: item.url,
        title: item.title,
        source: item.source,
        thumbnail: item.thumbnail,
        duration: item.duration,
        position: item.position,
        addedBy: item.addedBy,
      })),
      messagesCache: dbMessages.reverse().map(msg => ({
        id: msg.id,
        userName: msg.userName,
        text: msg.text,
        type: msg.type,
        createdAt: msg.createdAt,
        reactions: [],
      })),
    };

    activeRooms.set(roomId, room);
    return room;
  },

  addUser(roomId, socketId, userName) {
    const room = activeRooms.get(roomId);
    if (!room) return false;
    if (room.users.length >= 2) return false;
    room.users.push({ socketId, userName });
    return true;
  },

  removeUser(roomId, socketId) {
    const room = activeRooms.get(roomId);
    if (!room) return null;
    const idx = room.users.findIndex(u => u.socketId === socketId);
    if (idx === -1) return null;
    const user = room.users.splice(idx, 1)[0];
    return user;
  },

  findUserRoom(socketId) {
    for (const [roomId, room] of activeRooms) {
      const user = room.users.find(u => u.socketId === socketId);
      if (user) return { roomId, userName: user.userName };
    }
    return null;
  },

  updateVideo(roomId, videoUpdate) {
    const room = activeRooms.get(roomId);
    if (!room) return;
    Object.assign(room.video, videoUpdate);
  },

  async saveVideoState(roomId) {
    const room = activeRooms.get(roomId);
    if (!room) return;

    try {
      await db.update(rooms).set({
        currentVideoUrl: room.video.url,
        currentVideoTitle: room.video.title,
        currentVideoSource: room.video.source,
        currentTime: room.video.currentTime,
        isPlaying: room.video.isPlaying,
        playbackSpeed: room.video.speed,
        lastActivity: new Date(),
      }).where(eq(rooms.id, roomId));
    } catch (err) {
      console.error('[RoomManager] saveVideoState error:', err.message);
    }
  },

  addMessageToCache(roomId, message) {
    const room = activeRooms.get(roomId);
    if (!room) return;
    room.messagesCache.push(message);
    if (room.messagesCache.length > 200) {
      room.messagesCache = room.messagesCache.slice(-200);
    }
  },

  getActiveRooms() {
    return activeRooms;
  },
};
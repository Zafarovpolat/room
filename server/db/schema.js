// server/db/schema.js

import { pgTable, varchar, text, timestamp, real, boolean, integer, serial, unique } from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
  id: varchar('id', { length: 10 }).primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),
  lastActivity: timestamp('last_activity').defaultNow(),
  currentVideoUrl: text('current_video_url'),
  currentVideoTitle: text('current_video_title'),
  currentVideoSource: varchar('current_video_source', { length: 10 }),
  currentTime: real('current_time').default(0),
  isPlaying: boolean('is_playing').default(false),
  playbackSpeed: real('playback_speed').default(1.0),
});

export const messages = pgTable('messages', {
  id: varchar('id', { length: 21 }).primaryKey(),
  roomId: varchar('room_id', { length: 10 }).notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  userName: varchar('user_name', { length: 20 }).notNull(),
  text: text('text').notNull(),
  type: varchar('type', { length: 10 }).default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reactions = pgTable('reactions', {
  id: serial('id').primaryKey(),
  messageId: varchar('message_id', { length: 21 }).notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userName: varchar('user_name', { length: 20 }).notNull(),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  unique('unique_reaction').on(table.messageId, table.userName),
]);

export const playlistItems = pgTable('playlist_items', {
  id: varchar('id', { length: 21 }).primaryKey(),
  roomId: varchar('room_id', { length: 10 }).notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: text('title'),
  source: varchar('source', { length: 10 }).notNull(),
  thumbnail: text('thumbnail'),
  duration: varchar('duration', { length: 10 }),
  position: integer('position').notNull(),
  addedBy: varchar('added_by', { length: 20 }),
  addedAt: timestamp('added_at').defaultNow(),
});

export const watchHistory = pgTable('watch_history', {
  id: serial('id').primaryKey(),
  roomId: varchar('room_id', { length: 10 }).notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: text('title'),
  source: varchar('source', { length: 10 }).notNull(),
  thumbnail: text('thumbnail'),
  duration: varchar('duration', { length: 10 }),
  watchedBy: text('watched_by').notNull(),
  watchedAt: timestamp('watched_at').defaultNow(),
});